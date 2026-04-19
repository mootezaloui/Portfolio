import assert from "node:assert/strict";
import test from "node:test";

import {
  behaviorQueueLimit,
  maxMessagesPerMinute,
  type MascotBehaviorEvent,
} from "../../lib/twin/guide/contracts";
import {
  clearBehaviorQueue,
  consumeNextBehaviorEvent,
  enqueueBehaviorEvent,
  getBehaviorSessionId,
  getQueuedBehaviorEvents,
  subscribeToBehaviorQueue,
} from "../../lib/twin/guide/clientStore";

function makeProjectOpenEvent(
  suffix: string,
  occurredAtMs: number
): MascotBehaviorEvent {
  return {
    eventId: `evt-${suffix}`,
    occurredAtMs,
    sessionId: "session-queue",
    pathname: "/",
    roleLens: "general",
    type: "project_open",
    projectSlug: `project-${suffix}`,
    projectTitle: `Project ${suffix}`,
  };
}

function makeRouteChangeEvent(
  suffix: string,
  occurredAtMs: number
): MascotBehaviorEvent {
  return {
    eventId: `evt-route-${suffix}`,
    occurredAtMs,
    sessionId: "session-queue",
    pathname: `/from-${suffix}`,
    roleLens: "general",
    type: "route_change",
    fromPath: `/from-${suffix}`,
    toPath: `/to-${suffix}`,
  };
}

test("guide store: enqueue/consume keeps FIFO ordering", () => {
  clearBehaviorQueue();

  const first = makeProjectOpenEvent("1", 10_000);
  const second = makeProjectOpenEvent("2", 80_000);

  assert.equal(enqueueBehaviorEvent(first), true);
  assert.equal(enqueueBehaviorEvent(second), true);

  assert.equal(consumeNextBehaviorEvent()?.eventId, first.eventId);
  assert.equal(consumeNextBehaviorEvent()?.eventId, second.eventId);
  assert.equal(consumeNextBehaviorEvent(), undefined);
});

test("guide store: queue limit is enforced", () => {
  clearBehaviorQueue();

  for (let index = 0; index < behaviorQueueLimit + 5; index += 1) {
    const accepted = enqueueBehaviorEvent(
      makeProjectOpenEvent(String(index), index * 70_000)
    );
    assert.equal(accepted, true);
  }

  const queued = getQueuedBehaviorEvents();
  assert.equal(queued.length, behaviorQueueLimit);
  assert.equal(queued[0]?.eventId, "evt-5");
  assert.equal(queued.at(-1)?.eventId, `evt-${behaviorQueueLimit + 4}`);
});

test("guide store: dedup suppression follows trigger cooldown", () => {
  clearBehaviorQueue();

  const firstEvent: MascotBehaviorEvent = {
    eventId: "evt-a",
    occurredAtMs: 0,
    sessionId: "session-dedup",
    pathname: "/",
    roleLens: "general",
    type: "section_enter",
    sectionId: "experience",
  };

  const duplicateWithinCooldown: MascotBehaviorEvent = {
    ...firstEvent,
    eventId: "evt-b",
    occurredAtMs: 5_000,
  };

  const duplicateAfterCooldown: MascotBehaviorEvent = {
    ...firstEvent,
    eventId: "evt-c",
    occurredAtMs: 12_000,
  };

  assert.equal(enqueueBehaviorEvent(firstEvent), true);
  assert.equal(enqueueBehaviorEvent(duplicateWithinCooldown), false);
  assert.equal(enqueueBehaviorEvent(duplicateAfterCooldown), true);
  assert.equal(getQueuedBehaviorEvents().length, 2);
});

test("guide store: minute cap suppression respects maxMessagesPerMinute", () => {
  clearBehaviorQueue();

  for (let index = 0; index < maxMessagesPerMinute; index += 1) {
    const accepted = enqueueBehaviorEvent(
      makeRouteChangeEvent(String(index), index * 1_000)
    );
    assert.equal(accepted, true);
  }

  const rejected = enqueueBehaviorEvent(
    makeRouteChangeEvent("overflow", maxMessagesPerMinute * 1_000)
  );
  assert.equal(rejected, false);

  const acceptedAfterWindow = enqueueBehaviorEvent(
    makeRouteChangeEvent("after-window", 61_000)
  );
  assert.equal(acceptedAfterWindow, true);
});

test("guide store: project_open bypasses minute cap but still respects per-project cooldown", () => {
  clearBehaviorQueue();

  const firstClick = makeProjectOpenEvent("same-project", 0);
  const duplicateWithinCooldown: MascotBehaviorEvent = {
    ...firstClick,
    eventId: "evt-same-project-duplicate",
    occurredAtMs: 1_000,
  };

  assert.equal(enqueueBehaviorEvent(firstClick), true);
  assert.equal(enqueueBehaviorEvent(duplicateWithinCooldown), false);

  for (let index = 0; index < maxMessagesPerMinute + 3; index += 1) {
    const accepted = enqueueBehaviorEvent(
      makeProjectOpenEvent(`project-${index}`, 2_000 + index * 1_000)
    );
    assert.equal(accepted, true);
  }
});

test("guide store: subscription receives queue snapshots", () => {
  clearBehaviorQueue();
  const snapshots: number[] = [];

  const unsubscribe = subscribeToBehaviorQueue((queue) => {
    snapshots.push(queue.length);
  });

  enqueueBehaviorEvent(makeProjectOpenEvent("sub", 1_000));
  consumeNextBehaviorEvent();
  unsubscribe();

  assert.ok(snapshots.length >= 3);
  assert.equal(snapshots[0], 0);
  assert.ok(snapshots.includes(1));
});

test("guide store: behavior session id is stable within process fallback", () => {
  clearBehaviorQueue();

  const first = getBehaviorSessionId();
  const second = getBehaviorSessionId();

  assert.equal(typeof first, "string");
  assert.ok(first.length > 0);
  assert.equal(first, second);
});
