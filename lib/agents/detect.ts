export type AgentDetectionBand = "high" | "medium" | "low";

export interface DetectAgentInput {
  userAgent: string | null;
  pathname?: string;
  query?: URLSearchParams;
  accept?: string | null;
  secFetchMode?: string | null;
  secChUa?: string | null;
  hasCookieHeader?: boolean;
}

export interface AgentDetection {
  isAgent: boolean;
  confidence: number;
  band: AgentDetectionBand;
  matchedSignatures: string[];
  reasons: string[];
}

interface AgentSignature {
  id: string;
  regex: RegExp;
}

const KNOWN_AGENT_SIGNATURES: AgentSignature[] = [
  { id: "gptbot", regex: /\bgptbot\b/i },
  { id: "chatgpt-user", regex: /\bchatgpt-user\b/i },
  { id: "oai-searchbot", regex: /\boai-searchbot\b/i },
  { id: "claudebot", regex: /\bclaudebot\b/i },
  { id: "anthropic-ai", regex: /\banthropic-ai\b/i },
  { id: "perplexitybot", regex: /\bperplexitybot\b/i },
  { id: "perplexity-user", regex: /\bperplexity-user\b/i },
  { id: "google-extended", regex: /\bgoogle-extended\b/i },
  { id: "googleother", regex: /\bgoogleother\b/i },
  { id: "bingbot", regex: /\bbingbot\b/i },
  { id: "ccbot", regex: /\bccbot\b/i },
  { id: "bytespider", regex: /\bbytespider\b/i },
  { id: "duckassistbot", regex: /\bduckassistbot\b/i },
  { id: "amazonbot", regex: /\bamazonbot\b/i },
  { id: "meta-externalagent", regex: /\bmeta-externalagent\b/i },
];

const HIGH_CONFIDENCE_THRESHOLD = 0.85;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.55;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isSelfIdentifiedAgent(input: DetectAgentInput): boolean {
  const forcedByQuery = input.query?.get("agent") === "1";
  const forcedByPath = input.pathname?.startsWith("/agent") ?? false;
  return forcedByQuery || forcedByPath;
}

function detectSignatures(userAgent: string): string[] {
  return KNOWN_AGENT_SIGNATURES.filter((signature) =>
    signature.regex.test(userAgent)
  ).map((signature) => signature.id);
}

function inferBand(confidence: number): AgentDetectionBand {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return "high";
  }

  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return "medium";
  }

  return "low";
}

export function detectAgentRequest(input: DetectAgentInput): AgentDetection {
  const normalizedUa = (input.userAgent ?? "").trim().toLowerCase();
  const reasons: string[] = [];

  if (isSelfIdentifiedAgent(input)) {
    reasons.push("self_identified_request");
    return {
      isAgent: true,
      confidence: 1,
      band: "high",
      matchedSignatures: [],
      reasons,
    };
  }

  const matchedSignatures = detectSignatures(normalizedUa);
  let score = 0.05;

  if (matchedSignatures.length > 0) {
    score = 0.9 + Math.min((matchedSignatures.length - 1) * 0.02, 0.08);
    reasons.push(`ua_signature:${matchedSignatures.join(",")}`);
  }

  const acceptHeader = (input.accept ?? "").toLowerCase();
  if (
    acceptHeader.length > 0 &&
    !acceptHeader.includes("text/html") &&
    (acceptHeader.includes("application/json") ||
      acceptHeader.includes("text/plain") ||
      acceptHeader.includes("*/*"))
  ) {
    score += 0.12;
    reasons.push("non_browser_accept_header");
  }

  const likelyBrowserUa =
    normalizedUa.includes("mozilla/5.0") &&
    (normalizedUa.includes("chrome/") ||
      normalizedUa.includes("safari/") ||
      normalizedUa.includes("firefox/") ||
      normalizedUa.includes("edg/"));

  if (!matchedSignatures.length && !likelyBrowserUa) {
    score += 0.08;
    reasons.push("ua_not_browser_like");
  }

  if (!input.hasCookieHeader) {
    score += 0.05;
    reasons.push("no_cookie_header");
  }

  if (!input.secFetchMode && !input.secChUa) {
    score += 0.06;
    reasons.push("missing_browser_hints");
  }

  const confidence = clamp(score, 0, 1);
  const band = inferBand(confidence);

  return {
    isAgent: band === "high",
    confidence,
    band,
    matchedSignatures,
    reasons,
  };
}
