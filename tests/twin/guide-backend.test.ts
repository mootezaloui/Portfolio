import assert from "node:assert/strict";
import test from "node:test";

import type { TwinProvider } from "../../lib/twin/providers/types";
import {
  maxGuideChars,
  type MascotBehaviorEvent,
  type MascotGuideRequest,
} from "../../lib/twin/guide/contracts";
import { runTwinGuideTurn } from "../../lib/twin/guide/chat";
import {
  assembleTwinGuidePrompt,
  buildGuideQueryText,
} from "../../lib/twin/guide/prompt";

const baseEvent = {
  eventId: "evt-base",
  occurredAtMs: 1_710_000_000_000,
  sessionId: "session-1",
  pathname: "/",
  roleLens: "general" as const,
};

const baseContext: MascotGuideRequest["context"] = {
  roleLens: "general",
  recentGuideMessages: [],
  recentTriggerTypes: [],
  conversationId: "conv-guide-tests",
};

function buildRequest(trigger: MascotBehaviorEvent): MascotGuideRequest {
  return {
    trigger,
    context: {
      ...baseContext,
      roleLens: trigger.roleLens,
    },
  };
}

test("guide backend: prompt assembly locks first-person voice and bubble cap", () => {
  const request = buildRequest({
    ...baseEvent,
    type: "section_enter",
    sectionId: "projects",
  });
  const query = buildGuideQueryText(request);
  const prompt = assembleTwinGuidePrompt({
    request,
    query,
    baseTemplateText: "Base template text for deterministic guidance.",
    retrievedChunks: [
      {
        id: "chunk-1",
        sourceFile: "projects.md",
        heading: "Projects",
        text: "Mootez describes tradeoffs and system decisions in project case files.",
        score: 0.9,
      },
    ],
    corpus: {
      voiceSpec: "First-person Mootez tone.",
      approach: "Constrained and pragmatic.",
      career: "Engineering contexts.",
      opinions: "Operational credibility.",
    },
  });

  assert.match(prompt, /first person/i);
  assert.match(prompt, /1-2 short sentences/i);
  assert.match(prompt, new RegExp(String(maxGuideChars)));
  assert.match(query, /Mootez guide event/i);
  assert.match(prompt, /LENS STYLE PACK/i);
  assert.match(prompt, /Avoid repeating wording from RECENT GUIDE MESSAGES/i);
});

test("guide backend: valid triggers return concise guide response", async () => {
  const verboseProvider: TwinProvider = {
    id: "mock-guide",
    model: "mock-guide-v1",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "mock-guide",
        model: "mock-guide-v1",
        text: "I built this runtime to expose engineering reasoning under constraints and make tradeoffs inspectable instead of presentation-only outputs. I recommend opening the linked case to inspect decisions, failures, and lessons with evidence.",
        latencyMs: 1,
      };
    },
  };

  const requests: MascotGuideRequest[] = [
    buildRequest({
      ...baseEvent,
      type: "section_enter",
      sectionId: "experience",
    }),
    buildRequest({
      ...baseEvent,
      type: "project_open",
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay - Desktop Legal Operations Platform",
    }),
    buildRequest({
      ...baseEvent,
      type: "lens_switch",
      fromLens: "general",
      toLens: "ai",
    }),
    buildRequest({
      ...baseEvent,
      type: "route_change",
      fromPath: "/",
      toPath: "/projects/law-firm-management-software",
    }),
    buildRequest({
      ...baseEvent,
      type: "idle_nudge",
      idleMs: 20_000,
      lastSectionId: "projects",
    }),
  ];

  for (const request of requests) {
    const result = await runTwinGuideTurn(request, {
      providers: [verboseProvider],
      weakContextThreshold: -1,
    });

    assert.equal(result.status, "ok");
    assert.equal(result.guide.tone, "guide");
    assert.ok(result.guide.text.length > 0);
    assert.ok(result.guide.text.length <= maxGuideChars);
    assert.equal(result.guide.charCount, result.guide.text.length);
  }
});

test("guide backend: out-of-scope path returns deterministic template fallback", async () => {
  let providerCalls = 0;
  const provider: TwinProvider = {
    id: "should-not-call",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      providerCalls += 1;
      return {
        providerId: "should-not-call",
        model: "mock-v1",
        text: "Should not be called for out-of-scope guide query.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "route_change",
      fromPath: "/",
      toPath: "/weather/tunis",
    }),
    {
      providers: [provider],
      weakContextThreshold: -1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.classificationDecision, "out_of_scope");
  assert.equal(result.meta.providerId, "template-fallback");
  assert.equal(providerCalls, 0);
  assert.ok(result.guide.text.length <= maxGuideChars);
});

test("guide backend: validator failure swaps response to deterministic template", async () => {
  const invalidProvider: TwinProvider = {
    id: "validator-fail-provider",
    model: "mock-v2",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "validator-fail-provider",
        model: "mock-v2",
        text: "As an AI language model, I can answer any question and I just checked live data for you.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "project_open",
      projectSlug: "promptrend-llm-vulnerability-discovery",
      projectTitle: "PrompTrend",
    }),
    {
      providers: [invalidProvider],
      weakContextThreshold: -1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.providerId, "template-fallback");
  assert.equal(result.meta.providerModel, "deterministic-template-v1");
  assert.doesNotMatch(result.guide.text, /as an ai language model/i);
});

test("guide backend: provider fallback chain uses later provider on failure", async () => {
  const primaryDown: TwinProvider = {
    id: "primary-down",
    model: "broken-model",
    isConfigured: () => true,
    async generate() {
      throw new Error("primary unavailable");
    },
  };

  const skippedProvider: TwinProvider = {
    id: "skipped",
    model: "skip-model",
    isConfigured: () => false,
    async generate() {
      return {
        providerId: "skipped",
        model: "skip-model",
        text: "Should not run.",
        latencyMs: 1,
      };
    },
  };

  const fallbackProvider: TwinProvider = {
    id: "fallback-provider",
    model: "fallback-v1",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "fallback-provider",
        model: "fallback-v1",
        text: "I use this section to show concrete engineering decisions and where each tradeoff improved reliability.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "section_enter",
      sectionId: "about",
    }),
    {
      providers: [primaryDown, skippedProvider, fallbackProvider],
      weakContextThreshold: -1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.providerId, "fallback-provider");
  assert.equal(result.meta.providerModel, "fallback-v1");
  assert.equal(result.meta.cached, false);
});

test("guide backend: weak-context path uses deterministic template fallback", async () => {
  let providerCalls = 0;
  const provider: TwinProvider = {
    id: "weak-context-provider",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      providerCalls += 1;
      return {
        providerId: "weak-context-provider",
        model: "mock-v1",
        text: "This should not be generated when weak context suppression is active.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "section_enter",
      sectionId: "about",
    }),
    {
      providers: [provider],
      weakContextThreshold: 1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.classificationDecision, "out_of_scope");
  assert.equal(result.meta.providerId, "template-fallback");
  assert.equal(providerCalls, 0);
});

test("guide backend: reactive project_open bypasses weak-context template fallback", async () => {
  let providerCalls = 0;
  const provider: TwinProvider = {
    id: "project-open-provider",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      providerCalls += 1;
      return {
        providerId: "project-open-provider",
        model: "mock-v1",
        text: "Good pick. This case is strongest on constrained architecture and measurable delivery tradeoffs.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "project_open",
      projectSlug: "promptrend-llm-vulnerability-discovery",
      projectTitle: "PrompTrend",
    }),
    {
      providers: [provider],
      weakContextThreshold: 1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.providerId, "project-open-provider");
  assert.equal(providerCalls, 1);
});

test("guide backend: style calibration caps bubble text to at most two sentences", async () => {
  const verboseProvider: TwinProvider = {
    id: "style-provider",
    model: "style-v1",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "style-provider",
        model: "style-v1",
        text: "I built this section to show constraints. It explains tradeoffs under delivery pressure. It documents what failed and what changed. It adds another sentence that should be trimmed.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      type: "section_enter",
      sectionId: "about",
    }),
    {
      providers: [verboseProvider],
      weakContextThreshold: -1,
    }
  );

  const sentenceCount = result.guide.text
    .split(/(?<=[.!?])\s+/)
    .filter((part) => part.trim().length > 0).length;

  assert.equal(result.status, "ok");
  assert.ok(sentenceCount <= 2);
});

test("guide backend: lens-aware wording is injected when provider text is lens-neutral", async () => {
  const neutralProvider: TwinProvider = {
    id: "neutral-provider",
    model: "neutral-v1",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "neutral-provider",
        model: "neutral-v1",
        text: "I focus on practical decision quality and execution constraints.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinGuideTurn(
    buildRequest({
      ...baseEvent,
      roleLens: "cyber",
      type: "project_open",
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay",
    }),
    {
      providers: [neutralProvider],
      weakContextThreshold: -1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.guide.roleLens, "cyber");
  assert.match(result.guide.text, /cybersecurity lens/i);
});

test("guide backend: tour prompt-leak output is replaced with deterministic template", async () => {
  const leakingProvider: TwinProvider = {
    id: "leak-provider",
    model: "leak-v1",
    isConfigured: () => true,
    async generate() {
      return {
        providerId: "leak-provider",
        model: "leak-v1",
        text: "Mootez guided tour step: hero. Rewrite the explanation clearly in General framing while keeping it concise.",
        latencyMs: 1,
      };
    },
  };

  const request = buildRequest({
    ...baseEvent,
    type: "route_change",
    fromPath: "/",
    toPath: "/",
  });

  const result = await runTwinGuideTurn(
    {
      ...request,
      context: {
        ...request.context,
        mode: "tour",
        activeTourStepId: "hero",
      },
    },
    {
      providers: [leakingProvider],
      weakContextThreshold: -1,
    }
  );

  assert.equal(result.status, "ok");
  assert.equal(result.meta.providerId, "template-fallback");
  assert.doesNotMatch(result.guide.text, /mootez guided tour step:/i);
  assert.doesNotMatch(result.guide.text, /rewrite the explanation clearly/i);
});
