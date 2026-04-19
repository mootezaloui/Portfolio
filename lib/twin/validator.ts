export type ValidationFlag =
  | "empty_response"
  | "generic_assistant_phrase"
  | "unrelated_code_block"
  | "length_out_of_bounds"
  | "realtime_action_claim";

export interface ValidationResult {
  passed: boolean;
  flags: ValidationFlag[];
}

export interface ValidatorOptions {
  minLength?: number;
  maxLength?: number;
}

const GENERIC_ASSISTANT_PHRASES = [
  "as an ai language model",
  "i cannot browse the web",
  "i am here to help with anything",
  "i can answer any question",
];

const REALTIME_ACTION_PATTERNS = [
  /\bi just checked\b/i,
  /\bi checked\b/i,
  /\bi just searched\b/i,
  /\bi looked up\b/i,
  /\bi sent\b/i,
  /\bi visited\b/i,
];

function hasLikelyUnrelatedCodeBlock(response: string): boolean {
  const hasCodeBlock = /```[\s\S]*?```/m.test(response);
  if (!hasCodeBlock) {
    return false;
  }

  const mentionsProjectContext =
    /\b(project|mootez|promptrend|portfolio|security|system)\b/i.test(
      response
    );
  return !mentionsProjectContext;
}

export function validateTwinResponse(
  response: string,
  options: ValidatorOptions = {}
): ValidationResult {
  const minLength = options.minLength ?? 40;
  const maxLength = options.maxLength ?? 2400;
  const flags = new Set<ValidationFlag>();
  const normalized = response.trim();

  if (!normalized) {
    flags.add("empty_response");
  }

  const lowercase = normalized.toLowerCase();

  if (
    GENERIC_ASSISTANT_PHRASES.some((phrase) => lowercase.includes(phrase))
  ) {
    flags.add("generic_assistant_phrase");
  }

  if (normalized.length > 0 && normalized.length < minLength) {
    flags.add("length_out_of_bounds");
  }

  if (normalized.length > maxLength) {
    flags.add("length_out_of_bounds");
  }

  if (hasLikelyUnrelatedCodeBlock(normalized)) {
    flags.add("unrelated_code_block");
  }

  if (REALTIME_ACTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    flags.add("realtime_action_claim");
  }

  return {
    passed: flags.size === 0,
    flags: [...flags],
  };
}
