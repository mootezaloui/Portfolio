import type { HomeTab } from "../../navigation/homeTabs";
import { getRoleLensDefinition, type RoleLens } from "../../lens/roleLens";
import type {
  MascotBehaviorEvent,
  MascotBehaviorEventType,
  MascotGuideMode,
  RailFocusId,
  RailFocusSource,
  SectionId,
  TourStepId,
} from "./contracts";

export type MascotOrchestratorMode = "tour" | "stalker" | "paused";
export type TourProgressStatus =
  | "not_started"
  | "running"
  | "completed"
  | "skipped";

export interface TourProgressState {
  status: TourProgressStatus;
  currentStepIndex: number;
  lastCompletedStep?: TourStepId;
}

export const MASCOT_TOUR_PROGRESS_STORAGE_KEY = "tazou:mascot:tour-progress:v1";
export const MASCOT_TOUR_PROGRESS_VERSION = 1;
export const MASCOT_SESSION_INTRO_STORAGE_KEY = "tazou:mascot:intro-session:v1";
export const MASCOT_TOUR_SEQUENCE: readonly TourStepId[] = [
  "hero",
  "why_me",
  "projects",
  "experience",
  "contact",
];

export const TOUR_STEP_ANCHOR_MAP: Record<TourStepId, string> = {
  hero: "hero_primary",
  why_me: "section_about",
  projects: "section_projects",
  experience: "section_experience",
  contact: "section_contact",
};

export const TOUR_STEP_TAB_MAP: Record<TourStepId, string> = {
  hero: "why-me",
  why_me: "why-me",
  projects: "projects",
  experience: "experience",
  contact: "contact",
};

const TOUR_STEP_COMPLETION_SECTION: Partial<Record<TourStepId, SectionId>> = {
  why_me: "about",
  projects: "projects",
  experience: "experience",
  contact: "contact",
};

interface PersistedTourProgress {
  version: number;
  status: TourProgressStatus;
  currentStepIndex: number;
  lastCompletedStep?: TourStepId;
}

function clampStepIndex(index: number): number {
  if (!Number.isFinite(index)) {
    return 0;
  }
  const normalized = Math.max(0, Math.floor(index));
  return Math.min(normalized, Math.max(0, MASCOT_TOUR_SEQUENCE.length - 1));
}

export function createInitialTourProgressState(): TourProgressState {
  return {
    status: "not_started",
    currentStepIndex: 0,
  };
}

export function normalizeTourProgressState(
  state: TourProgressState
): TourProgressState {
  const normalized: TourProgressState = {
    status: state.status,
    currentStepIndex: clampStepIndex(state.currentStepIndex),
  };
  if (state.lastCompletedStep) {
    normalized.lastCompletedStep = state.lastCompletedStep;
  }
  return normalized;
}

export function getTourStepAt(index: number): TourStepId {
  return MASCOT_TOUR_SEQUENCE[clampStepIndex(index)]!;
}

export function isTourFinished(status: TourProgressStatus): boolean {
  return status === "completed" || status === "skipped";
}

export function getNextTourStep(stepId: TourStepId): TourStepId | null {
  const index = MASCOT_TOUR_SEQUENCE.indexOf(stepId);
  if (index < 0 || index + 1 >= MASCOT_TOUR_SEQUENCE.length) {
    return null;
  }
  return MASCOT_TOUR_SEQUENCE[index + 1]!;
}

export function getTourStepCompletionSection(
  stepId: TourStepId
): SectionId | null {
  return TOUR_STEP_COMPLETION_SECTION[stepId] ?? null;
}

export function getTourTabForStep(stepId: TourStepId): string {
  return TOUR_STEP_TAB_MAP[stepId];
}

export function resolveTourStepFromTab(tab: string | null | undefined): TourStepId | null {
  const normalized = tab?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "why-me") {
    return "why_me";
  }
  if (normalized === "projects") {
    return "projects";
  }
  if (normalized === "experience") {
    return "experience";
  }
  if (normalized === "contact") {
    return "contact";
  }
  return null;
}

export function getActiveTourStep(
  state: TourProgressState
): TourStepId | null {
  if (state.status !== "running") {
    return null;
  }
  return getTourStepAt(state.currentStepIndex);
}

export function startTour(
  previousState: TourProgressState = createInitialTourProgressState()
): TourProgressState {
  return {
    status: "running",
    currentStepIndex: 0,
    ...(previousState.lastCompletedStep
      ? { lastCompletedStep: previousState.lastCompletedStep }
      : {}),
  };
}

export function skipTour(previousState: TourProgressState): TourProgressState {
  return {
    status: "skipped",
    currentStepIndex: previousState.currentStepIndex,
    ...(previousState.lastCompletedStep
      ? { lastCompletedStep: previousState.lastCompletedStep }
      : {}),
  };
}

function completeTour(previousState: TourProgressState): TourProgressState {
  return {
    status: "completed",
    currentStepIndex: MASCOT_TOUR_SEQUENCE.length - 1,
    ...(previousState.lastCompletedStep
      ? { lastCompletedStep: previousState.lastCompletedStep }
      : {}),
  };
}

export function advanceTourStep(previousState: TourProgressState): TourProgressState {
  if (previousState.status !== "running") {
    return previousState;
  }

  const currentStep = getTourStepAt(previousState.currentStepIndex);
  const nextIndex = previousState.currentStepIndex + 1;

  if (nextIndex >= MASCOT_TOUR_SEQUENCE.length) {
    return completeTour({
      ...previousState,
      lastCompletedStep: currentStep,
    });
  }

  return {
    status: "running",
    currentStepIndex: nextIndex,
    lastCompletedStep: currentStep,
  };
}

export function completeActiveTourStep(
  previousState: TourProgressState
): TourProgressState {
  return advanceTourStep(previousState);
}

export function syncTourProgressToStep(
  previousState: TourProgressState,
  targetStep: TourStepId
): TourProgressState {
  if (previousState.status !== "running") {
    return previousState;
  }

  const targetIndex = MASCOT_TOUR_SEQUENCE.indexOf(targetStep);
  if (targetIndex < 0) {
    return previousState;
  }

  if (targetIndex === previousState.currentStepIndex) {
    return previousState;
  }

  const priorStep =
    targetIndex > 0
      ? MASCOT_TOUR_SEQUENCE[targetIndex - 1]
      : previousState.lastCompletedStep;

  return {
    status: "running",
    currentStepIndex: targetIndex,
    ...(priorStep ? { lastCompletedStep: priorStep } : {}),
  };
}

export function resolveMascotOrchestratorMode(input: {
  pausedOnRoute: boolean;
  tourStatus: TourProgressStatus;
}): MascotOrchestratorMode {
  if (input.pausedOnRoute) {
    return "paused";
  }
  return input.tourStatus === "running" ? "tour" : "stalker";
}

export function resolveGuideModeForOrchestrator(
  mode: MascotOrchestratorMode
): MascotGuideMode {
  return mode === "tour" ? "tour" : "reactive";
}

export function shouldProcessStalkerSpeech(
  mode: MascotOrchestratorMode
): boolean {
  return mode === "stalker";
}

export function isStalkerTriggerTypeAllowed(
  triggerType: MascotBehaviorEventType
): boolean {
  return (
    triggerType === "section_enter" ||
    triggerType === "project_open" ||
    triggerType === "tab_change" ||
    triggerType === "rail_focus"
  );
}

export function isStalkerEventAllowed(event: MascotBehaviorEvent): boolean {
  return isStalkerTriggerTypeAllowed(event.type);
}

export function hasSeenSessionMascotIntro(
  storage: Storage | null = typeof window === "undefined" ? null : window.sessionStorage
): boolean {
  if (!storage) {
    return false;
  }
  try {
    return storage.getItem(MASCOT_SESSION_INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSessionMascotIntroSeen(
  storage: Storage | null = typeof window === "undefined" ? null : window.sessionStorage
): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(MASCOT_SESSION_INTRO_STORAGE_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export function saveTourProgressState(
  state: TourProgressState,
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage
): void {
  if (!storage) {
    return;
  }

  const normalized = normalizeTourProgressState(state);
  const payload: PersistedTourProgress = {
    version: MASCOT_TOUR_PROGRESS_VERSION,
    status: normalized.status,
    currentStepIndex: normalized.currentStepIndex,
    ...(normalized.lastCompletedStep
      ? { lastCompletedStep: normalized.lastCompletedStep }
      : {}),
  };

  try {
    storage.setItem(MASCOT_TOUR_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export function loadTourProgressState(
  storage: Storage | null = typeof window === "undefined" ? null : window.localStorage
): TourProgressState {
  if (!storage) {
    return createInitialTourProgressState();
  }

  try {
    const raw = storage.getItem(MASCOT_TOUR_PROGRESS_STORAGE_KEY);
    if (!raw) {
      return createInitialTourProgressState();
    }

    const parsed = JSON.parse(raw) as Partial<PersistedTourProgress>;
    if (
      parsed.version !== MASCOT_TOUR_PROGRESS_VERSION ||
      (parsed.status !== "not_started" &&
        parsed.status !== "running" &&
        parsed.status !== "completed" &&
        parsed.status !== "skipped")
    ) {
      return createInitialTourProgressState();
    }

    const state: TourProgressState = {
      status: parsed.status,
      currentStepIndex: clampStepIndex(parsed.currentStepIndex ?? 0),
    };
    if (
      parsed.lastCompletedStep &&
      MASCOT_TOUR_SEQUENCE.includes(parsed.lastCompletedStep)
    ) {
      state.lastCompletedStep = parsed.lastCompletedStep;
    }
    return state;
  } catch {
    return createInitialTourProgressState();
  }
}

export function resolveTourStepFromEvent(
  event: MascotBehaviorEvent
): TourStepId | null {
  if (event.type === "project_open") {
    return "projects";
  }
  if (event.type === "section_enter") {
    if (event.sectionId === "about") {
      return "why_me";
    }
    if (event.sectionId === "experience") {
      return "experience";
    }
    if (event.sectionId === "contact") {
      return "contact";
    }
  }
  return null;
}

export function doesEventCompleteTourStep(
  activeStep: TourStepId,
  event: MascotBehaviorEvent
): boolean {
  if (activeStep === "hero") {
    return false;
  }
  if (activeStep === "projects") {
    return (
      event.type === "project_open" ||
      (event.type === "section_enter" && event.sectionId === "projects")
    );
  }
  if (event.type !== "section_enter") {
    return false;
  }
  if (activeStep === "why_me") {
    return event.sectionId === "about";
  }
  if (activeStep === "experience") {
    return event.sectionId === "experience";
  }
  if (activeStep === "contact") {
    return event.sectionId === "contact";
  }
  return false;
}

function buildTourTemplate(stepId: TourStepId, lens: RoleLens): string {
  const lensDef = getRoleLensDefinition(lens);

  if (stepId === "hero") {
    return `Welcome. I am Mootez, and this quick tour is framed for ${lensDef.shortLabel}. Start here for the strongest positioning signal before diving into evidence.`;
  }
  if (stepId === "why_me") {
    return "This section explains why I am a fit. It is the fastest way to understand my decision style, delivery approach, and target role match.";
  }
  if (stepId === "projects") {
    return "Here are the strongest systems I built. Open a project card and I will break down key constraints, tradeoffs, and outcomes.";
  }
  if (stepId === "experience") {
    return "This section shows execution context, not just outcomes. Focus on scope, ownership, and how I handled delivery pressure.";
  }
  return "This is the final stop. If you want a deeper walkthrough, ask the twin or replay the tour from the mascot controls.";
}

function buildTabOverviewTemplate(
  tab: HomeTab,
  lensShortLabel: string
): string {
  if (tab === "why-me") {
    return `You are on Why Me. In ${lensShortLabel} framing, this tab is the fastest read on role fit — my positioning above, then how you can pick an angle to explore.`;
  }
  if (tab === "projects") {
    return `You are on Projects. In ${lensShortLabel} framing, this tab holds my strongest systems and research backing the engineering case.`;
  }
  if (tab === "experience") {
    return `You are on Experience. In ${lensShortLabel} framing, this tab shows how I deliver — work, education, leadership, and beta programs in one view.`;
  }
  if (tab === "skills") {
    return `You are on Skills. In ${lensShortLabel} framing, this tab pairs technical depth with certifications as supporting proof.`;
  }
  return `You are on Contact. In ${lensShortLabel} framing, this tab is the direct handoff if you are ready to move forward.`;
}

function buildRailFocusTemplate(
  focusId: RailFocusId,
  source: RailFocusSource,
  lensShortLabel: string
): string {
  const verb = source === "click" ? "jumped to" : "reached";

  if (focusId === "overview") {
    return `Back at the top. In ${lensShortLabel} framing, use this as the jump-off to the sections below.`;
  }
  if (focusId === "why-me") {
    return `You ${verb} the Why Me section. In ${lensShortLabel} framing, this is where I make the positioning case in one read.`;
  }
  if (focusId === "explore") {
    return `You ${verb} Explore By. In ${lensShortLabel} framing, pick how you want to inspect evidence — role, system, or outcome.`;
  }
  if (focusId === "projects") {
    return `You ${verb} the Projects grid. In ${lensShortLabel} framing, scan each card for the constraint and the tradeoff.`;
  }
  if (focusId === "research") {
    return `You ${verb} Research. In ${lensShortLabel} framing, treat these publications as formal backing for the engineering choices.`;
  }
  if (focusId === "experience") {
    return `You ${verb} Experience. In ${lensShortLabel} framing, check scope, ownership, and how I handled delivery pressure.`;
  }
  if (focusId === "education") {
    return `You ${verb} Education. In ${lensShortLabel} framing, this is baseline context, not the primary signal.`;
  }
  if (focusId === "leadership") {
    return `You ${verb} Leadership. In ${lensShortLabel} framing, look for how I run teams and campus initiatives beyond shipping code.`;
  }
  if (focusId === "beta-programs") {
    return `You ${verb} Beta Programs. In ${lensShortLabel} framing, this shows early-access work and how I engage with emerging tooling.`;
  }
  if (focusId === "skills") {
    return `You ${verb} Skills. In ${lensShortLabel} framing, verify depth and where these skills were applied in real systems.`;
  }
  if (focusId === "certifications") {
    return `You ${verb} Certifications. In ${lensShortLabel} framing, treat this as supporting evidence, not the primary signal.`;
  }
  return `You ${verb} Contact. In ${lensShortLabel} framing, use this for the direct handoff.`;
}

function buildReactiveTemplate(event: MascotBehaviorEvent, lens: RoleLens): string {
  const lensDef = getRoleLensDefinition(lens);

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
      return "automated surface discovery, severity triage, and remediation-focused findings";
    }
    if (normalized.includes("spotify") || normalized.includes("downloader")) {
      return "queue reliability, API orchestration, and user-visible progress handling";
    }
    if (normalized.includes("equation") || normalized.includes("chatbot")) {
      return "predictable compute execution, containerization, and backend reliability";
    }
    if (
      normalized.includes("virus") ||
      normalized.includes("covid") ||
      normalized.includes("simulation")
    ) {
      return "graph-based modeling choices and measurable simulation behavior";
    }

    return "constraint-driven architecture and delivery tradeoffs";
  };

  if (event.type === "section_enter") {
    if (event.sectionId === "about") {
      return `You are in Why Me. In ${lensDef.shortLabel} framing, this is the fastest section to validate my role fit and decision style.`;
    }
    if (event.sectionId === "projects") {
      return `You are in Projects. In ${lensDef.shortLabel} framing, focus on constraints, tradeoffs, and measured outcomes in each case.`;
    }
    if (event.sectionId === "experience") {
      return `You are in Experience. In ${lensDef.shortLabel} framing, check scope, ownership, and how I handled delivery pressure.`;
    }
    if (event.sectionId === "skills") {
      return `You are in Skills. In ${lensDef.shortLabel} framing, use this to verify depth and where those skills were applied in real systems.`;
    }
    if (event.sectionId === "certifications") {
      return `You are in Certifications. In ${lensDef.shortLabel} framing, treat this as supporting evidence, not the primary signal.`;
    }
    return `You are in Contact. In ${lensDef.shortLabel} framing, this is the direct handoff point if you want to move forward quickly.`;
  }

  if (event.type === "project_open") {
    const projectFocus = resolveProjectFocus(event.projectSlug);
    return `Good pick. ${event.projectTitle} is strong for ${lensDef.shortLabel}: it highlights ${projectFocus}. I can unpack the key decision and outcome next.`;
  }

  if (event.type === "lens_switch") {
    return `Lens switched to ${lensDef.shortLabel}. I will reframe the same portfolio evidence with this role focus from now on.`;
  }

  if (event.type === "route_change") {
    if (
      event.toPath === "/" &&
      (event.fromPath === "/entry" || event.fromPath === "/resume")
    ) {
      return "Hi, I am Tazou, Mootez's twin assistant. I can guide you through this portfolio and highlight the strongest signals fast.";
    }

    return `You changed view from ${event.fromPath} to ${event.toPath}. I will keep guidance scoped to what matters most for ${lensDef.shortLabel}.`;
  }

  if (event.type === "tab_change") {
    return buildTabOverviewTemplate(event.toTab, lensDef.shortLabel);
  }

  if (event.type === "rail_focus") {
    return buildRailFocusTemplate(
      event.focusId,
      event.source,
      lensDef.shortLabel
    );
  }

  return "If you are idle, I can guide the next best stop. Try Projects for system depth or Contact for a direct handoff.";
}

function boundTemplateText(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 220);
}

export interface GuideTemplateInput {
  mode: "tour" | "reactive";
  roleLens: RoleLens;
  activeTourStepId?: TourStepId;
  trigger?: MascotBehaviorEvent;
}

export function buildGuideTemplate(input: GuideTemplateInput): string {
  if (input.mode === "tour" && input.activeTourStepId) {
    return boundTemplateText(buildTourTemplate(input.activeTourStepId, input.roleLens));
  }

  if (input.trigger) {
    return boundTemplateText(buildReactiveTemplate(input.trigger, input.roleLens));
  }

  const lensDef = getRoleLensDefinition(input.roleLens);
  return boundTemplateText(
    `I will keep this walkthrough scoped to ${lensDef.shortLabel}. Open a section or project and I will explain the strongest signal.`
  );
}
