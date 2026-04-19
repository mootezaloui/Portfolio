import type { MascotBehaviorEvent, SectionId } from "../guide/contracts";
import type { RuntimeAnchorSnapshot } from "./anchors";
import type { MascotAnchorId, MascotMotionState } from "./contracts";

export interface MotionPoint {
  x: number;
  y: number;
}

export interface MovementViewport {
  width: number;
  height: number;
}

export interface MovementBounds {
  width: number;
  height: number;
}

export const POINTING_CUE_MS = 900;

export const MASCOT_MOVEMENT_EASING_PRESETS = {
  calm: 0.68,
  settle: 0.74,
  returning: 0.62,
} as const;

export type MascotMovementEasingPreset = keyof typeof MASCOT_MOVEMENT_EASING_PRESETS;

export interface InterpolatedMotionStepInput {
  position: MotionPoint;
  target: MotionPoint;
  deltaMs: number;
  snapThresholdPx: number;
  maxSpeedPxPerSec: number;
  easingPreset: MascotMovementEasingPreset;
}

export interface InterpolatedMotionStepResult {
  nextPosition: MotionPoint;
  distancePx: number;
  arrived: boolean;
}

export interface SwitchAnchorInput {
  currentAnchorId: MascotAnchorId;
  nextAnchorId: MascotAnchorId;
  nowMs: number;
  lastSwitchAtMs: number;
  minDwellMs: number;
}

const SECTION_TO_ANCHOR: Record<SectionId, MascotAnchorId> = {
  about: "section_about",
  projects: "section_projects",
  experience: "section_experience",
  skills: "section_skills",
  certifications: "section_certifications",
  contact: "section_contact",
};

const BEHAVIOR_PRIORITY_WEIGHT: Record<MascotBehaviorEvent["type"], number> = {
  project_open: 100,
  tab_change: 95,
  rail_focus: 85,
  section_enter: 80,
  lens_switch: 70,
  route_change: 50,
  idle_nudge: 20,
};

const MOBILE_MOVEMENT_TRIGGER_SET = new Set<MascotBehaviorEvent["type"]>([
  "project_open",
  "section_enter",
]);

function clampFinite(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
}

export function distanceBetweenPoints(a: MotionPoint, b: MotionPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function clampScenePosition(
  position: MotionPoint,
  viewport: MovementViewport,
  sceneSize: MovementBounds,
  insetPx = 12
): MotionPoint {
  const safeInset = Math.max(0, insetPx);
  const maxX = Math.max(safeInset, clampFinite(viewport.width) - sceneSize.width - safeInset);
  const maxY = Math.max(
    safeInset,
    clampFinite(viewport.height) - sceneSize.height - safeInset
  );

  return {
    x: Math.min(Math.max(position.x, safeInset), maxX),
    y: Math.min(Math.max(position.y, safeInset), maxY),
  };
}

export function stepInterpolatedMotion(
  input: InterpolatedMotionStepInput
): InterpolatedMotionStepResult {
  const start = input.position;
  const target = input.target;
  const distancePx = distanceBetweenPoints(start, target);
  if (distancePx <= Math.max(0, input.snapThresholdPx)) {
    return {
      nextPosition: { ...target },
      distancePx,
      arrived: true,
    };
  }

  const deltaSeconds = Math.max(0, input.deltaMs) / 1000;
  const maxStep = Math.max(1, input.maxSpeedPxPerSec) * deltaSeconds;
  const baseRatio = Math.min(1, maxStep / distancePx);
  const smoothing = MASCOT_MOVEMENT_EASING_PRESETS[input.easingPreset];
  const ratio = 1 - Math.pow(1 - baseRatio, smoothing);

  const nextPosition: MotionPoint = {
    x: start.x + (target.x - start.x) * ratio,
    y: start.y + (target.y - start.y) * ratio,
  };

  const nextDistance = distanceBetweenPoints(nextPosition, target);
  const arrived = nextDistance <= Math.max(0, input.snapThresholdPx);

  return {
    nextPosition: arrived ? { ...target } : nextPosition,
    distancePx: nextDistance,
    arrived,
  };
}

export function shouldSwitchAnchorTarget(input: SwitchAnchorInput): boolean {
  if (input.nextAnchorId === input.currentAnchorId) {
    return false;
  }

  if (input.nextAnchorId === "rest_corner") {
    return true;
  }

  if (input.currentAnchorId === "rest_corner") {
    return true;
  }

  return input.nowMs - input.lastSwitchAtMs >= input.minDwellMs;
}

export interface MoveRateLimitInput {
  nowMs: number;
  maxMovesPerMinute: number;
  recentSwitchesMs: readonly number[];
}

export interface MoveRateLimitResult {
  allowed: boolean;
  nextRecentSwitchesMs: number[];
}

export function applyMoveRateLimit(input: MoveRateLimitInput): MoveRateLimitResult {
  const minuteAgoMs = input.nowMs - 60_000;
  const normalized = input.recentSwitchesMs
    .filter((timestamp) => Number.isFinite(timestamp) && timestamp >= minuteAgoMs)
    .sort((left, right) => left - right);

  const maxMoves = Math.max(0, Math.floor(input.maxMovesPerMinute));
  if (maxMoves === 0) {
    return {
      allowed: false,
      nextRecentSwitchesMs: normalized,
    };
  }

  if (normalized.length >= maxMoves) {
    return {
      allowed: false,
      nextRecentSwitchesMs: normalized,
    };
  }

  return {
    allowed: true,
    nextRecentSwitchesMs: [...normalized, input.nowMs],
  };
}

export function resolvePreferredAnchorId(input: {
  pathname: string;
  hasActiveGuidance: boolean;
  availableAnchors: Partial<Record<MascotAnchorId, RuntimeAnchorSnapshot>>;
  lastSectionId?: SectionId;
  trigger?: MascotBehaviorEvent;
  forcedAnchorId?: MascotAnchorId;
}): MascotAnchorId {
  const hasAnchor = (anchorId: MascotAnchorId): boolean =>
    Boolean(input.availableAnchors[anchorId]);
  const resolveProjectAnchor = (): MascotAnchorId | null => {
    if (input.pathname.startsWith("/projects/") && hasAnchor("project_primary_case_page")) {
      return "project_primary_case_page";
    }
    if (hasAnchor("project_primary_case_home")) {
      return "project_primary_case_home";
    }
    if (hasAnchor("project_primary_case_page")) {
      return "project_primary_case_page";
    }
    return null;
  };
  const resolveTwinEntryAnchor = (): MascotAnchorId | null => {
    if (hasAnchor("twin_entry_button_hero")) {
      return "twin_entry_button_hero";
    }
    if (hasAnchor("twin_entry_button_mascot")) {
      return "twin_entry_button_mascot";
    }
    return null;
  };

  if (!input.hasActiveGuidance) {
    return "rest_corner";
  }

  if (input.forcedAnchorId && hasAnchor(input.forcedAnchorId)) {
    return input.forcedAnchorId;
  }

  if (input.trigger) {
    switch (input.trigger.type) {
      case "project_open": {
        const projectAnchor = resolveProjectAnchor();
        if (projectAnchor) {
          return projectAnchor;
        }
        if (hasAnchor("section_projects")) {
          return "section_projects";
        }
        break;
      }
      case "section_enter": {
        const sectionAnchorId = SECTION_TO_ANCHOR[input.trigger.sectionId];
        if (sectionAnchorId && hasAnchor(sectionAnchorId)) {
          return sectionAnchorId;
        }
        break;
      }
      case "route_change":
        if (input.trigger.toPath.startsWith("/projects/")) {
          const projectAnchor = resolveProjectAnchor();
          if (projectAnchor) {
            return projectAnchor;
          }
          if (hasAnchor("section_projects")) {
            return "section_projects";
          }
        }
        break;
      case "idle_nudge": {
        const twinEntryAnchor = resolveTwinEntryAnchor();
        if (twinEntryAnchor) {
          return twinEntryAnchor;
        }
        break;
      }
      case "lens_switch":
        if (hasAnchor("hero_primary")) {
          return "hero_primary";
        }
        break;
    }
  }

  if (input.pathname.startsWith("/projects/")) {
    const projectAnchor = resolveProjectAnchor();
    if (projectAnchor) {
      return projectAnchor;
    }
  }

  if (input.lastSectionId) {
    const sectionAnchorId = SECTION_TO_ANCHOR[input.lastSectionId];
    if (sectionAnchorId && hasAnchor(sectionAnchorId)) {
      return sectionAnchorId;
    }
  }

  if (hasAnchor("hero_primary")) {
    return "hero_primary";
  }

  const twinEntryAnchor = resolveTwinEntryAnchor();
  if (twinEntryAnchor) {
    return twinEntryAnchor;
  }

  return "rest_corner";
}

export function compareBehaviorPriority(
  left: MascotBehaviorEvent,
  right: MascotBehaviorEvent
): number {
  const leftWeight = BEHAVIOR_PRIORITY_WEIGHT[left.type];
  const rightWeight = BEHAVIOR_PRIORITY_WEIGHT[right.type];

  if (rightWeight !== leftWeight) {
    return rightWeight - leftWeight;
  }
  if (right.occurredAtMs !== left.occurredAtMs) {
    return right.occurredAtMs - left.occurredAtMs;
  }
  return right.eventId.localeCompare(left.eventId);
}

export interface MotionTriggerPolicyInput {
  triggerType: MascotBehaviorEvent["type"];
  viewportMode: "desktop" | "mobile";
  quietMode: boolean;
  prefersReducedMotion: boolean;
}

export function shouldTriggerMotionForEvent(
  input: MotionTriggerPolicyInput
): boolean {
  if (input.prefersReducedMotion || input.quietMode) {
    return false;
  }

  if (input.viewportMode === "mobile") {
    return MOBILE_MOVEMENT_TRIGGER_SET.has(input.triggerType);
  }

  return true;
}

export interface DistanceClampInput {
  origin: MotionPoint;
  target: MotionPoint;
  maxDistancePx: number;
}

export function limitTargetDistanceFromOrigin(
  input: DistanceClampInput
): MotionPoint {
  const safeMaxDistance = Math.max(0, input.maxDistancePx);
  if (safeMaxDistance === 0) {
    return { ...input.origin };
  }

  const distance = distanceBetweenPoints(input.origin, input.target);
  if (distance <= safeMaxDistance || distance === 0) {
    return { ...input.target };
  }

  const ratio = safeMaxDistance / distance;
  return {
    x: input.origin.x + (input.target.x - input.origin.x) * ratio,
    y: input.origin.y + (input.target.y - input.origin.y) * ratio,
  };
}

export interface BoundsLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ScenePositionCandidate {
  x: number;
  y: number;
}

export interface SafeScenePlacementInput {
  desiredPosition: MotionPoint;
  sceneSize: MovementBounds;
  viewport: MovementViewport;
  protectedRects: readonly BoundsLike[];
  insetPx?: number;
  clearancePx?: number;
}

function toSceneBounds(position: MotionPoint, sceneSize: MovementBounds): BoundsLike {
  return {
    left: position.x,
    top: position.y,
    right: position.x + sceneSize.width,
    bottom: position.y + sceneSize.height,
    width: sceneSize.width,
    height: sceneSize.height,
  };
}

function expandBounds(bounds: BoundsLike, padding: number): BoundsLike {
  return {
    left: bounds.left - padding,
    top: bounds.top - padding,
    right: bounds.right + padding,
    bottom: bounds.bottom + padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

function intersectionArea(left: BoundsLike, right: BoundsLike): number {
  const intersectLeft = Math.max(left.left, right.left);
  const intersectTop = Math.max(left.top, right.top);
  const intersectRight = Math.min(left.right, right.right);
  const intersectBottom = Math.min(left.bottom, right.bottom);
  const width = Math.max(0, intersectRight - intersectLeft);
  const height = Math.max(0, intersectBottom - intersectTop);
  return width * height;
}

function overlapAreaWithProtectedZones(
  position: MotionPoint,
  sceneSize: MovementBounds,
  protectedRects: readonly BoundsLike[],
  clearancePx: number
): number {
  const sceneBounds = toSceneBounds(position, sceneSize);
  let totalOverlap = 0;

  for (const protectedRect of protectedRects) {
    totalOverlap += intersectionArea(
      sceneBounds,
      expandBounds(protectedRect, clearancePx)
    );
  }

  return totalOverlap;
}

export function resolveSafeScenePosition(
  input: SafeScenePlacementInput
): MotionPoint {
  const inset = Math.max(0, input.insetPx ?? 12);
  const clearance = Math.max(0, input.clearancePx ?? 10);
  const clampedDesired = clampScenePosition(
    input.desiredPosition,
    input.viewport,
    input.sceneSize,
    inset
  );

  if (input.protectedRects.length === 0) {
    return clampedDesired;
  }

  const initialOverlap = overlapAreaWithProtectedZones(
    clampedDesired,
    input.sceneSize,
    input.protectedRects,
    clearance
  );
  if (initialOverlap === 0) {
    return clampedDesired;
  }

  const candidateDistanceGap = Math.max(8, clearance + 8);
  const candidates: ScenePositionCandidate[] = [{ ...clampedDesired }];

  for (const protectedRect of input.protectedRects) {
    candidates.push(
      {
        x: protectedRect.left - input.sceneSize.width - candidateDistanceGap,
        y: clampedDesired.y,
      },
      {
        x: protectedRect.right + candidateDistanceGap,
        y: clampedDesired.y,
      },
      {
        x: clampedDesired.x,
        y: protectedRect.top - input.sceneSize.height - candidateDistanceGap,
      },
      {
        x: clampedDesired.x,
        y: protectedRect.bottom + candidateDistanceGap,
      },
      {
        x: protectedRect.left - input.sceneSize.width - candidateDistanceGap,
        y: protectedRect.top - input.sceneSize.height - candidateDistanceGap,
      },
      {
        x: protectedRect.right + candidateDistanceGap,
        y: protectedRect.top - input.sceneSize.height - candidateDistanceGap,
      },
      {
        x: protectedRect.left - input.sceneSize.width - candidateDistanceGap,
        y: protectedRect.bottom + candidateDistanceGap,
      },
      {
        x: protectedRect.right + candidateDistanceGap,
        y: protectedRect.bottom + candidateDistanceGap,
      }
    );
  }

  let best = clampedDesired;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const clamped = clampScenePosition(candidate, input.viewport, input.sceneSize, inset);
    const overlapScore =
      overlapAreaWithProtectedZones(
        clamped,
        input.sceneSize,
        input.protectedRects,
        clearance
      ) * 1000;
    const distanceScore = distanceBetweenPoints(clamped, clampedDesired);
    const totalScore = overlapScore + distanceScore;

    if (totalScore < bestScore) {
      bestScore = totalScore;
      best = clamped;
    }
  }

  return best;
}

export interface MotionGuidanceGateInput {
  hasGuideEvent: boolean;
  isProcessingGuide: boolean;
  isRoutePaused: boolean;
  isCollapsed: boolean;
  isTypingSuppressed: boolean;
}

export function shouldActivateMotionGuidance(
  input: MotionGuidanceGateInput
): boolean {
  if (input.isRoutePaused || input.isCollapsed || input.isTypingSuppressed) {
    return false;
  }

  return input.hasGuideEvent || input.isProcessingGuide;
}

export interface SpeechGateInput extends MotionGuidanceGateInput {
  movementState: MascotMotionState;
  allowStaticStart?: boolean;
}

export function shouldStartGuideSpeech(input: SpeechGateInput): boolean {
  if (!shouldActivateMotionGuidance(input)) {
    return false;
  }

  if (!input.hasGuideEvent || input.isProcessingGuide) {
    return false;
  }

  if (input.allowStaticStart) {
    return input.movementState === "speaking" || input.movementState === "idle";
  }

  return input.movementState === "speaking";
}
