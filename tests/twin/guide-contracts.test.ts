import assert from "node:assert/strict";
import test from "node:test";

import {
  eventPriority,
  MascotBehaviorEventSchema,
  MASCOT_BEHAVIOR_EVENT_TYPES,
  MascotGuideRequestSchema,
  MascotGuideResponseSchema,
  maxGuideChars,
  perTriggerCooldownMs,
} from "../../lib/twin/guide/contracts";

const baseEvent = {
  eventId: "evt-1",
  occurredAtMs: 1_710_000_000_000,
  sessionId: "session-1",
  pathname: "/",
  roleLens: "general" as const,
};

test("guide contracts: accepts each behavior event variant", () => {
  const variants = [
    {
      ...baseEvent,
      type: "section_enter" as const,
      sectionId: "experience" as const,
    },
    {
      ...baseEvent,
      type: "project_open" as const,
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay - Desktop Legal Operations Platform",
    },
    {
      ...baseEvent,
      type: "lens_switch" as const,
      fromLens: "general" as const,
      toLens: "ai" as const,
    },
    {
      ...baseEvent,
      type: "route_change" as const,
      fromPath: "/",
      toPath: "/projects/law-firm-management-software",
    },
    {
      ...baseEvent,
      type: "idle_nudge" as const,
      idleMs: 20_000,
      lastSectionId: "projects" as const,
    },
    {
      ...baseEvent,
      type: "tab_change" as const,
      fromTab: "why-me" as const,
      toTab: "projects" as const,
    },
    {
      ...baseEvent,
      type: "rail_focus" as const,
      tab: "why-me" as const,
      focusId: "why-me" as const,
      source: "click" as const,
    },
    {
      ...baseEvent,
      type: "rail_focus" as const,
      tab: "experience" as const,
      focusId: "leadership" as const,
      source: "scroll" as const,
    },
  ];

  for (const variant of variants) {
    const parsed = MascotBehaviorEventSchema.parse(variant);
    assert.equal(parsed.type, variant.type);
  }
});

test("guide contracts: rejects invalid tab_change and rail_focus payloads", () => {
  assert.throws(() => {
    MascotBehaviorEventSchema.parse({
      ...baseEvent,
      type: "tab_change",
      fromTab: "why-me",
      toTab: "not-a-tab",
    });
  });

  assert.throws(() => {
    MascotBehaviorEventSchema.parse({
      ...baseEvent,
      type: "rail_focus",
      tab: "why-me",
      focusId: "not-a-focus",
      source: "click",
    });
  });

  assert.throws(() => {
    MascotBehaviorEventSchema.parse({
      ...baseEvent,
      type: "rail_focus",
      tab: "why-me",
      focusId: "overview",
      source: "keyboard",
    });
  });
});

test("guide contracts: rejects invalid variant field combinations", () => {
  const invalid = {
    ...baseEvent,
    type: "section_enter" as const,
    projectSlug: "should-not-pass",
  };

  assert.throws(() => {
    MascotBehaviorEventSchema.parse(invalid);
  });
});

test("guide contracts: enforces bounded guide context arrays", () => {
  const validRequest = {
    trigger: {
      ...baseEvent,
      type: "section_enter" as const,
      sectionId: "about" as const,
    },
    context: {
      roleLens: "general" as const,
      mode: "tour" as const,
      activeTourStepId: "why_me" as const,
      currentSectionId: "about" as const,
      recentGuideMessages: ["a", "b", "c"],
      recentTriggerTypes: [
        "section_enter",
        "project_open",
        "lens_switch",
        "route_change",
        "idle_nudge",
      ],
    },
  };

  assert.doesNotThrow(() => {
    MascotGuideRequestSchema.parse(validRequest);
  });

  const tooManyMessages = {
    ...validRequest,
    context: {
      ...validRequest.context,
      recentGuideMessages: ["a", "b", "c", "d"],
    },
  };

  assert.throws(() => {
    MascotGuideRequestSchema.parse(tooManyMessages);
  });

  const tooManyTriggers = {
    ...validRequest,
    context: {
      ...validRequest.context,
      recentTriggerTypes: [
        "section_enter",
        "project_open",
        "lens_switch",
        "route_change",
        "idle_nudge",
        "section_enter",
      ],
    },
  };

  assert.throws(() => {
    MascotGuideRequestSchema.parse(tooManyTriggers);
  });
});

test("guide contracts: cooldown and priority maps include all trigger types", () => {
  for (const eventType of MASCOT_BEHAVIOR_EVENT_TYPES) {
    assert.equal(typeof perTriggerCooldownMs[eventType], "number");
    assert.ok(perTriggerCooldownMs[eventType] > 0);
    assert.equal(typeof eventPriority[eventType], "number");
  }
});

test("guide contracts: response schema accepts both success and error shapes", () => {
  const okResponse = {
    status: "ok" as const,
    guide: {
      id: "guide-1",
      text: "I built this system to prioritize reliability under delivery pressure.",
      tone: "guide" as const,
      triggerType: "project_open" as const,
      roleLens: "ai" as const,
      charCount: Math.min(100, maxGuideChars),
      generatedAt: 1_710_000_000_500,
    },
    meta: {
      providerId: "mock",
      providerModel: "mock-v1",
      latencyMs: 42,
      cached: false,
      classificationDecision: "in_scope" as const,
    },
  };

  const errorResponse = {
    status: "error" as const,
    code: "invalid_payload" as const,
    message: "Payload does not match expected schema.",
    issues: [{ path: ["trigger"], message: "Invalid trigger" }],
  };

  assert.doesNotThrow(() => {
    MascotGuideResponseSchema.parse(okResponse);
    MascotGuideResponseSchema.parse(errorResponse);
  });
});
