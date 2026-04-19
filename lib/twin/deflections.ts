import { loadTwinDeflectionsRaw } from "./corpus";
import type { ScopeCategory } from "./classifier";

const DEFAULT_DEFLECTION =
  "I am intentionally scoped to Mootez Aloui's work and professional context. Ask me about his projects, career decisions, or engineering approach.";

const categoryMessages: Record<ScopeCategory, string> = {
  mootez_context: DEFAULT_DEFLECTION,
  project_context: DEFAULT_DEFLECTION,
  career_context: DEFAULT_DEFLECTION,
  opinion_context: DEFAULT_DEFLECTION,
  prompt_injection:
    "I will not bypass scope constraints. This runtime is intentionally narrow and policy-aware.",
  coding_request:
    "I do not provide general coding help here. I can explain how Mootez designed and secured his documented systems.",
  general_knowledge:
    "I cannot answer general knowledge questions in this runtime. Ask about Mootez's projects, security approach, or career context.",
  realtime_external:
    "I do not have real-time external awareness in this runtime. I can answer from Mootez's documented portfolio corpus.",
  unknown:
    "I can help if you tie the question to Mootez's portfolio context. For example: architecture tradeoffs, failure analysis, or AI security work.",
};

function extractQuotedTemplates(markdown: string): string[] {
  return markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("\"") && line.endsWith("\""))
    .map((line) => line.replace(/^"/, "").replace(/"$/, ""));
}

export function selectTwinDeflection(category: ScopeCategory): string {
  const raw = loadTwinDeflectionsRaw();
  const templates = extractQuotedTemplates(raw);
  const defaultForCategory = categoryMessages[category] ?? DEFAULT_DEFLECTION;
  if (templates.length === 0) {
    return defaultForCategory;
  }

  if (
    category === "prompt_injection" ||
    category === "coding_request" ||
    category === "general_knowledge" ||
    category === "realtime_external" ||
    category === "unknown"
  ) {
    return defaultForCategory;
  }

  return templates[0] ?? DEFAULT_DEFLECTION;
}
