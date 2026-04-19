import type { RoleLens } from "../../lens/roleLens";
import {
  behaviorQueueLimit,
  eventPriority,
  globalCooldownMs,
  maxGuideChars,
  perTriggerCooldownMs,
  type MascotBehaviorEvent,
  type MascotBehaviorEventType,
  type MascotGuideMode,
  type MascotGuideRequest,
  type MascotGuideResponse,
  type SectionId,
  type TourStepId,
} from "./contracts";

export const DEFAULT_GUIDE_SIMILARITY_THRESHOLD = 0.82;
export const DEFAULT_IDLE_NUDGE_MS = 30_000;
export const GUIDE_FETCH_TIMEOUT_MS = 4_500;
export const MASCOT_PENDING_EVENT_LIMIT = behaviorQueueLimit;
const MAX_RECENT_GUIDE_MESSAGES = 3;
const MAX_RECENT_TRIGGER_TYPES = 5;
const REACTIVE_SUPPRESSION_BYPASS_TRIGGER_SET = new Set<
  MascotBehaviorEventType
>(["project_open", "tab_change", "rail_focus"]);

export interface GuideCooldownSnapshot {
  lastGuideAtMs: number | null;
  lastShownAtByTrigger: Partial<Record<MascotBehaviorEventType, number>>;
}

export type CooldownSuppressionReason =
  | "global_cooldown"
  | "per_trigger_cooldown";

export type GuideSuppressionReason =
  | CooldownSuppressionReason
  | "similarity";

export type GuideTurnOutcome =
  | "shown"
  | "suppressed_cooldown"
  | "suppressed_similarity"
  | "failed";

export interface ProcessGuideEventTurnInput {
  trigger: MascotBehaviorEvent;
  roleLens: RoleLens;
  mode?: MascotGuideMode;
  activeTourStepId?: TourStepId;
  currentSectionId?: SectionId;
  recentGuideMessages: string[];
  recentTriggerTypes: MascotBehaviorEventType[];
  conversationId?: string;
  cooldownSnapshot: GuideCooldownSnapshot;
  nowMs: number;
  similarityThreshold?: number;
  fetchGuide: (request: MascotGuideRequest) => Promise<MascotGuideResponse>;
}

export interface ProcessGuideEventTurnResult {
  outcome: GuideTurnOutcome;
  guideText?: string;
  request: MascotGuideRequest;
  cooldownSnapshot: GuideCooldownSnapshot;
  recentGuideMessages: string[];
  recentTriggerTypes: MascotBehaviorEventType[];
  suppressionReason?: CooldownSuppressionReason;
  similarityScore?: number;
}

export interface GuideTelemetryPayload {
  eventId: string;
  triggerType: MascotBehaviorEventType;
  roleLens: RoleLens;
  latencyMs: number;
  outcome: GuideTurnOutcome;
  suppressionReason?: GuideSuppressionReason;
  similarityScore?: number;
}

export interface BuildGuideTelemetryPayloadInput {
  trigger: MascotBehaviorEvent;
  outcome: GuideTurnOutcome;
  latencyMs: number;
  roleLens?: RoleLens;
  suppressionReason?: CooldownSuppressionReason;
  similarityScore?: number;
}

export function createGuideCooldownSnapshot(): GuideCooldownSnapshot {
  return {
    lastGuideAtMs: null,
    lastShownAtByTrigger: {},
  };
}

function normalizeLatencyMs(latencyMs: number): number {
  if (!Number.isFinite(latencyMs)) {
    return 0;
  }
  return Math.max(0, Math.round(latencyMs));
}

export function buildGuideTelemetryPayload(
  input: BuildGuideTelemetryPayloadInput
): GuideTelemetryPayload {
  const payload: GuideTelemetryPayload = {
    eventId: input.trigger.eventId,
    triggerType: input.trigger.type,
    roleLens: input.roleLens ?? input.trigger.roleLens,
    latencyMs: normalizeLatencyMs(input.latencyMs),
    outcome: input.outcome,
  };

  if (input.outcome === "suppressed_cooldown" && input.suppressionReason) {
    payload.suppressionReason = input.suppressionReason;
  }

  if (input.outcome === "suppressed_similarity") {
    payload.suppressionReason = "similarity";
    if (typeof input.similarityScore === "number") {
      payload.similarityScore = input.similarityScore;
    }
  }

  return payload;
}

export function createMascotBehaviorEventId(prefix = "behavior"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isGuideRoutePaused(pathname: string): boolean {
  return pathname.startsWith("/twin");
}

export function appendPendingEvent(
  pendingEvents: MascotBehaviorEvent[],
  event: MascotBehaviorEvent,
  maxSize = MASCOT_PENDING_EVENT_LIMIT
): MascotBehaviorEvent[] {
  if (pendingEvents.some((entry) => entry.eventId === event.eventId)) {
    return pendingEvents;
  }

  const next = [...pendingEvents, event];
  if (next.length <= maxSize) {
    return next;
  }

  return next.slice(next.length - maxSize);
}

export function removePendingEventById(
  pendingEvents: MascotBehaviorEvent[],
  eventId: string
): MascotBehaviorEvent[] {
  return pendingEvents.filter((event) => event.eventId !== eventId);
}

export function sortBehaviorEventsByPriorityNewest(
  pendingEvents: MascotBehaviorEvent[]
): MascotBehaviorEvent[] {
  return [...pendingEvents].sort((left, right) => {
    const rightPriority = eventPriority[right.type];
    const leftPriority = eventPriority[left.type];
    if (rightPriority !== leftPriority) {
      return rightPriority - leftPriority;
    }
    if (right.occurredAtMs !== left.occurredAtMs) {
      return right.occurredAtMs - left.occurredAtMs;
    }
    return right.eventId.localeCompare(left.eventId);
  });
}

export function selectHighestPriorityEvent(
  pendingEvents: MascotBehaviorEvent[]
): MascotBehaviorEvent | null {
  const [selected] = sortBehaviorEventsByPriorityNewest(pendingEvents);
  return selected ?? null;
}

export function evaluateCooldownSuppression(
  event: MascotBehaviorEvent,
  nowMs: number,
  snapshot: GuideCooldownSnapshot
): CooldownSuppressionReason | null {
  if (
    typeof snapshot.lastGuideAtMs === "number" &&
    nowMs - snapshot.lastGuideAtMs < globalCooldownMs
  ) {
    return "global_cooldown";
  }

  const lastShownForTrigger = snapshot.lastShownAtByTrigger[event.type];
  if (
    typeof lastShownForTrigger === "number" &&
    nowMs - lastShownForTrigger < perTriggerCooldownMs[event.type]
  ) {
    return "per_trigger_cooldown";
  }

  return null;
}

function tokenizeForSimilarity(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[`*_#()[\]{}<>]/g, " ")
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

export function computeTokenSimilarity(left: string, right: string): number {
  const leftTokens = tokenizeForSimilarity(left);
  const rightTokens = tokenizeForSimilarity(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = leftTokens.size + rightTokens.size - intersectionCount;
  if (unionCount === 0) {
    return 0;
  }

  return intersectionCount / unionCount;
}

export function maxSimilarityAgainstRecent(
  candidateText: string,
  recentGuideMessages: string[]
): number {
  let maxScore = 0;
  for (const line of recentGuideMessages) {
    const score = computeTokenSimilarity(candidateText, line);
    if (score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
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

export function boundGuideBubbleText(raw: string): string {
  return trimToWordBoundary(
    raw
      .replace(/\s+/g, " ")
      .replace(/[`*_>#]/g, "")
      .trim(),
    maxGuideChars
  );
}

export function appendRecentGuideMessage(
  recentGuideMessages: string[],
  message: string
): string[] {
  const bounded = boundGuideBubbleText(message);
  if (!bounded) {
    return recentGuideMessages.slice(-MAX_RECENT_GUIDE_MESSAGES);
  }

  return [...recentGuideMessages, bounded].slice(-MAX_RECENT_GUIDE_MESSAGES);
}

export function appendRecentTriggerType(
  recentTriggerTypes: MascotBehaviorEventType[],
  triggerType: MascotBehaviorEventType
): MascotBehaviorEventType[] {
  return [...recentTriggerTypes, triggerType].slice(-MAX_RECENT_TRIGGER_TYPES);
}

export interface BuildGuideRequestInput {
  trigger: MascotBehaviorEvent;
  roleLens: RoleLens;
  mode?: MascotGuideMode;
  activeTourStepId?: TourStepId;
  currentSectionId?: SectionId;
  recentGuideMessages: string[];
  recentTriggerTypes: MascotBehaviorEventType[];
  conversationId?: string;
}

export function buildMascotGuideRequest(
  input: BuildGuideRequestInput
): MascotGuideRequest {
  const context: MascotGuideRequest["context"] = {
    roleLens: input.roleLens,
    recentGuideMessages: input.recentGuideMessages.slice(-MAX_RECENT_GUIDE_MESSAGES),
    recentTriggerTypes: input.recentTriggerTypes.slice(-MAX_RECENT_TRIGGER_TYPES),
  };

  if (input.mode) {
    context.mode = input.mode;
  }

  if (input.activeTourStepId) {
    context.activeTourStepId = input.activeTourStepId;
  }

  if (input.currentSectionId) {
    context.currentSectionId = input.currentSectionId;
  }

  if (input.conversationId) {
    context.conversationId = input.conversationId;
  }

  return {
    trigger: input.trigger,
    context,
  };
}

export function shouldEmitIdleNudge(
  lastActivityAtMs: number,
  nowMs: number,
  idleThresholdMs = DEFAULT_IDLE_NUDGE_MS
): boolean {
  return nowMs - lastActivityAtMs >= idleThresholdMs;
}

export interface BuildIdleNudgeEventInput {
  nowMs: number;
  pathname: string;
  roleLens: RoleLens;
  sessionId: string;
  lastSectionId?: SectionId;
  eventIdFactory?: () => string;
}

export function buildIdleNudgeEvent(
  input: BuildIdleNudgeEventInput
): MascotBehaviorEvent {
  const eventIdFactory =
    input.eventIdFactory ?? (() => createMascotBehaviorEventId("behavior"));

  const event: MascotBehaviorEvent = {
    eventId: eventIdFactory(),
    occurredAtMs: input.nowMs,
    sessionId: input.sessionId,
    pathname: input.pathname,
    roleLens: input.roleLens,
    type: "idle_nudge",
    idleMs: DEFAULT_IDLE_NUDGE_MS,
  };

  if (input.lastSectionId) {
    event.lastSectionId = input.lastSectionId;
  }

  return event;
}

export async function processGuideEventTurn(
  input: ProcessGuideEventTurnInput
): Promise<ProcessGuideEventTurnResult> {
  const effectiveMode: MascotGuideMode = input.mode ?? "reactive";
  const bypassSuppressionForReactiveNavigation =
    effectiveMode === "reactive" &&
    REACTIVE_SUPPRESSION_BYPASS_TRIGGER_SET.has(input.trigger.type);

  const requestInput: BuildGuideRequestInput = {
    trigger: input.trigger,
    roleLens: input.roleLens,
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.activeTourStepId
      ? { activeTourStepId: input.activeTourStepId }
      : {}),
    recentGuideMessages: input.recentGuideMessages,
    recentTriggerTypes: input.recentTriggerTypes,
  };

  if (input.currentSectionId) {
    requestInput.currentSectionId = input.currentSectionId;
  }

  if (input.conversationId) {
    requestInput.conversationId = input.conversationId;
  }

  const request = buildMascotGuideRequest(requestInput);

  if (!bypassSuppressionForReactiveNavigation) {
    const cooldownSuppression = evaluateCooldownSuppression(
      input.trigger,
      input.nowMs,
      input.cooldownSnapshot
    );
    if (cooldownSuppression) {
      return {
        outcome: "suppressed_cooldown",
        request,
        cooldownSnapshot: input.cooldownSnapshot,
        recentGuideMessages: input.recentGuideMessages.slice(
          -MAX_RECENT_GUIDE_MESSAGES
        ),
        recentTriggerTypes: input.recentTriggerTypes.slice(
          -MAX_RECENT_TRIGGER_TYPES
        ),
        suppressionReason: cooldownSuppression,
      };
    }
  }

  let response: MascotGuideResponse;
  try {
    response = await input.fetchGuide(request);
  } catch {
    return {
      outcome: "failed",
      request,
      cooldownSnapshot: input.cooldownSnapshot,
      recentGuideMessages: input.recentGuideMessages.slice(-MAX_RECENT_GUIDE_MESSAGES),
      recentTriggerTypes: input.recentTriggerTypes.slice(-MAX_RECENT_TRIGGER_TYPES),
    };
  }

  if (response.status !== "ok") {
    return {
      outcome: "failed",
      request,
      cooldownSnapshot: input.cooldownSnapshot,
      recentGuideMessages: input.recentGuideMessages.slice(-MAX_RECENT_GUIDE_MESSAGES),
      recentTriggerTypes: input.recentTriggerTypes.slice(-MAX_RECENT_TRIGGER_TYPES),
    };
  }

  const guideText = boundGuideBubbleText(response.guide.text);
  if (!guideText) {
    return {
      outcome: "failed",
      request,
      cooldownSnapshot: input.cooldownSnapshot,
      recentGuideMessages: input.recentGuideMessages.slice(-MAX_RECENT_GUIDE_MESSAGES),
      recentTriggerTypes: input.recentTriggerTypes.slice(-MAX_RECENT_TRIGGER_TYPES),
    };
  }

  const similarityThreshold =
    input.similarityThreshold ?? DEFAULT_GUIDE_SIMILARITY_THRESHOLD;
  const similarityScore = maxSimilarityAgainstRecent(
    guideText,
    input.recentGuideMessages
  );

  if (
    !bypassSuppressionForReactiveNavigation &&
    similarityScore >= similarityThreshold
  ) {
    return {
      outcome: "suppressed_similarity",
      request,
      cooldownSnapshot: input.cooldownSnapshot,
      recentGuideMessages: input.recentGuideMessages.slice(
        -MAX_RECENT_GUIDE_MESSAGES
      ),
      recentTriggerTypes: input.recentTriggerTypes.slice(
        -MAX_RECENT_TRIGGER_TYPES
      ),
      similarityScore,
    };
  }

  const nextCooldownSnapshot: GuideCooldownSnapshot = {
    lastGuideAtMs: input.nowMs,
    lastShownAtByTrigger: {
      ...input.cooldownSnapshot.lastShownAtByTrigger,
      [input.trigger.type]: input.nowMs,
    },
  };

  return {
    outcome: "shown",
    guideText,
    request,
    cooldownSnapshot: nextCooldownSnapshot,
    recentGuideMessages: appendRecentGuideMessage(
      input.recentGuideMessages,
      guideText
    ),
    recentTriggerTypes: appendRecentTriggerType(
      input.recentTriggerTypes,
      input.trigger.type
    ),
    similarityScore,
  };
}
