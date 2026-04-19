import { getRoleLensDefinition, type RoleLens } from "../../lens/roleLens";
import type { TwinCorpusContext } from "../prompt";
import type { RetrievedChunk } from "../retrieval";
import {
  maxGuideChars,
  type MascotGuideMode,
  type MascotBehaviorEvent,
  type MascotGuideRequest,
} from "./contracts";

const MAX_CONTEXT_CHUNKS = 4;
const MAX_RECENT_LINES = 3;

const LENS_STYLE_PACK: Record<RoleLens, string> = {
  general:
    "Balanced systems framing. Emphasize concrete decisions, tradeoffs, and what to inspect next.",
  cloud:
    "Use cloud/platform framing: deployability, reliability, infrastructure tradeoffs, and operational safety.",
  ml: "Use ML framing: evaluation quality, model behavior, data assumptions, and measurable constraints.",
  ai: "Use AI systems framing: LLM pipeline reliability, safety constraints, evaluation signals, and failure handling.",
  cyber:
    "Use security framing: threat exposure, risk reduction, controls, and defensive tradeoffs.",
  "ui-ux":
    "Use UI/UX engineering framing: interaction clarity, workflow friction, and front-end execution quality.",
};

function trimMarkdownNoise(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\n?/m, "")
    .replace(/^#\s.+$/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toSingleLine(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function buildTriggerSummary(event: MascotBehaviorEvent): string {
  if (event.type === "section_enter") {
    return `section_enter -> ${event.sectionId} on ${event.pathname}`;
  }

  if (event.type === "project_open") {
    return `project_open -> ${event.projectTitle} (${event.projectSlug}) on ${event.pathname}`;
  }

  if (event.type === "lens_switch") {
    return `lens_switch -> ${event.fromLens} to ${event.toLens} on ${event.pathname}`;
  }

  if (event.type === "route_change") {
    return `route_change -> ${event.fromPath} to ${event.toPath}`;
  }

  if (event.type === "tab_change") {
    return `tab_change -> ${event.fromTab} to ${event.toTab} on ${event.pathname}`;
  }

  if (event.type === "rail_focus") {
    return `rail_focus -> ${event.focusId} (${event.source}) on tab ${event.tab}`;
  }

  return `idle_nudge -> idleMs=${event.idleMs}, lastSection=${event.lastSectionId ?? "unknown"} on ${event.pathname}`;
}

export function buildLensStylePack(lens: RoleLens): string {
  return LENS_STYLE_PACK[lens];
}

export function buildGuideQueryText(request: MascotGuideRequest): string {
  const lens = getRoleLensDefinition(request.context.roleLens);
  const trigger = request.trigger;
  const mode: MascotGuideMode = request.context.mode ?? "reactive";

  if (mode === "tour" && request.context.activeTourStepId) {
    return [
      `Mootez guided tour step: ${request.context.activeTourStepId}.`,
      `Rewrite the explanation clearly in ${lens.shortLabel} framing while keeping it concise.`,
    ].join(" ");
  }

  if (trigger.type === "section_enter") {
    return [
      `Mootez guide event: user entered the ${trigger.sectionId} section.`,
      `Frame what matters in ${lens.label} view and what the user should inspect next.`,
    ].join(" ");
  }

  if (trigger.type === "project_open") {
    return [
      `Mootez guide event: user opened project ${trigger.projectTitle} (${trigger.projectSlug}).`,
      `Explain the strongest ${lens.shortLabel} signal and one key engineering decision.`,
    ].join(" ");
  }

  if (trigger.type === "lens_switch") {
    return [
      `Mootez guide event: lens changed from ${trigger.fromLens} to ${trigger.toLens}.`,
      "Reframe how the same portfolio evidence should be interpreted after the lens switch.",
    ].join(" ");
  }

  if (trigger.type === "route_change") {
    if (
      trigger.toPath === "/" &&
      (trigger.fromPath === "/entry" || trigger.fromPath === "/resume")
    ) {
      return [
        "Mootez guide event: first landing on the home portfolio route.",
        "Open with a warm self-introduction as Tazou, Mootez's twin assistant, then offer concise help for navigation.",
      ].join(" ");
    }

    return [
      `Mootez guide event: route changed from ${trigger.fromPath} to ${trigger.toPath}.`,
      `State why this destination matters in ${lens.label} framing.`,
    ].join(" ");
  }

  if (trigger.type === "tab_change") {
    return [
      `Mootez guide event: user switched portfolio tab from ${trigger.fromTab} to ${trigger.toTab}.`,
      `Give a short overview of what this tab covers in ${lens.label} framing.`,
    ].join(" ");
  }

  if (trigger.type === "rail_focus") {
    return [
      `Mootez guide event: user ${trigger.source === "click" ? "selected" : "scrolled to"} the ${trigger.focusId} rail item on the ${trigger.tab} tab.`,
      `Comment briefly on what is surfaced here in ${lens.label} framing.`,
    ].join(" ");
  }

  const activeSection =
    request.context.currentSectionId ?? trigger.lastSectionId ?? "current section";

  return [
    `Mootez guide event: user is idle for ${trigger.idleMs} ms around ${activeSection}.`,
    `Provide a concise nudge about what to inspect next in ${lens.label} view.`,
  ].join(" ");
}

export interface AssembleTwinGuidePromptInput {
  request: MascotGuideRequest;
  query: string;
  baseTemplateText: string;
  retrievedChunks: RetrievedChunk[];
  corpus: TwinCorpusContext;
}

export function assembleTwinGuidePrompt(
  input: AssembleTwinGuidePromptInput
): string {
  const lens = getRoleLensDefinition(input.request.context.roleLens);
  const lensStylePack = buildLensStylePack(input.request.context.roleLens);
  const mode = input.request.context.mode ?? "reactive";
  const triggerSummary = buildTriggerSummary(input.request.trigger);
  const recentGuideMessages = input.request.context.recentGuideMessages
    .slice(-MAX_RECENT_LINES)
    .map((line, index) => `${index + 1}. ${toSingleLine(line)}`);
  const retrievedEvidence = input.retrievedChunks
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map(
      (chunk) =>
        `- [${chunk.score.toFixed(3)}] (${chunk.sourceFile}) ${toSingleLine(chunk.text)}`
    );

  const voice = trimMarkdownNoise(input.corpus.voiceSpec);
  const approach = trimMarkdownNoise(input.corpus.approach);
  const opinions = trimMarkdownNoise(input.corpus.opinions);

  return [
    "SYSTEM CONTRACT",
    "You are Mootez speaking in first person as the portfolio mascot guide.",
    "Output plain text only with no markdown list markers.",
    "Generate 1-2 short sentences and keep the final output concise.",
    `Hard limit: ${maxGuideChars} characters.`,
    "No generic assistant filler and no references to being an AI model.",
    "Stay scoped to documented portfolio evidence and the trigger context.",
    "Preserve the meaning of BASE TEMPLATE while improving clarity.",
    ...(mode === "reactive"
      ? [
          "Avoid repeating wording from RECENT GUIDE MESSAGES.",
          "Use a fresh explanation angle if a recent line sounds similar.",
        ]
      : []),
    "",
    `ACTIVE LENS: ${lens.label}`,
    `GUIDE MODE: ${mode}`,
    `LENS NOTE: ${lens.twinHint}`,
    `LENS STYLE PACK: ${lensStylePack}`,
    `TRIGGER: ${triggerSummary}`,
    "",
    "RECENT GUIDE MESSAGES",
    recentGuideMessages.length > 0
      ? recentGuideMessages.join("\n")
      : "(none)",
    "",
    "VOICE CONTEXT",
    voice,
    "",
    "APPROACH CONTEXT",
    approach,
    "",
    "OPINION CONTEXT",
    opinions,
    "",
    "RETRIEVED EVIDENCE",
    retrievedEvidence.length > 0 ? retrievedEvidence.join("\n") : "(none)",
    "",
    "BASE TEMPLATE",
    toSingleLine(input.baseTemplateText),
    "",
    `GUIDE QUERY: ${toSingleLine(input.query)}`,
    "",
    "FINAL GUIDE BUBBLE",
    "Return only the final bubble text.",
  ].join("\n");
}
