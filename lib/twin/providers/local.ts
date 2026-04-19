import type { TwinProvider, TwinProviderInput, TwinProviderOutput } from "./types";

const MAX_EVIDENCE_ITEMS = 2;
const MAX_EVIDENCE_CHARS = 160;

type FallbackTheme =
  | "tradeoffs"
  | "security"
  | "failure"
  | "collaboration"
  | "systems"
  | "general";

interface ParsedEvidence {
  sourceFile: string;
  text: string;
}

type GuideMode = "tour" | "reactive";

type ParsedGuideTrigger =
  | {
      type: "section_enter";
      sectionId: string;
    }
  | {
      type: "project_open";
      projectTitle: string;
      projectSlug: string;
    }
  | {
      type: "lens_switch";
      fromLens: string;
      toLens: string;
    }
  | {
      type: "route_change";
      fromPath: string;
      toPath: string;
    }
  | {
      type: "tab_change";
      fromTab: string;
      toTab: string;
    }
  | {
      type: "rail_focus";
      focusId: string;
      source: "click" | "scroll";
      tab: string;
    }
  | {
      type: "idle_nudge";
      idleMs: string;
      lastSection: string;
    };

function toSingleLine(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/[#*_`>]/g, "").trim();
}

function truncateText(raw: string, maxChars: number): string {
  if (raw.length <= maxChars) {
    return raw;
  }

  const truncated = raw.slice(0, maxChars);
  const lastWordBreak = truncated.lastIndexOf(" ");
  const stableCut = lastWordBreak > 40 ? truncated.slice(0, lastWordBreak) : truncated;
  return `${stableCut.trim()}...`;
}

function parseUserQuestion(prompt: string): string {
  const match = prompt.match(/USER QUESTION:\s*(.+)$/m);
  if (match?.[1]) {
    return match[1].trim();
  }

  const guideMatch = prompt.match(/GUIDE QUERY:\s*(.+)$/m);
  return (guideMatch?.[1] ?? "").trim();
}

function parseEvidence(prompt: string): ParsedEvidence[] {
  const afterEvidence = prompt.split("RETRIEVED EVIDENCE")[1] ?? "";
  const section = afterEvidence.split("USER QUESTION:")[0]?.split("GUIDE QUERY:")[0] ?? "";
  const evidence: ParsedEvidence[] = [];
  const pattern = /- \[[0-9.]+\]\s+\(([^)]+)\)\s+([\s\S]*?)(?=\n- \[[0-9.]+\]\s+\(|$)/g;

  for (const match of section.matchAll(pattern)) {
    const sourceFile = (match[1] ?? "").trim();
    const rawText = (match[2] ?? "").trim();
    if (!sourceFile || !rawText) {
      continue;
    }

    const normalized = truncateText(toSingleLine(rawText), MAX_EVIDENCE_CHARS);
    if (!normalized) {
      continue;
    }

    evidence.push({ sourceFile, text: normalized });
    if (evidence.length >= MAX_EVIDENCE_ITEMS) {
      break;
    }
  }

  return evidence;
}

function parseGuideMode(prompt: string): GuideMode {
  const mode = prompt.match(/GUIDE MODE:\s*(.+)$/m)?.[1]?.trim().toLowerCase();
  return mode === "tour" ? "tour" : "reactive";
}

function parseGuideLens(prompt: string): string {
  const lens = prompt.match(/ACTIVE LENS:\s*(.+)$/m)?.[1]?.trim();
  return lens && lens.length > 0 ? lens : "General Engineering";
}

function parseGuideTourStep(prompt: string): string | null {
  const query = parseUserQuestion(prompt);
  if (!query) {
    return null;
  }
  const match = query.match(/guided tour step:\s*([a-z_]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function parseGuideTrigger(prompt: string): ParsedGuideTrigger | null {
  const raw = prompt.match(/TRIGGER:\s*(.+)$/m)?.[1]?.trim();
  if (!raw) {
    return null;
  }

  const sectionMatch = raw.match(/^section_enter -> ([a-z_]+)\s+on\s+.+$/i);
  if (sectionMatch?.[1]) {
    return {
      type: "section_enter",
      sectionId: sectionMatch[1].toLowerCase(),
    };
  }

  const projectMatch = raw.match(/^project_open -> (.+?) \(([^)]+)\)\s+on\s+.+$/i);
  if (projectMatch?.[1] && projectMatch[2]) {
    return {
      type: "project_open",
      projectTitle: toSingleLine(projectMatch[1]),
      projectSlug: projectMatch[2].trim(),
    };
  }

  const lensMatch = raw.match(/^lens_switch -> ([a-z-]+)\s+to\s+([a-z-]+)\s+on\s+.+$/i);
  if (lensMatch?.[1] && lensMatch[2]) {
    return {
      type: "lens_switch",
      fromLens: lensMatch[1],
      toLens: lensMatch[2],
    };
  }

  const routeMatch = raw.match(/^route_change -> (.+?)\s+to\s+(.+)$/i);
  if (routeMatch?.[1] && routeMatch[2]) {
    return {
      type: "route_change",
      fromPath: routeMatch[1].trim(),
      toPath: routeMatch[2].trim(),
    };
  }

  const tabMatch = raw.match(/^tab_change -> ([a-z-]+)\s+to\s+([a-z-]+)\s+on\s+.+$/i);
  if (tabMatch?.[1] && tabMatch[2]) {
    return {
      type: "tab_change",
      fromTab: tabMatch[1].toLowerCase(),
      toTab: tabMatch[2].toLowerCase(),
    };
  }

  const railMatch = raw.match(
    /^rail_focus -> ([a-z-]+)\s+\((click|scroll)\)\s+on\s+tab\s+([a-z-]+)$/i
  );
  if (railMatch?.[1] && railMatch[2] && railMatch[3]) {
    return {
      type: "rail_focus",
      focusId: railMatch[1].toLowerCase(),
      source: railMatch[2].toLowerCase() === "click" ? "click" : "scroll",
      tab: railMatch[3].toLowerCase(),
    };
  }

  const idleMatch = raw.match(
    /^idle_nudge -> idleMs=([0-9]+),\s*lastSection=([a-z_]+)\s+on\s+.+$/i
  );
  if (idleMatch?.[1] && idleMatch[2]) {
    return {
      type: "idle_nudge",
      idleMs: idleMatch[1],
      lastSection: idleMatch[2].toLowerCase(),
    };
  }

  return null;
}

function formatSectionLabel(sectionId: string): string {
  if (sectionId === "about") {
    return "Why Me";
  }
  if (sectionId === "projects") {
    return "Projects";
  }
  if (sectionId === "experience") {
    return "Experience";
  }
  if (sectionId === "skills") {
    return "Skills";
  }
  if (sectionId === "certifications") {
    return "Certifications";
  }
  if (sectionId === "contact") {
    return "Contact";
  }
  return "this section";
}

function formatTabLabel(tabId: string): string {
  if (tabId === "why-me") {
    return "Why Me";
  }
  if (tabId === "projects") {
    return "Projects";
  }
  if (tabId === "experience") {
    return "Experience";
  }
  if (tabId === "skills") {
    return "Skills";
  }
  if (tabId === "contact") {
    return "Contact";
  }
  return "this tab";
}

function formatRailLabel(focusId: string): string {
  if (focusId === "overview") {
    return "Overview";
  }
  if (focusId === "why-me") {
    return "Why Me";
  }
  if (focusId === "explore") {
    return "Explore By";
  }
  if (focusId === "projects") {
    return "Projects";
  }
  if (focusId === "research") {
    return "Research";
  }
  if (focusId === "experience") {
    return "Professional Experience";
  }
  if (focusId === "education") {
    return "Education";
  }
  if (focusId === "leadership") {
    return "Leadership & Community";
  }
  if (focusId === "beta-programs") {
    return "Beta Programs";
  }
  if (focusId === "skills") {
    return "Skills";
  }
  if (focusId === "certifications") {
    return "Certifications";
  }
  if (focusId === "contact") {
    return "Contact";
  }
  return "this section";
}

function buildTourGuideFallback(step: string | null, lens: string): string {
  if (step === "hero") {
    return `Welcome to the guided tour in ${lens} framing. Start with my positioning, then we will inspect concrete evidence.`;
  }
  if (step === "why_me") {
    return `You are at Why Me in ${lens} framing. This stop explains my fit, decision style, and role alignment quickly.`;
  }
  if (step === "projects") {
    return `You are at Projects in ${lens} framing. Open a case to inspect constraints, tradeoffs, and measurable outcomes.`;
  }
  if (step === "experience") {
    return `You are at Experience in ${lens} framing. Focus on scope, ownership, and how delivery pressure was handled.`;
  }
  if (step === "contact") {
    return `You are at Contact in ${lens} framing. This is the direct handoff point to move the conversation forward.`;
  }
  return `Guided mode is active in ${lens} framing. Open any section and I will adapt the walkthrough.`;
}

function buildReactiveGuideFallback(
  trigger: ParsedGuideTrigger | null,
  lens: string
): string {
  const resolveProjectFocus = (projectSlug: string): string => {
    const normalized = projectSlug.toLowerCase();
    if (
      normalized.includes("promptrend") ||
      normalized.includes("llm") ||
      normalized.includes("vulnerability")
    ) {
      return "adversarial LLM testing, risk scoring, and reproducible security evaluation";
    }
    if (
      normalized.includes("scanner") ||
      normalized.includes("appsec") ||
      normalized.includes("web-app")
    ) {
      return "automated surface discovery and severity-prioritized remediation";
    }
    if (normalized.includes("spotify") || normalized.includes("downloader")) {
      return "queued processing reliability and progress visibility under load";
    }
    if (normalized.includes("equation") || normalized.includes("chatbot")) {
      return "containerized backend execution with predictable response behavior";
    }
    if (
      normalized.includes("virus") ||
      normalized.includes("covid") ||
      normalized.includes("simulation")
    ) {
      return "graph-based modeling and probabilistic spread analysis";
    }
    return "constraint-driven architecture and delivery tradeoffs";
  };

  if (!trigger) {
    return `I am in reactive guide mode for ${lens}. Move across sections and I will adapt the explanation to your current context.`;
  }

  if (trigger.type === "section_enter") {
    const sectionLabel = formatSectionLabel(trigger.sectionId);
    return `You entered ${sectionLabel}. I will explain the strongest ${lens} signal in this section and what to inspect next.`;
  }

  if (trigger.type === "project_open") {
    const projectFocus = resolveProjectFocus(trigger.projectSlug);
    return `Good pick. ${trigger.projectTitle} is strong in ${lens} framing because it shows ${projectFocus}. I will call out the highest-impact decision first.`;
  }

  if (trigger.type === "lens_switch") {
    return `Lens switched from ${trigger.fromLens} to ${trigger.toLens}. I will reframe the same evidence around the new role focus.`;
  }

  if (trigger.type === "route_change") {
    if (
      trigger.toPath === "/" &&
      (trigger.fromPath === "/entry" || trigger.fromPath === "/resume")
    ) {
      return "Hi, I am Tazou, Mootez's twin assistant. I can walk you through the portfolio and point you to the strongest evidence quickly.";
    }

    return `Route changed from ${trigger.fromPath} to ${trigger.toPath}. I will keep guidance scoped to what matters most on this destination.`;
  }

  if (trigger.type === "tab_change") {
    const tabLabel = formatTabLabel(trigger.toTab);
    return `You switched to ${tabLabel}. I will give a concise ${lens} overview for this tab, then adapt as you move through its sections.`;
  }

  if (trigger.type === "rail_focus") {
    const railLabel = formatRailLabel(trigger.focusId);
    const tabLabel = formatTabLabel(trigger.tab);
    const verb = trigger.source === "click" ? "selected" : "reached";
    return `You ${verb} ${railLabel} inside ${tabLabel}. I will explain the strongest ${lens} signal surfaced in this part.`;
  }

  const idleSection = formatSectionLabel(trigger.lastSection);
  return `You were idle for ${trigger.idleMs}ms near ${idleSection}. I can guide the next best section based on your current focus.`;
}

function detectTheme(question: string): FallbackTheme {
  const normalized = question.toLowerCase();

  if (
    /tradeoff|deadline|delivery|pressure|priorit|scope|ship|time/.test(normalized)
  ) {
    return "tradeoffs";
  }

  if (/security|secure|risk|threat|vulnerab|incident/.test(normalized)) {
    return "security";
  }

  if (/failure|mistake|wrong|lesson|postmortem|bug|recover/.test(normalized)) {
    return "failure";
  }

  if (/collab|team|communicat|stakeholder|feedback/.test(normalized)) {
    return "collaboration";
  }

  if (/system|architecture|design|project|decision/.test(normalized)) {
    return "systems";
  }

  return "general";
}

function buildThemeAnswer(theme: FallbackTheme): string {
  if (theme === "tradeoffs") {
    return (
      "Mootez usually frames delivery tradeoffs by ranking risk first, then delivery " +
      "speed, and documenting assumptions so rollback paths stay clear."
    );
  }

  if (theme === "security") {
    return (
      "Mootez treats security decisions as system decisions: controls must reduce risk " +
      "without breaking delivery flow, or teams stop applying them."
    );
  }

  if (theme === "failure") {
    return (
      "Mootez emphasizes explicit failure logs, corrected fixes, and lessons captured " +
      "as reusable constraints for future decisions."
    );
  }

  if (theme === "collaboration") {
    return (
      "Mootez's collaboration model is direct and pragmatic: explicit tradeoffs, fast " +
      "feedback loops, and clear done criteria over abstract debate."
    );
  }

  if (theme === "systems") {
    return (
      "Mootez describes systems through constraints, decisions, and failure modes so the " +
      "reasoning is inspectable instead of presentation-only."
    );
  }

  return (
    "From Mootez's documented corpus: he favors constrained behavior, explicit tradeoffs, " +
    "and evidence-backed decisions."
  );
}

function buildFallbackResponse(prompt: string): string {
  const question = parseUserQuestion(prompt);
  const theme = detectTheme(question);
  const answer = buildThemeAnswer(theme);
  const evidence = parseEvidence(prompt);

  const lines = [
    "External LLM providers are temporarily unavailable; this response is from the local portfolio corpus fallback.",
    answer,
  ];

  if (evidence.length > 0) {
    lines.push("", "Relevant corpus evidence:");
    lines.push(...evidence.map((item) => `- (${item.sourceFile}) ${item.text}`));
  }

  return lines.join("\n");
}

function buildGuideFallbackResponse(prompt: string): string {
  const mode = parseGuideMode(prompt);
  const lens = parseGuideLens(prompt);
  const trigger = parseGuideTrigger(prompt);
  const tourStep = parseGuideTourStep(prompt);
  const evidence = parseEvidence(prompt);
  const leadLine =
    mode === "tour"
      ? buildTourGuideFallback(tourStep, lens)
      : buildReactiveGuideFallback(trigger, lens);
  const evidenceLine = evidence[0]?.text;

  if (!evidenceLine) {
    return leadLine;
  }

  return `${leadLine} ${evidenceLine}`;
}

export const localFallbackProvider: TwinProvider = {
  id: "local-fallback",
  model: "deterministic-template-v1",
  isConfigured() {
    return true;
  },
  async generate(input: TwinProviderInput): Promise<TwinProviderOutput> {
    const startedAt = Date.now();
    const isGuidePrompt = input.prompt.includes("FINAL GUIDE BUBBLE");
    return {
      providerId: this.id,
      model: this.model,
      text: isGuidePrompt
        ? buildGuideFallbackResponse(input.prompt)
        : buildFallbackResponse(input.prompt),
      latencyMs: Date.now() - startedAt,
    };
  },
  async *stream(input: TwinProviderInput): AsyncGenerator<string> {
    const output = await this.generate(input);
    for (const chunk of output.text.split(/\s+/)) {
      yield `${chunk} `;
    }
  },
};
