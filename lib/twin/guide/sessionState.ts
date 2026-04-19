import { z } from "zod";

import {
  MASCOT_BEHAVIOR_EVENT_TYPES,
  MascotBehaviorEventTypeSchema,
  SectionIdSchema,
  type MascotBehaviorEventType,
  type SectionId,
} from "./contracts";
import type { GuideCooldownSnapshot } from "./orchestration";

export const MASCOT_GUIDE_SESSION_STATE_KEY = "tazou:mascot:guide-state:v1";
export const MASCOT_GUIDE_SESSION_STATE_VERSION = 1;
export const MASCOT_GUIDE_SESSION_STATE_TTL_MS = 30 * 60_000;
export const MAX_RECENT_GUIDE_MESSAGES = 3;
export const MAX_RECENT_TRIGGER_TYPES = 5;

const TriggerTimestampMapSchema = z
  .object({
    section_enter: z.number().int().nonnegative().optional(),
    project_open: z.number().int().nonnegative().optional(),
    lens_switch: z.number().int().nonnegative().optional(),
    route_change: z.number().int().nonnegative().optional(),
    idle_nudge: z.number().int().nonnegative().optional(),
  })
  .strict();

const GuideCooldownSnapshotSchema = z
  .object({
    lastGuideAtMs: z.number().int().nonnegative().nullable(),
    lastShownAtByTrigger: TriggerTimestampMapSchema,
  })
  .strict();

const PersistedMascotGuideSessionStateSchema = z
  .object({
    version: z.literal(MASCOT_GUIDE_SESSION_STATE_VERSION),
    updatedAtMs: z.number().int().nonnegative(),
    cooldownSnapshot: GuideCooldownSnapshotSchema,
    recentGuideMessages: z.array(z.string()).max(MAX_RECENT_GUIDE_MESSAGES),
    recentTriggerTypes: z
      .array(MascotBehaviorEventTypeSchema)
      .max(MAX_RECENT_TRIGGER_TYPES),
    lastSectionId: SectionIdSchema.optional(),
  })
  .strict();

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MascotGuideSessionState {
  cooldownSnapshot: GuideCooldownSnapshot;
  recentGuideMessages: string[];
  recentTriggerTypes: MascotBehaviorEventType[];
  lastSectionId?: SectionId;
}

function normalizeTimestamp(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.round(value);
}

function normalizeCooldownSnapshot(snapshot: {
  lastGuideAtMs: number | null;
  lastShownAtByTrigger: Partial<
    Record<MascotBehaviorEventType, number | undefined>
  >;
}): GuideCooldownSnapshot {
  const normalizedTriggerMap: Partial<Record<MascotBehaviorEventType, number>> = {};

  for (const triggerType of MASCOT_BEHAVIOR_EVENT_TYPES) {
    const timestamp = normalizeTimestamp(snapshot.lastShownAtByTrigger[triggerType]);
    if (typeof timestamp === "number") {
      normalizedTriggerMap[triggerType] = timestamp;
    }
  }

  const normalizedLastGuideAtMs = normalizeTimestamp(snapshot.lastGuideAtMs);

  return {
    lastGuideAtMs:
      typeof normalizedLastGuideAtMs === "number" ? normalizedLastGuideAtMs : null,
    lastShownAtByTrigger: normalizedTriggerMap,
  };
}

function normalizeRecentGuideMessages(messages: string[]): string[] {
  return messages
    .map((message) => message.replace(/\s+/g, " ").trim())
    .filter((message) => message.length > 0)
    .slice(-MAX_RECENT_GUIDE_MESSAGES);
}

function normalizeRecentTriggerTypes(
  triggerTypes: MascotBehaviorEventType[]
): MascotBehaviorEventType[] {
  return triggerTypes.slice(-MAX_RECENT_TRIGGER_TYPES);
}

export function normalizeMascotGuideSessionState(
  state: MascotGuideSessionState
): MascotGuideSessionState {
  const normalized: MascotGuideSessionState = {
    cooldownSnapshot: normalizeCooldownSnapshot(state.cooldownSnapshot),
    recentGuideMessages: normalizeRecentGuideMessages(state.recentGuideMessages),
    recentTriggerTypes: normalizeRecentTriggerTypes(state.recentTriggerTypes),
  };

  if (state.lastSectionId) {
    normalized.lastSectionId = state.lastSectionId;
  }

  return normalized;
}

export function getBrowserSessionStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveMascotGuideSessionState(
  state: MascotGuideSessionState,
  storage: StorageLike | null = getBrowserSessionStorage(),
  nowMs = Date.now()
): void {
  if (!storage) {
    return;
  }

  const normalizedState = normalizeMascotGuideSessionState(state);
  const payload = {
    version: MASCOT_GUIDE_SESSION_STATE_VERSION,
    updatedAtMs: Math.max(0, Math.round(nowMs)),
    cooldownSnapshot: normalizedState.cooldownSnapshot,
    recentGuideMessages: normalizedState.recentGuideMessages,
    recentTriggerTypes: normalizedState.recentTriggerTypes,
    ...(normalizedState.lastSectionId
      ? { lastSectionId: normalizedState.lastSectionId }
      : {}),
  };

  try {
    storage.setItem(MASCOT_GUIDE_SESSION_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Storage failures should never break mascot behavior.
  }
}

export function clearMascotGuideSessionState(
  storage: StorageLike | null = getBrowserSessionStorage()
): void {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(MASCOT_GUIDE_SESSION_STATE_KEY);
  } catch {
    // Ignore storage clear failures.
  }
}

export function loadMascotGuideSessionState(
  storage: StorageLike | null = getBrowserSessionStorage(),
  nowMs = Date.now(),
  ttlMs = MASCOT_GUIDE_SESSION_STATE_TTL_MS
): MascotGuideSessionState | null {
  if (!storage) {
    return null;
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(MASCOT_GUIDE_SESSION_STATE_KEY);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearMascotGuideSessionState(storage);
    return null;
  }

  const result = PersistedMascotGuideSessionStateSchema.safeParse(parsed);
  if (!result.success) {
    clearMascotGuideSessionState(storage);
    return null;
  }

  const ageMs = Math.max(0, Math.round(nowMs)) - result.data.updatedAtMs;
  if (ageMs > ttlMs) {
    clearMascotGuideSessionState(storage);
    return null;
  }

  const normalized: MascotGuideSessionState = {
    cooldownSnapshot: normalizeCooldownSnapshot(result.data.cooldownSnapshot),
    recentGuideMessages: normalizeRecentGuideMessages(
      result.data.recentGuideMessages
    ),
    recentTriggerTypes: normalizeRecentTriggerTypes(
      result.data.recentTriggerTypes
    ),
  };
  if (result.data.lastSectionId) {
    normalized.lastSectionId = result.data.lastSectionId;
  }

  return normalized;
}
