import { randomUUID } from "node:crypto";

import type { RoleLens } from "../lens/roleLens";

import {
  buildTwinCacheKey,
  getCachedTwinResponse,
  setCachedTwinResponse,
} from "./cache";
import {
  classifyTwinMessage,
  type ScopeClassificationResult,
} from "./classifier";
import { loadTwinCorpusContext } from "./corpus";
import { selectTwinDeflection } from "./deflections";
import {
  assembleTwinPrompt,
  type PromptHistoryTurn,
  type PromptContextChunk,
} from "./prompt";
import { localFallbackProvider } from "./providers/local";
import { groqProvider } from "./providers/groq";
import { openRouterProvider } from "./providers/openrouter";
import type { TwinProvider, TwinProviderOutput } from "./providers/types";
import { checkTwinRateLimit } from "./rateLimit";
import { retrieveTwinContext, type RetrievedChunk } from "./retrieval";
import { validateTwinResponse } from "./validator";

const HOURLY_POLICY = { maxRequests: 10, windowMs: 60 * 60 * 1000 };
const DAILY_CONVERSATION_POLICY = { maxRequests: 30, windowMs: 24 * 60 * 60 * 1000 };
const PROVIDER_EXHAUSTED_MESSAGE =
  "No more external LLM capacity available today. Please retry tomorrow.";
let providerRotationCursor = 0;

export interface TwinChatTurnInput {
  message: string;
  conversationId?: string;
  history?: PromptHistoryTurn[];
  ipAddress?: string;
  roleLens?: RoleLens;
}

export interface TwinChatTurnResult {
  conversationId: string;
  response: string;
  cached: boolean;
  roleLens: RoleLens;
  classification: ScopeClassificationResult;
  retrieval: RetrievedChunk[];
  providerId: string;
  providerModel: string;
  validator: {
    passed: boolean;
    flags: string[];
  };
  latencyMs: number;
}

export class TwinChatError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface PipelineDependencies {
  providers: TwinProvider[];
}

function getDefaultProviders(): TwinProvider[] {
  return [groqProvider, openRouterProvider, localFallbackProvider];
}

function toPromptChunks(chunks: RetrievedChunk[]): PromptContextChunk[] {
  return chunks.map((chunk) => ({
    id: chunk.id,
    score: chunk.score,
    text: chunk.text,
    sourceFile: chunk.sourceFile,
  }));
}

function isProviderRateLimited(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes(" 429") ||
    normalized.includes("(429)") ||
    normalized.includes("rate limit") ||
    normalized.includes("rate-limit") ||
    normalized.includes("rate_limited") ||
    normalized.includes("quota") ||
    normalized.includes("tokens per day") ||
    normalized.includes("too many requests")
  );
}

function rotateExternalProviders(providers: TwinProvider[]): TwinProvider[] {
  const hasGroq = providers.some((provider) => provider.id === "groq");
  const hasOpenRouter = providers.some((provider) => provider.id === "openrouter");

  if (!hasGroq || !hasOpenRouter) {
    return providers;
  }

  const preferGroq = providerRotationCursor % 2 === 0;
  providerRotationCursor += 1;

  const rank = (provider: TwinProvider): number => {
    if (provider.id === "groq") {
      return preferGroq ? 0 : 1;
    }
    if (provider.id === "openrouter") {
      return preferGroq ? 1 : 0;
    }
    return 2;
  };

  return [...providers].sort((left, right) => rank(left) - rank(right));
}

async function generateWithProviders(
  prompt: string,
  providers: TwinProvider[]
): Promise<TwinProviderOutput> {
  const errors: string[] = [];
  const fallbackProvider = providers.find(
    (provider) => provider.id === "local-fallback"
  );
  const externalProviders = rotateExternalProviders(
    providers.filter((provider) => provider.id !== "local-fallback")
  );
  const configuredExternalProviderIds = new Set<string>();
  const rateLimitedExternalProviderIds = new Set<string>();

  for (const provider of externalProviders) {
    if (!provider.isConfigured()) {
      errors.push(`${provider.id}:not_configured`);
      continue;
    }

    configuredExternalProviderIds.add(provider.id);

    try {
      return await provider.generate({ prompt, temperature: 0.2, maxTokens: 650 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.id}:${message}`);
      if (isProviderRateLimited(message)) {
        rateLimitedExternalProviderIds.add(provider.id);
      }
    }
  }

  const allConfiguredExternalsRateLimited =
    configuredExternalProviderIds.size >= 2 &&
    configuredExternalProviderIds.size === rateLimitedExternalProviderIds.size;

  if (allConfiguredExternalsRateLimited) {
    throw new TwinChatError(429, "provider_rate_limited", PROVIDER_EXHAUSTED_MESSAGE);
  }

  if (fallbackProvider && fallbackProvider.isConfigured()) {
    console.warn(
      "[twin-chat] external providers failed, using fallback:",
      errors.join(" | ")
    );
    try {
      return await fallbackProvider.generate({
        prompt,
        temperature: 0.2,
        maxTokens: 650,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${fallbackProvider.id}:${message}`);
    }
  }

  throw new TwinChatError(
    503,
    "provider_unavailable",
    `No twin provider available. ${errors.join(" | ")}`
  );
}

function logTwinTurn(entry: Record<string, unknown>): void {
  // Structured logging for observability and later abuse review.
  console.info("[twin-chat]", JSON.stringify(entry));
}

function buildRateLimitKey(prefix: string, value: string): string {
  return `${prefix}:${value}`;
}

export async function runTwinChatTurn(
  input: TwinChatTurnInput,
  dependencies: PipelineDependencies = { providers: getDefaultProviders() }
): Promise<TwinChatTurnResult> {
  const startedAt = Date.now();
  const message = input.message.trim();
  const conversationId = input.conversationId ?? randomUUID();
  const ipAddress = input.ipAddress ?? "unknown";
  const history = input.history ?? [];
  const roleLens = input.roleLens ?? "general";

  if (!message) {
    throw new TwinChatError(400, "invalid_request", "Message cannot be empty.");
  }

  const ipRateLimit = await checkTwinRateLimit(
    buildRateLimitKey("ip", ipAddress),
    HOURLY_POLICY
  );
  if (!ipRateLimit.allowed) {
    throw new TwinChatError(
      429,
      "rate_limited_ip",
      "Rate limit exceeded for this IP."
    );
  }

  const conversationRateLimit = await checkTwinRateLimit(
    buildRateLimitKey("conversation", conversationId),
    DAILY_CONVERSATION_POLICY
  );
  if (!conversationRateLimit.allowed) {
    throw new TwinChatError(
      429,
      "rate_limited_conversation",
      "Rate limit exceeded for this conversation."
    );
  }

  const cacheKey = buildTwinCacheKey(message, roleLens);
  const cacheHit = getCachedTwinResponse(cacheKey);
  const classification = classifyTwinMessage(message);

  if (cacheHit) {
    return {
      conversationId,
      response: cacheHit.response,
      cached: true,
      roleLens,
      classification,
      retrieval: [],
      providerId: cacheHit.providerId,
      providerModel: "cache",
      validator: {
        passed: true,
        flags: [],
      },
      latencyMs: Date.now() - startedAt,
    };
  }

  if (classification.decision === "out_of_scope") {
    const response = selectTwinDeflection(classification.category);
    return {
      conversationId,
      response,
      cached: false,
      roleLens,
      classification,
      retrieval: [],
      providerId: "policy-deflection",
      providerModel: "n/a",
      validator: {
        passed: true,
        flags: [],
      },
      latencyMs: Date.now() - startedAt,
    };
  }

  const retrieval = retrieveTwinContext(message, { topK: 5 });
  const corpus = loadTwinCorpusContext();

  const prompt = assembleTwinPrompt({
    userInput: message,
    conversationHistory: history,
    retrievedChunks: toPromptChunks(retrieval),
    corpus,
    roleLens,
  });

  const providerOutput = await generateWithProviders(prompt, dependencies.providers);
  const validatorResult = validateTwinResponse(providerOutput.text);

  let response = providerOutput.text;
  let providerId = providerOutput.providerId;
  let providerModel = providerOutput.model;

  if (!validatorResult.passed) {
    response = selectTwinDeflection(classification.category);
    providerId = "validator-deflection";
    providerModel = "n/a";
  }

  if (validatorResult.passed && classification.decision === "in_scope") {
    setCachedTwinResponse(cacheKey, {
      response,
      providerId,
      createdAt: Date.now(),
    });
  }

  const latencyMs = Date.now() - startedAt;
  logTwinTurn({
    conversationId,
    ipAddress,
    classification: classification.decision,
    category: classification.category,
    roleLens,
    providerId,
    providerModel,
    validatorPassed: validatorResult.passed,
    validatorFlags: validatorResult.flags,
    retrievalCount: retrieval.length,
    latencyMs,
  });

  return {
    conversationId,
    response,
    cached: false,
    roleLens,
    classification,
    retrieval,
    providerId,
    providerModel,
    validator: {
      passed: validatorResult.passed,
      flags: validatorResult.flags,
    },
    latencyMs,
  };
}
