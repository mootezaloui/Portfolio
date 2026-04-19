import assert from "node:assert/strict";
import test from "node:test";

import { clearTwinResponseCache } from "../../lib/twin/cache";
import { runTwinChatTurn } from "../../lib/twin/chat";
import { clearTwinRateLimits } from "../../lib/twin/rateLimit";
import type { TwinProvider } from "../../lib/twin/providers/types";

test("integration: in-scope message uses provider and caches response", async () => {
  clearTwinRateLimits();
  clearTwinResponseCache();

  let calls = 0;
  const mockProvider: TwinProvider = {
    id: "mock",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      calls += 1;
      return {
        providerId: "mock",
        model: "mock-v1",
        text: "Mootez built PrompTrend for continuous LLM vulnerability discovery.",
        latencyMs: 1,
      };
    },
  };

  const first = await runTwinChatTurn(
    {
      message: "Explain Mootez project PrompTrend.",
      conversationId: "conv-integration-1",
      ipAddress: "127.0.0.1",
    },
    { providers: [mockProvider] }
  );

  assert.equal(first.classification.decision, "in_scope");
  assert.equal(first.cached, false);
  assert.equal(first.providerId, "mock");
  assert.equal(calls, 1);

  const second = await runTwinChatTurn(
    {
      message: "Explain Mootez project PrompTrend.",
      conversationId: "conv-integration-2",
      ipAddress: "127.0.0.2",
    },
    { providers: [mockProvider] }
  );

  assert.equal(second.cached, true);
  assert.equal(second.providerId, "mock");
  assert.equal(calls, 1);
});

test("integration: out-of-scope request is deflected without provider call", async () => {
  clearTwinRateLimits();
  clearTwinResponseCache();

  let calls = 0;
  const mockProvider: TwinProvider = {
    id: "mock",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      calls += 1;
      return {
        providerId: "mock",
        model: "mock-v1",
        text: "Should not be reached.",
        latencyMs: 1,
      };
    },
  };

  const result = await runTwinChatTurn(
    {
      message: "What is the weather in Tunis today?",
      conversationId: "conv-integration-3",
      ipAddress: "127.0.0.3",
    },
    { providers: [mockProvider] }
  );

  assert.equal(result.classification.decision, "out_of_scope");
  assert.equal(result.providerId, "policy-deflection");
  assert.equal(calls, 0);
});

test("integration: cache key is separated by role lens", async () => {
  clearTwinRateLimits();
  clearTwinResponseCache();

  let calls = 0;
  const mockProvider: TwinProvider = {
    id: "mock",
    model: "mock-v1",
    isConfigured: () => true,
    async generate() {
      calls += 1;
      return {
        providerId: "mock",
        model: "mock-v1",
        text: `Lens-aware response ${calls}: Mootez built PrompTrend as a constrained LLM vulnerability discovery pipeline with reproducible risk scoring.`,
        latencyMs: 1,
      };
    },
  };

  const first = await runTwinChatTurn(
    {
      message: "Explain Mootez project PrompTrend.",
      roleLens: "cyber",
      conversationId: "conv-lens-cache-1",
      ipAddress: "127.0.0.30",
    },
    { providers: [mockProvider] }
  );

  const second = await runTwinChatTurn(
    {
      message: "Explain Mootez project PrompTrend.",
      roleLens: "ai",
      conversationId: "conv-lens-cache-2",
      ipAddress: "127.0.0.31",
    },
    { providers: [mockProvider] }
  );

  const third = await runTwinChatTurn(
    {
      message: "Explain Mootez project PrompTrend.",
      roleLens: "cyber",
      conversationId: "conv-lens-cache-3",
      ipAddress: "127.0.0.32",
    },
    { providers: [mockProvider] }
  );

  assert.equal(first.cached, false);
  assert.equal(second.cached, false);
  assert.equal(third.cached, true);
  assert.equal(calls, 2);
});

test("integration: three-turn conversation returns three twin responses", async () => {
  clearTwinRateLimits();
  clearTwinResponseCache();

  const scriptedResponses = [
    "Mootez optimizes for constrained execution first, then scales complexity only after observability is in place.",
    "PrompTrend is the strongest adversarial-thinking proof because it operationalizes continuous LLM vulnerability discovery.",
    "A recurring lesson is to fail loudly and document the wrong fix before locking the corrected approach.",
  ];

  let calls = 0;
  const mockProvider: TwinProvider = {
    id: "mock",
    model: "mock-v2",
    isConfigured: () => true,
    async generate() {
      const fallback =
        scriptedResponses.at(-1) ??
        "Mootez documents tradeoffs directly and avoids generic assistant filler.";
      const next = scriptedResponses[calls] ?? fallback;
      calls += 1;
      return {
        providerId: "mock",
        model: "mock-v2",
        text: next,
        latencyMs: 1,
      };
    },
  };

  const conversationId = "conv-integration-e2e";

  const turn1 = await runTwinChatTurn(
    {
      message: "What is Mootez's engineering approach under constraints?",
      conversationId,
      ipAddress: "127.0.0.4",
    },
    { providers: [mockProvider] }
  );

  assert.equal(turn1.classification.decision, "in_scope");
  assert.equal(turn1.providerId, "mock");
  assert.doesNotMatch(turn1.response, /As an AI language model/i);

  const turn2 = await runTwinChatTurn(
    {
      message: "Which project best demonstrates adversarial AI thinking?",
      conversationId,
      history: [
        { role: "user", content: "What is Mootez's engineering approach under constraints?" },
        { role: "assistant", content: turn1.response },
      ],
      ipAddress: "127.0.0.4",
    },
    { providers: [mockProvider] }
  );

  assert.equal(turn2.classification.decision, "in_scope");
  assert.equal(turn2.providerId, "mock");
  assert.doesNotMatch(turn2.response, /As an AI language model/i);

  const turn3 = await runTwinChatTurn(
    {
      message: "What lesson did he extract from a failed implementation?",
      conversationId,
      history: [
        { role: "user", content: "What is Mootez's engineering approach under constraints?" },
        { role: "assistant", content: turn1.response },
        { role: "user", content: "Which project best demonstrates adversarial AI thinking?" },
        { role: "assistant", content: turn2.response },
      ],
      ipAddress: "127.0.0.4",
    },
    { providers: [mockProvider] }
  );

  assert.notEqual(turn3.classification.decision, "out_of_scope");
  assert.equal(turn3.providerId, "mock");
  assert.doesNotMatch(turn3.response, /As an AI language model/i);
  assert.equal(calls, 3);
});
