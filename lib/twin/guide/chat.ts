import { randomUUID } from "node:crypto";
import type { RoleLens } from "../../lens/roleLens";

import {
  classifyTwinMessage,
} from "../classifier";
import { loadTwinCorpusContext } from "../corpus";
import { groqProvider } from "../providers/groq";
import { localFallbackProvider } from "../providers/local";
import { openRouterProvider } from "../providers/openrouter";
import type { TwinProvider, TwinProviderOutput } from "../providers/types";
import { retrieveTwinContext, type RetrievedChunk } from "../retrieval";
import { validateTwinResponse } from "../validator";
import {
  maxGuideChars,
  type MascotGuideRequest,
  type MascotGuideSuccessResponse,
} from "./contracts";
import { assembleTwinGuidePrompt, buildGuideQueryText } from "./prompt";
import { buildGuideTemplate } from "./tour";

const DEFAULT_WEAK_CONTEXT_THRESHOLD = 0.1;

const LENS_SIGNAL_RULES: Record<
  Exclude<RoleLens, "general">,
  { prefix: string; keywords: string[] }
> = {
  cloud: {
    prefix: "From a cloud reliability lens,",
    keywords: ["cloud", "infrastructure", "deployment", "platform", "reliability"],
  },
  ml: {
    prefix: "From an ML evaluation lens,",
    keywords: ["ml", "model", "evaluation", "data", "inference"],
  },
  ai: {
    prefix: "From an AI systems lens,",
    keywords: ["ai", "llm", "pipeline", "safety", "evaluation"],
  },
  cyber: {
    prefix: "From a cybersecurity lens,",
    keywords: ["security", "cyber", "threat", "risk", "mitigation"],
  },
  "ui-ux": {
    prefix: "From a UI/UX execution lens,",
    keywords: ["ui", "ux", "interaction", "workflow", "interface"],
  },
};

export type TwinGuideTurnInput = MascotGuideRequest;

export type TwinGuideTurnResult = MascotGuideSuccessResponse;

export class TwinGuideError extends Error {
  status: number;
  code: "invalid_payload" | "internal_error" | "not_ready";

  constructor(
    status: number,
    code: "invalid_payload" | "internal_error" | "not_ready",
    message: string
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface PipelineDependencies {
  providers: TwinProvider[];
  now?: () => number;
  idFactory?: () => string;
  weakContextThreshold?: number;
}

function getDefaultProviders(): TwinProvider[] {
  return [groqProvider, openRouterProvider, localFallbackProvider];
}

async function generateWithProviders(
  prompt: string,
  providers: TwinProvider[]
): Promise<TwinProviderOutput> {
  const errors: string[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      errors.push(`${provider.id}:not_configured`);
      continue;
    }

    try {
      return await provider.generate({
        prompt,
        temperature: 0.2,
        maxTokens: 350,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${provider.id}:${message}`);
    }
  }

  throw new TwinGuideError(
    503,
    "not_ready",
    `Guide provider chain unavailable. ${errors.join(" | ")}`
  );
}

function trimToWordBoundary(raw: string, maxChars: number): string {
  if (raw.length <= maxChars) {
    return raw;
  }

  const truncated = raw.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace).trimEnd();
  }
  return truncated.trimEnd();
}

function toOneToThreeSentences(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const sentenceParts = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentenceParts.length <= 3) {
    return normalized;
  }

  return sentenceParts.slice(0, 3).join(" ").trim();
}

function toOneToTwoSentences(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  const sentenceParts = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentenceParts.length <= 2) {
    return normalized;
  }

  return sentenceParts.slice(0, 2).join(" ").trim();
}

function hasLensSignal(text: string, lens: Exclude<RoleLens, "general">): boolean {
  const normalized = text.toLowerCase();
  const rule = LENS_SIGNAL_RULES[lens];
  return rule.keywords.some((keyword) => normalized.includes(keyword));
}

function applyLensCalibration(text: string, lens: RoleLens): string {
  if (lens === "general") {
    return text;
  }

  if (hasLensSignal(text, lens)) {
    return text;
  }

  const rule = LENS_SIGNAL_RULES[lens];
  return `${rule.prefix} ${text}`;
}

function shapeGuideText(raw: string): string {
  const normalized = raw
    .replace(/[`*_>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const boundedSentences = toOneToTwoSentences(
    toOneToThreeSentences(normalized)
  );
  return trimToWordBoundary(boundedSentences, maxGuideChars);
}

function looksLikePromptLeak(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.includes("mootez guided tour step") ||
    normalized.includes("rewrite the explanation clearly") ||
    normalized.includes("guide query:") ||
    normalized.includes("final guide bubble")
  );
}

function hasWeakContext(
  retrieval: RetrievedChunk[],
  threshold: number
): boolean {
  const topScore = retrieval[0]?.score ?? 0;
  return topScore < threshold;
}

function logTwinGuideTurn(entry: Record<string, unknown>): void {
  console.info("[twin-guide]", JSON.stringify(entry));
}

export async function runTwinGuideTurn(
  input: TwinGuideTurnInput,
  dependencies: PipelineDependencies = { providers: getDefaultProviders() }
): Promise<TwinGuideTurnResult> {
  const startedAt = Date.now();
  const now = dependencies.now ?? (() => Date.now());
  const idFactory = dependencies.idFactory ?? (() => randomUUID());
  const providers = dependencies.providers;

  if (process.env.TWIN_GUIDE_RUNTIME === "off") {
    throw new TwinGuideError(
      503,
      "not_ready",
      "Twin guide runtime is disabled."
    );
  }

  if (!providers || providers.length === 0) {
    throw new TwinGuideError(
      503,
      "not_ready",
      "No guide providers configured."
    );
  }

  const query = buildGuideQueryText(input);
  const mode = input.context.mode ?? "reactive";
  const forceProjectOpenGeneration =
    mode === "reactive" && input.trigger.type === "project_open";
  const templateText = buildGuideTemplate({
    mode,
    roleLens: input.context.roleLens,
    ...(input.context.activeTourStepId
      ? { activeTourStepId: input.context.activeTourStepId }
      : {}),
    trigger: input.trigger,
  });
  const classification = classifyTwinMessage(query);
  const retrieval = retrieveTwinContext(query, { topK: 5 });
  const weakContextThreshold =
    dependencies.weakContextThreshold ?? DEFAULT_WEAK_CONTEXT_THRESHOLD;
  const weakContext = hasWeakContext(retrieval, weakContextThreshold);

  if (mode === "tour") {
    const corpus = loadTwinCorpusContext();
    const prompt = assembleTwinGuidePrompt({
      request: input,
      query,
      baseTemplateText: templateText,
      retrievedChunks: retrieval,
      corpus,
    });

    let text = templateText;
    let providerId = "template-fallback";
    let providerModel = "deterministic-template-v1";
    let validatorPassed = true;
    let validatorFlags: string[] = [];

    try {
      const providerOutput = await generateWithProviders(prompt, providers);
      const candidateText = shapeGuideText(
        applyLensCalibration(providerOutput.text, input.context.roleLens)
      );
      const validatorResult = validateTwinResponse(candidateText, {
        minLength: 20,
        maxLength: maxGuideChars,
      });

      validatorPassed = validatorResult.passed;
      validatorFlags = validatorResult.flags;

      if (
        validatorResult.passed &&
        candidateText.length > 0 &&
        !looksLikePromptLeak(candidateText)
      ) {
        text = candidateText;
        providerId = providerOutput.providerId;
        providerModel = providerOutput.model;
      }
    } catch {
      // Fall back to deterministic template if provider chain is unavailable.
    }

    const generatedAt = now();
    const latencyMs = Date.now() - startedAt;
    const response: TwinGuideTurnResult = {
      status: "ok",
      guide: {
        id: idFactory(),
        text,
        tone: "guide",
        triggerType: input.trigger.type,
        roleLens: input.context.roleLens,
        charCount: text.length,
        generatedAt,
      },
      meta: {
        providerId,
        providerModel,
        latencyMs,
        cached: false,
        classificationDecision: "in_scope",
      },
    };

    logTwinGuideTurn({
      triggerType: input.trigger.type,
      guideMode: mode,
      activeTourStepId: input.context.activeTourStepId ?? null,
      classificationDecision: response.meta.classificationDecision,
      providerId,
      providerModel,
      validatorPassed,
      validatorFlags,
      latencyMs,
      roleLens: input.context.roleLens,
      weakContext,
      retrievalCount: retrieval.length,
    });

    return response;
  }

  if (
    !forceProjectOpenGeneration &&
    (classification.decision !== "in_scope" || weakContext)
  ) {
    const text = templateText;
    const generatedAt = now();
    const latencyMs = Date.now() - startedAt;

    const response: TwinGuideTurnResult = {
      status: "ok",
      guide: {
        id: idFactory(),
        text,
        tone: "guide",
        triggerType: input.trigger.type,
        roleLens: input.context.roleLens,
        charCount: text.length,
        generatedAt,
      },
      meta: {
        providerId: "template-fallback",
        providerModel: "deterministic-template-v1",
        latencyMs,
        cached: false,
        classificationDecision:
          classification.decision === "in_scope" && !weakContext
            ? "in_scope"
            : "out_of_scope",
      },
    };

    logTwinGuideTurn({
      triggerType: input.trigger.type,
      guideMode: mode,
      classificationDecision: response.meta.classificationDecision,
      providerId: response.meta.providerId,
      providerModel: response.meta.providerModel,
      validatorPassed: true,
      validatorFlags: [],
      latencyMs,
      roleLens: input.context.roleLens,
      weakContext,
      retrievalCount: retrieval.length,
    });

    return response;
  }

  const corpus = loadTwinCorpusContext();
  const prompt = assembleTwinGuidePrompt({
    request: input,
    query,
    baseTemplateText: templateText,
    retrievedChunks: retrieval,
    corpus,
  });

  const providerOutput = await generateWithProviders(prompt, providers);
  let text = shapeGuideText(providerOutput.text);
  text = shapeGuideText(applyLensCalibration(text, input.context.roleLens));
  const validatorResult = validateTwinResponse(text, {
    minLength: 20,
    maxLength: maxGuideChars,
  });

  let providerId = providerOutput.providerId;
  let providerModel = providerOutput.model;

  if (!validatorResult.passed || text.length === 0) {
    text = templateText;
    providerId = "template-fallback";
    providerModel = "deterministic-template-v1";
  }

  const generatedAt = now();
  const latencyMs = Date.now() - startedAt;
  const response: TwinGuideTurnResult = {
    status: "ok",
    guide: {
      id: idFactory(),
      text,
      tone: "guide",
      triggerType: input.trigger.type,
      roleLens: input.context.roleLens,
      charCount: text.length,
      generatedAt,
    },
    meta: {
      providerId,
      providerModel,
      latencyMs,
      cached: false,
      classificationDecision: classification.decision,
    },
  };

  logTwinGuideTurn({
    triggerType: input.trigger.type,
    guideMode: mode,
    classificationDecision: response.meta.classificationDecision,
    providerId: response.meta.providerId,
    providerModel: response.meta.providerModel,
    validatorPassed: validatorResult.passed,
    validatorFlags: validatorResult.flags,
    latencyMs,
    roleLens: input.context.roleLens,
    weakContext,
    retrievalCount: retrieval.length,
  });

  return response;
}
