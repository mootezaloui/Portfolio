import assert from "node:assert/strict";
import test from "node:test";

import { POST } from "../../app/api/twin/guide/route";
import { MascotGuideResponseSchema } from "../../lib/twin/guide/contracts";

const validPayload = {
  trigger: {
    eventId: "evt-guide-route-1",
    occurredAtMs: 1_710_000_000_000,
    sessionId: "session-route",
    pathname: "/",
    roleLens: "general",
    type: "route_change",
    fromPath: "/",
    toPath: "/weather/tunis",
  },
  context: {
    roleLens: "general",
    recentGuideMessages: [],
    recentTriggerTypes: [],
    conversationId: "conv-route-test",
  },
} as const;

function buildRequest(body: string): Request {
  return new Request("http://127.0.0.1:3000/api/twin/guide", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

test("guide route: invalid payload returns 400 with schema issues", async () => {
  const request = buildRequest(
    JSON.stringify({
      trigger: {
        type: "section_enter",
      },
      context: {
        roleLens: "general",
      },
    })
  );

  const response = await POST(request);
  const payload = (await response.json()) as {
    status: string;
    code?: string;
    issues?: unknown[];
  };

  assert.equal(response.status, 400);
  assert.equal(payload.status, "error");
  assert.equal(payload.code, "invalid_payload");
  assert.ok(Array.isArray(payload.issues));
  assert.ok((payload.issues?.length ?? 0) > 0);
});

test("guide route: valid payload returns 200 success shape", async () => {
  const request = buildRequest(JSON.stringify(validPayload));
  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.doesNotThrow(() => {
    MascotGuideResponseSchema.parse(payload);
  });
  assert.equal((payload as { status: string }).status, "ok");
});

test("guide route: internal exception path returns 500", async () => {
  const request = buildRequest("{invalid_json");
  const response = await POST(request);
  const payload = (await response.json()) as {
    status: string;
    code?: string;
  };

  assert.equal(response.status, 500);
  assert.equal(payload.status, "error");
  assert.equal(payload.code, "internal_error");
});

test(
  "guide route: runtime-off guardrail returns not_ready",
  { concurrency: false },
  async () => {
  const previousRuntime = process.env.TWIN_GUIDE_RUNTIME;
  process.env.TWIN_GUIDE_RUNTIME = "off";

  try {
    const request = buildRequest(JSON.stringify(validPayload));
    const response = await POST(request);
    const payload = (await response.json()) as {
      status: string;
      code?: string;
    };

    assert.equal(response.status, 503);
    assert.equal(payload.status, "error");
    assert.equal(payload.code, "not_ready");
  } finally {
    if (typeof previousRuntime === "string") {
      process.env.TWIN_GUIDE_RUNTIME = previousRuntime;
    } else {
      delete process.env.TWIN_GUIDE_RUNTIME;
    }
  }
  }
);
