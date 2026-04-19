import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_ANCHOR_REGISTRY,
  MASCOT_ANCHOR_IDS,
  MASCOT_MOTION_CONSTRAINTS,
  MASCOT_MOTION_STATES,
  MASCOT_MOTION_TRANSITIONS,
  MASCOT_MOTION_TRIGGERS,
  MASCOT_MOVEMENT_CONTRACT_VERSION,
  MASCOT_MOVEMENT_PLATFORM_DOCS,
  getAllowedMotionTransitions,
  resolveMotionTransition,
  type MascotMotionState,
} from "../../lib/twin/movement/contracts";

test("movement contracts: phase0 contract version is set", () => {
  assert.equal(MASCOT_MOVEMENT_CONTRACT_VERSION, "phase0-v1");
});

test("movement contracts: default anchor registry covers all anchor ids", () => {
  const registryIds = Object.keys(DEFAULT_ANCHOR_REGISTRY).sort();
  const expectedIds = [...MASCOT_ANCHOR_IDS].sort();

  assert.deepEqual(registryIds, expectedIds);

  for (const anchorId of MASCOT_ANCHOR_IDS) {
    const entry = DEFAULT_ANCHOR_REGISTRY[anchorId];
    assert.equal(entry.id, anchorId);
    assert.ok(entry.selector.length > 0);
    assert.ok(entry.routePattern.length > 0);
    assert.ok(entry.priority >= 0 && entry.priority <= 100);
    assert.ok(entry.requiredVisibleRatio >= 0 && entry.requiredVisibleRatio <= 1);
  }
});

test("movement contracts: transition table is exhaustive and deterministic", () => {
  for (const state of MASCOT_MOTION_STATES) {
    const transitionRow = MASCOT_MOTION_TRANSITIONS[state];
    const rowKeys = Object.keys(transitionRow).sort();
    const triggerKeys = [...MASCOT_MOTION_TRIGGERS].sort();

    assert.deepEqual(rowKeys, triggerKeys);
    for (const trigger of MASCOT_MOTION_TRIGGERS) {
      const nextState = transitionRow[trigger];
      if (nextState === null) {
        continue;
      }
      assert.ok(MASCOT_MOTION_STATES.includes(nextState));
    }
  }

  const deterministicSample = resolveMotionTransition("relocating", "arrived_at_anchor");
  assert.equal(deterministicSample, "pointing");
});

test("movement contracts: canonical tutorial path transitions are valid", () => {
  const path: MascotMotionState[] = ["idle"];
  let state: MascotMotionState = "idle";

  const steps = [
    "target_acquired",
    "arrived_at_anchor",
    "point_cue_complete",
    "speech_ended",
    "arrived_at_anchor",
  ] as const;

  for (const trigger of steps) {
    const next = resolveMotionTransition(state, trigger);
    assert.ok(next);
    state = next as MascotMotionState;
    path.push(state);
  }

  assert.deepEqual(path, [
    "idle",
    "relocating",
    "pointing",
    "speaking",
    "returning",
    "idle",
  ]);
});

test("movement contracts: allowed transition list is deduplicated and valid", () => {
  for (const state of MASCOT_MOTION_STATES) {
    const allowed = getAllowedMotionTransitions(state);
    const unique = new Set(allowed);

    assert.equal(unique.size, allowed.length);
    for (const nextState of allowed) {
      assert.ok(MASCOT_MOTION_STATES.includes(nextState));
    }
  }
});

test("movement contracts: no ambiguous trigger mapping per state", () => {
  for (const state of MASCOT_MOTION_STATES) {
    const row = MASCOT_MOTION_TRANSITIONS[state];
    for (const trigger of MASCOT_MOTION_TRIGGERS) {
      const direct = row[trigger];
      const resolved = resolveMotionTransition(state as MascotMotionState, trigger);
      assert.equal(resolved, direct);
    }
  }
});

test("movement contracts: desktop and mobile constraints are explicit and sensible", () => {
  const desktop = MASCOT_MOTION_CONSTRAINTS.desktop;
  const mobile = MASCOT_MOTION_CONSTRAINTS.mobile;
  const reduced = MASCOT_MOTION_CONSTRAINTS.reducedMotion;

  assert.ok(desktop.maxDistancePx > mobile.maxDistancePx);
  assert.ok(desktop.maxMovesPerMinute > mobile.maxMovesPerMinute);
  assert.ok(mobile.minDwellMs >= desktop.minDwellMs);
  assert.ok(desktop.snapThresholdPx > 0);
  assert.ok(mobile.snapThresholdPx > 0);
  assert.ok(desktop.maxMovesPerMinute <= 5);
  assert.ok(mobile.maxMovesPerMinute <= 3);
  assert.equal(reduced.maxDistancePx, 0);
  assert.equal(reduced.maxMovesPerMinute, 1);
});

test("movement contracts: desktop/mobile behavior docs are present", () => {
  assert.ok(MASCOT_MOVEMENT_PLATFORM_DOCS.desktop.summary.length > 0);
  assert.ok(MASCOT_MOVEMENT_PLATFORM_DOCS.desktop.behavior.length > 0);
  assert.ok(MASCOT_MOVEMENT_PLATFORM_DOCS.mobile.summary.length > 0);
  assert.ok(MASCOT_MOVEMENT_PLATFORM_DOCS.mobile.behavior.length > 0);
});
