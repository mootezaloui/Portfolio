import assert from "node:assert/strict";
import test from "node:test";

import { type MascotBehaviorEvent } from "../../lib/twin/guide/contracts";
import {
  createGuideCooldownSnapshot,
  processGuideEventTurn,
} from "../../lib/twin/guide/orchestration";
import {
  clearMascotGuideSessionState,
  loadMascotGuideSessionState,
  saveMascotGuideSessionState,
  type StorageLike,
} from "../../lib/twin/guide/sessionState";

function createMemoryStorage(seed: Record<string, string> = {}): StorageLike {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

function makeProjectOpenEvent(overrides: Partial<MascotBehaviorEvent>): MascotBehaviorEvent {
  const base: MascotBehaviorEvent = {
    eventId: "evt-project-base",
    occurredAtMs: 10_000,
    sessionId: "session-state",
    pathname: "/projects/law-firm-management-software",
    roleLens: "general",
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  };

  return {
    ...base,
    ...overrides,
  } as MascotBehaviorEvent;
}

test("guide session state: save/load roundtrip preserves normalized runtime fields", () => {
  const storage = createMemoryStorage();

  saveMascotGuideSessionState(
    {
      cooldownSnapshot: {
        lastGuideAtMs: 50_001.4,
        lastShownAtByTrigger: {
          project_open: 50_001.8,
        },
      },
      recentGuideMessages: [
        "  first message   ",
        "",
        "second message",
        "third message",
        "fourth message should be dropped",
      ],
      recentTriggerTypes: [
        "section_enter",
        "project_open",
        "lens_switch",
        "route_change",
        "idle_nudge",
        "section_enter",
      ],
      lastSectionId: "projects",
    },
    storage,
    60_000
  );

  const restored = loadMascotGuideSessionState(storage, 60_100);
  assert.ok(restored);
  if (!restored) {
    return;
  }

  assert.equal(restored.cooldownSnapshot.lastGuideAtMs, 50_001);
  assert.equal(restored.cooldownSnapshot.lastShownAtByTrigger.project_open, 50_002);
  assert.deepEqual(restored.recentGuideMessages, [
    "second message",
    "third message",
    "fourth message should be dropped",
  ]);
  assert.deepEqual(restored.recentTriggerTypes, [
    "project_open",
    "lens_switch",
    "route_change",
    "idle_nudge",
    "section_enter",
  ]);
  assert.equal(restored.lastSectionId, "projects");
});

test("guide session state: invalid payload is cleared and ignored", () => {
  const storage = createMemoryStorage({
    "tazou:mascot:guide-state:v1": "{bad-json",
  });

  const restored = loadMascotGuideSessionState(storage, 80_000);
  assert.equal(restored, null);
  assert.equal(storage.getItem("tazou:mascot:guide-state:v1"), null);
});

test("guide session state: stale state expires after ttl", () => {
  const storage = createMemoryStorage();

  saveMascotGuideSessionState(
    {
      cooldownSnapshot: createGuideCooldownSnapshot(),
      recentGuideMessages: ["fresh line"],
      recentTriggerTypes: ["section_enter"],
    },
    storage,
    1_000
  );

  const restored = loadMascotGuideSessionState(storage, 2_000_000);
  assert.equal(restored, null);
  assert.equal(storage.getItem("tazou:mascot:guide-state:v1"), null);
});

test("guide session state: reload keeps recent memory and still allows reactive project-open speech", async () => {
  const storage = createMemoryStorage();

  const first = await processGuideEventTurn({
    trigger: makeProjectOpenEvent({
      eventId: "evt-project-first",
      occurredAtMs: 100_000,
    }),
    roleLens: "general",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 100_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-first",
        text: "I highlight this case by pointing to the decision pressure and the measurable fix path.",
        tone: "guide",
        triggerType: "project_open",
        roleLens: "general",
        charCount: 94,
        generatedAt: 100_000,
      },
      meta: {
        providerId: "mock",
        providerModel: "mock-v1",
        latencyMs: 1,
        cached: false,
        classificationDecision: "in_scope",
      },
    }),
  });

  assert.equal(first.outcome, "shown");

  saveMascotGuideSessionState(
    {
      cooldownSnapshot: first.cooldownSnapshot,
      recentGuideMessages: first.recentGuideMessages,
      recentTriggerTypes: first.recentTriggerTypes,
      lastSectionId: "projects",
    },
    storage,
    100_100
  );

  const restored = loadMascotGuideSessionState(storage, 100_200);
  assert.ok(restored);
  if (!restored) {
    return;
  }

  const secondInput: Parameters<typeof processGuideEventTurn>[0] = {
    trigger: makeProjectOpenEvent({
      eventId: "evt-project-second",
      occurredAtMs: 130_000,
    }),
    roleLens: "general",
    recentGuideMessages: restored.recentGuideMessages,
    recentTriggerTypes: restored.recentTriggerTypes,
    cooldownSnapshot: restored.cooldownSnapshot,
    nowMs: 130_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-second",
        text: "I highlight this case by pointing to the decision pressure and the measurable fix path.",
        tone: "guide",
        triggerType: "project_open",
        roleLens: "general",
        charCount: 94,
        generatedAt: 130_000,
      },
      meta: {
        providerId: "mock",
        providerModel: "mock-v1",
        latencyMs: 1,
        cached: false,
        classificationDecision: "in_scope",
      },
    }),
  };
  if (restored.lastSectionId) {
    secondInput.currentSectionId = restored.lastSectionId;
  }

  const second = await processGuideEventTurn(secondInput);

  assert.equal(second.outcome, "shown");
});

test("guide session state: clear removes persisted entry", () => {
  const storage = createMemoryStorage();

  saveMascotGuideSessionState(
    {
      cooldownSnapshot: createGuideCooldownSnapshot(),
      recentGuideMessages: ["line"],
      recentTriggerTypes: ["idle_nudge"],
    },
    storage,
    10_000
  );
  assert.ok(storage.getItem("tazou:mascot:guide-state:v1"));

  clearMascotGuideSessionState(storage);
  assert.equal(storage.getItem("tazou:mascot:guide-state:v1"), null);
});
