import {
  behaviorQueueLimit,
  maxMessagesPerMinute,
  perTriggerCooldownMs,
  type MascotBehaviorEvent,
} from "./contracts";

const SESSION_STORAGE_KEY = "tazou:mascot:session-id";
const ONE_MINUTE_MS = 60_000;

let fallbackSessionId: string | null = null;

const queue: MascotBehaviorEvent[] = [];
const recentAcceptedByKey = new Map<string, number>();
const acceptedTimestamps: number[] = [];

export type BehaviorQueueListener = (
  queuedEvents: readonly MascotBehaviorEvent[],
  lastEvent?: MascotBehaviorEvent
) => void;

const listeners = new Set<BehaviorQueueListener>();

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDedupKey(event: MascotBehaviorEvent): string {
  switch (event.type) {
    case "section_enter":
      return `${event.type}:${event.sectionId}`;
    case "project_open":
      return `${event.type}:${event.projectSlug}`;
    case "lens_switch":
      return `${event.type}:${event.fromLens}->${event.toLens}`;
    case "route_change":
      return `${event.type}:${event.fromPath}->${event.toPath}`;
    case "idle_nudge":
      return `${event.type}:${event.lastSectionId ?? "none"}`;
    case "tab_change":
      return `${event.type}:${event.toTab}`;
    case "rail_focus":
      return `${event.type}:${event.tab}:${event.focusId}`;
  }
}

function cleanupAccepted(nowMs: number): void {
  while (acceptedTimestamps.length > 0) {
    const first = acceptedTimestamps[0];
    if (typeof first === "number" && nowMs - first > ONE_MINUTE_MS) {
      acceptedTimestamps.shift();
      continue;
    }
    break;
  }
}

function notify(lastEvent?: MascotBehaviorEvent): void {
  const snapshot = getQueuedBehaviorEvents();
  for (const listener of listeners) {
    listener(snapshot, lastEvent);
  }
}

export function getBehaviorSessionId(): string {
  if (typeof window === "undefined") {
    if (!fallbackSessionId) {
      fallbackSessionId = createId("mascot-session");
    }
    return fallbackSessionId;
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && existing.length > 0) {
      return existing;
    }
    const next = createId("mascot-session");
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
    return next;
  } catch {
    if (!fallbackSessionId) {
      fallbackSessionId = createId("mascot-session");
    }
    return fallbackSessionId;
  }
}

export function enqueueBehaviorEvent(event: MascotBehaviorEvent): boolean {
  const dedupKey = getDedupKey(event);
  const cooldownMs = perTriggerCooldownMs[event.type];
  const nowMs = event.occurredAtMs;
  const bypassMinuteCap =
    event.type === "project_open" ||
    event.type === "tab_change" ||
    event.type === "rail_focus";

  const lastAcceptedAt = recentAcceptedByKey.get(dedupKey);
  if (typeof lastAcceptedAt === "number" && nowMs - lastAcceptedAt < cooldownMs) {
    return false;
  }

  if (!bypassMinuteCap) {
    cleanupAccepted(nowMs);
    if (acceptedTimestamps.length >= maxMessagesPerMinute) {
      return false;
    }
  }

  queue.push(event);
  if (queue.length > behaviorQueueLimit) {
    queue.splice(0, queue.length - behaviorQueueLimit);
  }

  recentAcceptedByKey.set(dedupKey, nowMs);
  if (!bypassMinuteCap) {
    acceptedTimestamps.push(nowMs);
  }
  notify(event);
  return true;
}

export function getQueuedBehaviorEvents(): MascotBehaviorEvent[] {
  return [...queue];
}

export function consumeNextBehaviorEvent(): MascotBehaviorEvent | undefined {
  const event = queue.shift();
  notify();
  return event;
}

export function subscribeToBehaviorQueue(
  listener: BehaviorQueueListener
): () => void {
  listeners.add(listener);
  listener(getQueuedBehaviorEvents());
  return () => {
    listeners.delete(listener);
  };
}

export function clearBehaviorQueue(): void {
  queue.length = 0;
  recentAcceptedByKey.clear();
  acceptedTimestamps.length = 0;
  notify();
}
