import { retrieveTwinContext } from "./retrieval";

export type ScopeDecision = "in_scope" | "out_of_scope" | "ambiguous";

export type ScopeCategory =
  | "mootez_context"
  | "project_context"
  | "career_context"
  | "opinion_context"
  | "prompt_injection"
  | "coding_request"
  | "general_knowledge"
  | "realtime_external"
  | "unknown";

export interface ScopeClassificationResult {
  decision: ScopeDecision;
  category: ScopeCategory;
  reason: string;
  similarity: number;
  usedFallback: boolean;
}

export interface ClassifierOptions {
  inScopeThreshold?: number;
  outScopeThreshold?: number;
}

const DEFAULT_IN_SCOPE_THRESHOLD = 0.28;
const DEFAULT_OUT_SCOPE_THRESHOLD = 0.1;

const explicitInScopePatterns: Array<{ category: ScopeCategory; regex: RegExp }> =
  [
    {
      category: "mootez_context",
      regex: /\bmootez\b|\bdisagreements\b|\btwin system\b/i,
    },
    {
      category: "project_context",
      regex: /\b(promptrend|portfolio|project|law firm|messenger|tutoring)\b/i,
    },
    {
      category: "career_context",
      regex: /\b(experience|career|internship|datadoit|redstart)\b/i,
    },
    {
      category: "opinion_context",
      regex: /\b(opinion|approach|tradeoff|decision|failure mode)\b/i,
    },
  ];

const outOfScopePatterns: Array<{ category: ScopeCategory; regex: RegExp }> = [
  {
    category: "prompt_injection",
    regex: /\b(ignore previous|system prompt|jailbreak|override|developer message)\b/i,
  },
  {
    category: "coding_request",
    regex: /\b(write code|build me an app|solve this bug|leetcode|algorithm challenge)\b/i,
  },
  {
    category: "general_knowledge",
    regex:
      /\b(capital of|who won|history of|world war|explain quantum|photosynthesis|write me a poem|poem about|vacation itinerary|life advice|homework assignment|search the web|compare .* prices)\b/i,
  },
  {
    category: "realtime_external",
    regex: /\b(weather|stock price|latest news|today's score|current time in)\b/i,
  },
];

function smallFallbackClassifier(message: string): ScopeClassificationResult {
  if (/\b(my resume|your resume|hire|candidate)\b/i.test(message)) {
    return {
      decision: "in_scope",
      category: "mootez_context",
      reason: "Fallback classifier mapped hiring/resume context to in-scope.",
      similarity: 0,
      usedFallback: true,
    };
  }

  if (/\b(can you|please|help me)\b/i.test(message)) {
    return {
      decision: "out_of_scope",
      category: "unknown",
      reason:
        "Fallback classifier detected generic assistant framing without Mootez context.",
      similarity: 0,
      usedFallback: true,
    };
  }

  return {
    decision: "ambiguous",
    category: "unknown",
    reason: "Fallback classifier could not confidently scope request.",
    similarity: 0,
    usedFallback: true,
  };
}

export function classifyTwinMessage(
  input: string,
  options: ClassifierOptions = {}
): ScopeClassificationResult {
  const normalized = input.trim();
  const inScopeThreshold =
    options.inScopeThreshold ?? DEFAULT_IN_SCOPE_THRESHOLD;
  const outScopeThreshold =
    options.outScopeThreshold ?? DEFAULT_OUT_SCOPE_THRESHOLD;

  if (!normalized) {
    return {
      decision: "out_of_scope",
      category: "unknown",
      reason: "Empty input is out of scope.",
      similarity: 0,
      usedFallback: false,
    };
  }

  for (const pattern of outOfScopePatterns) {
    if (pattern.regex.test(normalized)) {
      return {
        decision: "out_of_scope",
        category: pattern.category,
        reason: `Matched out-of-scope pattern: ${pattern.regex.source}`,
        similarity: 0,
        usedFallback: false,
      };
    }
  }

  for (const pattern of explicitInScopePatterns) {
    if (pattern.regex.test(normalized)) {
      return {
        decision: "in_scope",
        category: pattern.category,
        reason: `Matched explicit in-scope pattern: ${pattern.regex.source}`,
        similarity: 0,
        usedFallback: false,
      };
    }
  }

  const [topHit] = retrieveTwinContext(normalized, { topK: 1 });
  const similarity = topHit?.score ?? 0;

  if (similarity >= inScopeThreshold) {
    return {
      decision: "in_scope",
      category: "mootez_context",
      reason: `Similarity ${similarity.toFixed(3)} is above threshold.`,
      similarity,
      usedFallback: false,
    };
  }

  if (similarity <= outScopeThreshold) {
    return {
      decision: "out_of_scope",
      category: "unknown",
      reason: `Similarity ${similarity.toFixed(3)} is below threshold.`,
      similarity,
      usedFallback: false,
    };
  }

  const fallback = smallFallbackClassifier(normalized);
  return {
    ...fallback,
    similarity,
  };
}
