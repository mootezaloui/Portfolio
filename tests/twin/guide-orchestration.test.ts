import assert from "node:assert/strict";
import test from "node:test";

import {
  globalCooldownMs,
  perTriggerCooldownMs,
  type MascotBehaviorEvent,
} from "../../lib/twin/guide/contracts";
import {
  appendPendingEvent,
  buildGuideTelemetryPayload,
  buildIdleNudgeEvent,
  createGuideCooldownSnapshot,
  DEFAULT_IDLE_NUDGE_MS,
  evaluateCooldownSuppression,
  isGuideRoutePaused,
  processGuideEventTurn,
  removePendingEventById,
  selectHighestPriorityEvent,
  shouldEmitIdleNudge,
} from "../../lib/twin/guide/orchestration";

function makeBaseEvent(overrides: Partial<MascotBehaviorEvent>): MascotBehaviorEvent {
  const base: MascotBehaviorEvent = {
    eventId: "evt-base",
    occurredAtMs: 10_000,
    sessionId: "session-1",
    pathname: "/",
    roleLens: "general",
    type: "section_enter",
    sectionId: "about",
  };

  return {
    ...base,
    ...overrides,
  } as MascotBehaviorEvent;
}

test("guide orchestration: priority selection prefers higher priority then newest", () => {
  const sectionEvent = makeBaseEvent({
    eventId: "evt-section",
    occurredAtMs: 10_000,
    type: "section_enter",
    sectionId: "experience",
  });
  const projectEvent = makeBaseEvent({
    eventId: "evt-project",
    occurredAtMs: 9_000,
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  });
  const routeEvent = makeBaseEvent({
    eventId: "evt-route",
    occurredAtMs: 20_000,
    type: "route_change",
    fromPath: "/",
    toPath: "/projects/law-firm-management-software",
  });

  const selected = selectHighestPriorityEvent([sectionEvent, routeEvent, projectEvent]);
  assert.equal(selected?.type, "project_open");
  assert.equal(selected?.eventId, "evt-project");

  const olderSection = makeBaseEvent({
    eventId: "evt-section-older",
    occurredAtMs: 30_000,
    type: "section_enter",
    sectionId: "about",
  });
  const newerSection = makeBaseEvent({
    eventId: "evt-section-newer",
    occurredAtMs: 31_000,
    type: "section_enter",
    sectionId: "skills",
  });

  const tieSelected = selectHighestPriorityEvent([olderSection, newerSection]);
  assert.equal(tieSelected?.eventId, "evt-section-newer");
});

test("guide orchestration: cooldown suppression handles global and per-trigger windows", () => {
  const sectionEvent = makeBaseEvent({
    eventId: "evt-global",
    occurredAtMs: 12_000,
    type: "section_enter",
    sectionId: "experience",
  });

  const globalSuppression = evaluateCooldownSuppression(sectionEvent, 12_000, {
    lastGuideAtMs: 6_000,
    lastShownAtByTrigger: {},
  });
  assert.equal(globalSuppression, "global_cooldown");

  const perTriggerSuppression = evaluateCooldownSuppression(sectionEvent, 30_000, {
    lastGuideAtMs: 0,
    lastShownAtByTrigger: {
      section_enter: 25_000,
    },
  });
  assert.equal(perTriggerSuppression, "per_trigger_cooldown");

  const globalBoundaryAllowed = evaluateCooldownSuppression(
    sectionEvent,
    6_000 + globalCooldownMs,
    {
      lastGuideAtMs: 6_000,
      lastShownAtByTrigger: {},
    }
  );
  assert.equal(globalBoundaryAllowed, null);

  const perTriggerBoundaryAllowed = evaluateCooldownSuppression(
    sectionEvent,
    25_000 + perTriggerCooldownMs.section_enter,
    {
      lastGuideAtMs: 0,
      lastShownAtByTrigger: {
        section_enter: 25_000,
      },
    }
  );
  assert.equal(perTriggerBoundaryAllowed, null);
});

test("guide orchestration: similarity suppression blocks repetitive guide output", async () => {
  const sectionEvent = makeBaseEvent({
    eventId: "evt-similarity",
    occurredAtMs: 40_000,
    type: "section_enter",
    sectionId: "projects",
  });

  const result = await processGuideEventTurn({
    trigger: sectionEvent,
    roleLens: "ai",
    currentSectionId: "projects",
    recentGuideMessages: [
      "I built this project to expose engineering decisions under pressure and measurable tradeoffs.",
    ],
    recentTriggerTypes: ["section_enter"],
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 50_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-1",
        text: "I built this project to expose engineering decisions under pressure and measurable tradeoffs.",
        tone: "guide",
        triggerType: "section_enter",
        roleLens: "ai",
        charCount: 120,
        generatedAt: 50_000,
      },
      meta: {
        providerId: "mock",
        providerModel: "mock-v1",
        latencyMs: 2,
        cached: false,
        classificationDecision: "in_scope",
      },
    }),
  });

  assert.equal(result.outcome, "suppressed_similarity");
  assert.ok((result.similarityScore ?? 0) >= 0.82);
});

test("guide orchestration: pending queue supports collapsed buffering and replay ordering", () => {
  const sectionEvent = makeBaseEvent({
    eventId: "evt-collapsed-section",
    occurredAtMs: 60_000,
    type: "section_enter",
    sectionId: "experience",
  });
  const projectEvent = makeBaseEvent({
    eventId: "evt-collapsed-project",
    occurredAtMs: 61_000,
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  });

  let pending: MascotBehaviorEvent[] = [];
  pending = appendPendingEvent(pending, sectionEvent);
  pending = appendPendingEvent(pending, sectionEvent); // dedup by event id
  pending = appendPendingEvent(pending, projectEvent);
  assert.equal(pending.length, 2);

  const selected = selectHighestPriorityEvent(pending);
  assert.equal(selected?.eventId, "evt-collapsed-project");

  const replayQueue = removePendingEventById(
    pending,
    selected?.eventId ?? "evt-missing"
  );
  assert.equal(replayQueue.length, 1);
  assert.equal(replayQueue[0]?.eventId, "evt-collapsed-section");
});

test("guide orchestration: idle timer uses 30s threshold and preserves last section context", () => {
  assert.equal(shouldEmitIdleNudge(0, 29_999), false);
  assert.equal(shouldEmitIdleNudge(0, DEFAULT_IDLE_NUDGE_MS), true);

  const idleEvent = buildIdleNudgeEvent({
    nowMs: 80_000,
    pathname: "/",
    roleLens: "general",
    sessionId: "session-idle",
    lastSectionId: "experience",
    eventIdFactory: () => "evt-idle",
  });

  assert.equal(idleEvent.type, "idle_nudge");
  assert.equal(idleEvent.eventId, "evt-idle");
  assert.equal(idleEvent.lastSectionId, "experience");
  assert.equal(idleEvent.idleMs, DEFAULT_IDLE_NUDGE_MS);
});

test("guide orchestration: /twin routes pause mascot guide narration", () => {
  assert.equal(isGuideRoutePaused("/twin"), true);
  assert.equal(isGuideRoutePaused("/twin/abc-123"), true);
  assert.equal(isGuideRoutePaused("/"), false);
  assert.equal(isGuideRoutePaused("/projects/law-firm-management-software"), false);
});

test("guide orchestration flow: event builds request context and successful turn returns guide text", async () => {
  const trigger = makeBaseEvent({
    eventId: "evt-flow",
    occurredAtMs: 90_000,
    type: "route_change",
    fromPath: "/",
    toPath: "/projects/law-firm-management-software",
  });

  let capturedRequest: unknown;

  const result = await processGuideEventTurn({
    trigger,
    roleLens: "cloud",
    currentSectionId: "projects",
    recentGuideMessages: ["a", "b", "c", "d"],
    recentTriggerTypes: [
      "section_enter",
      "project_open",
      "route_change",
      "lens_switch",
      "idle_nudge",
      "section_enter",
    ],
    conversationId: "conv-guide-flow",
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 100_000,
    fetchGuide: async (request) => {
      capturedRequest = request;
      return {
        status: "ok",
        guide: {
          id: "guide-flow",
          text: "I use this transition to highlight why this destination matters for infrastructure reliability decisions.",
          tone: "guide",
          triggerType: "route_change",
          roleLens: "cloud",
          charCount: 115,
          generatedAt: 100_000,
        },
        meta: {
          providerId: "mock",
          providerModel: "mock-v1",
          latencyMs: 3,
          cached: false,
          classificationDecision: "in_scope",
        },
      };
    },
  });

  assert.equal(result.outcome, "shown");
  assert.ok(typeof result.guideText === "string");
  assert.ok((result.guideText?.length ?? 0) > 0);
  assert.equal(result.recentGuideMessages.length, 3);
  assert.equal(result.recentTriggerTypes.length, 5);
  assert.equal(result.cooldownSnapshot.lastGuideAtMs, 100_000);
  assert.equal(result.cooldownSnapshot.lastShownAtByTrigger.route_change, 100_000);

  const request = capturedRequest as {
    trigger: { eventId: string };
    context: {
      roleLens: string;
      currentSectionId?: string;
      recentGuideMessages: string[];
      recentTriggerTypes: string[];
      conversationId?: string;
    };
  };

  assert.equal(request.trigger.eventId, "evt-flow");
  assert.equal(request.context.roleLens, "cloud");
  assert.equal(request.context.currentSectionId, "projects");
  assert.equal(request.context.recentGuideMessages.length, 3);
  assert.equal(request.context.recentTriggerTypes.length, 5);
  assert.equal(request.context.conversationId, "conv-guide-flow");
});

test("guide orchestration flow: guide fetch failures are silent skip outcomes", async () => {
  const trigger = makeBaseEvent({
    eventId: "evt-failure",
    occurredAtMs: 110_000,
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  });

  const thrownFailure = await processGuideEventTurn({
    trigger,
    roleLens: "general",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 111_000,
    fetchGuide: async () => {
      throw new Error("network down");
    },
  });

  assert.equal(thrownFailure.outcome, "failed");
  assert.equal(thrownFailure.guideText, undefined);

  const errorResponseFailure = await processGuideEventTurn({
    trigger,
    roleLens: "general",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 112_000,
    fetchGuide: async () => ({
      status: "error",
      code: "internal_error",
      message: "provider unavailable",
    }),
  });

  assert.equal(errorResponseFailure.outcome, "failed");
  assert.equal(errorResponseFailure.guideText, undefined);
});

test("guide orchestration flow: repeated turns suppress redundant guide copy", async () => {
  const trigger = makeBaseEvent({
    eventId: "evt-repeat-a",
    occurredAtMs: 130_000,
    type: "section_enter",
    sectionId: "projects",
  });

  const first = await processGuideEventTurn({
    trigger,
    roleLens: "general",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    cooldownSnapshot: createGuideCooldownSnapshot(),
    nowMs: 130_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-repeat-a",
        text: "I focus this case summary on the most important tradeoff and what changed after failure analysis.",
        tone: "guide",
        triggerType: "section_enter",
        roleLens: "general",
        charCount: 120,
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
  });

  assert.equal(first.outcome, "shown");

  const second = await processGuideEventTurn({
    trigger: {
      ...trigger,
      eventId: "evt-repeat-b",
      occurredAtMs: 150_000,
    },
    roleLens: "general",
    recentGuideMessages: first.recentGuideMessages,
    recentTriggerTypes: first.recentTriggerTypes,
    cooldownSnapshot: first.cooldownSnapshot,
    nowMs: 150_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-repeat-b",
        text: "I focus this case summary on the most important tradeoff and what changed after failure analysis.",
        tone: "guide",
        triggerType: "section_enter",
        roleLens: "general",
        charCount: 120,
        generatedAt: 150_000,
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

  assert.equal(second.outcome, "suppressed_similarity");
  assert.equal(second.suppressionReason, undefined);
  assert.ok((second.similarityScore ?? 0) >= 0.82);
});

test("guide orchestration flow: reactive project_open bypasses cooldown and similarity suppression", async () => {
  const trigger = makeBaseEvent({
    eventId: "evt-project-bypass-a",
    occurredAtMs: 160_000,
    type: "project_open",
    projectSlug: "promptrend-llm-vulnerability-discovery",
    projectTitle: "PrompTrend",
  });

  const first = await processGuideEventTurn({
    trigger,
    roleLens: "general",
    mode: "reactive",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    cooldownSnapshot: {
      lastGuideAtMs: 159_500,
      lastShownAtByTrigger: {
        project_open: 159_500,
      },
    },
    nowMs: 160_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-project-bypass-a",
        text: "I designed this case to show practical tradeoffs under delivery pressure.",
        tone: "guide",
        triggerType: "project_open",
        roleLens: "general",
        charCount: 90,
        generatedAt: 160_000,
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

  const second = await processGuideEventTurn({
    trigger: {
      ...trigger,
      eventId: "evt-project-bypass-b",
      occurredAtMs: 161_000,
    },
    roleLens: "general",
    mode: "reactive",
    recentGuideMessages: first.recentGuideMessages,
    recentTriggerTypes: first.recentTriggerTypes,
    cooldownSnapshot: first.cooldownSnapshot,
    nowMs: 161_000,
    fetchGuide: async () => ({
      status: "ok",
      guide: {
        id: "guide-project-bypass-b",
        text: "I designed this case to show practical tradeoffs under delivery pressure.",
        tone: "guide",
        triggerType: "project_open",
        roleLens: "general",
        charCount: 90,
        generatedAt: 161_000,
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

  assert.equal(second.outcome, "shown");
});

test("guide orchestration telemetry: payload includes trigger, latency, and suppression fields", () => {
  const trigger = makeBaseEvent({
    eventId: "evt-telemetry",
    occurredAtMs: 120_000,
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  });

  const shown = buildGuideTelemetryPayload({
    trigger,
    outcome: "shown",
    latencyMs: 42.2,
  });
  assert.equal(shown.eventId, "evt-telemetry");
  assert.equal(shown.triggerType, "project_open");
  assert.equal(shown.outcome, "shown");
  assert.equal(shown.latencyMs, 42);
  assert.equal(shown.suppressionReason, undefined);

  const suppressedCooldown = buildGuideTelemetryPayload({
    trigger,
    outcome: "suppressed_cooldown",
    latencyMs: 15,
    suppressionReason: "global_cooldown",
  });
  assert.equal(suppressedCooldown.suppressionReason, "global_cooldown");

  const suppressedSimilarity = buildGuideTelemetryPayload({
    trigger,
    outcome: "suppressed_similarity",
    latencyMs: 16,
    similarityScore: 0.91,
  });
  assert.equal(suppressedSimilarity.suppressionReason, "similarity");
  assert.equal(suppressedSimilarity.similarityScore, 0.91);
});
