import assert from "node:assert/strict";
import test from "node:test";

import type { RuntimeAnchorSnapshot } from "../../lib/twin/movement/anchors";
import {
  applyMoveRateLimit,
  clampScenePosition,
  limitTargetDistanceFromOrigin,
  resolvePreferredAnchorId,
  resolveSafeScenePosition,
  shouldActivateMotionGuidance,
  shouldStartGuideSpeech,
  shouldTriggerMotionForEvent,
  shouldSwitchAnchorTarget,
  stepInterpolatedMotion,
} from "../../lib/twin/movement/engine";
import type { MascotAnchorId } from "../../lib/twin/movement/contracts";

function createSnapshot(id: MascotAnchorId): RuntimeAnchorSnapshot {
  return {
    id,
    selector: `#${id}`,
    routePattern: "*",
    viewport: "desktop",
    priority: 50,
    requiredVisibleRatio: 0.3,
    safeInsetPx: 12,
    bounds: {
      left: 100,
      top: 100,
      right: 300,
      bottom: 240,
      width: 200,
      height: 140,
    },
    centerX: 200,
    centerY: 170,
    visibleRatio: 1,
  };
}

test("movement engine: interpolation steps toward target and snaps near threshold", () => {
  const first = stepInterpolatedMotion({
    position: { x: 0, y: 0 },
    target: { x: 100, y: 0 },
    deltaMs: 16,
    snapThresholdPx: 2,
    maxSpeedPxPerSec: 600,
    easingPreset: "calm",
  });

  assert.ok(first.nextPosition.x > 0);
  assert.ok(first.nextPosition.x < 100);
  assert.equal(first.arrived, false);

  const near = stepInterpolatedMotion({
    position: { x: 99, y: 0 },
    target: { x: 100, y: 0 },
    deltaMs: 16,
    snapThresholdPx: 2,
    maxSpeedPxPerSec: 600,
    easingPreset: "settle",
  });

  assert.equal(near.arrived, true);
  assert.deepEqual(near.nextPosition, { x: 100, y: 0 });
});

test("movement engine: anchor switch respects dwell but always allows return to rest", () => {
  assert.equal(
    shouldSwitchAnchorTarget({
      currentAnchorId: "section_projects",
      nextAnchorId: "section_experience",
      nowMs: 2_000,
      lastSwitchAtMs: 1_000,
      minDwellMs: 1_500,
    }),
    false
  );

  assert.equal(
    shouldSwitchAnchorTarget({
      currentAnchorId: "section_projects",
      nextAnchorId: "section_experience",
      nowMs: 3_000,
      lastSwitchAtMs: 1_000,
      minDwellMs: 1_500,
    }),
    true
  );

  assert.equal(
    shouldSwitchAnchorTarget({
      currentAnchorId: "section_projects",
      nextAnchorId: "rest_corner",
      nowMs: 1_200,
      lastSwitchAtMs: 1_000,
      minDwellMs: 5_000,
    }),
    true
  );
});

test("movement engine: rate limit blocks excess moves and resets after one minute", () => {
  const nowMs = 100_000;
  const first = applyMoveRateLimit({
    nowMs,
    maxMovesPerMinute: 3,
    recentSwitchesMs: [],
  });
  assert.equal(first.allowed, true);
  assert.equal(first.nextRecentSwitchesMs.length, 1);

  const second = applyMoveRateLimit({
    nowMs: nowMs + 1000,
    maxMovesPerMinute: 3,
    recentSwitchesMs: first.nextRecentSwitchesMs,
  });
  const third = applyMoveRateLimit({
    nowMs: nowMs + 2000,
    maxMovesPerMinute: 3,
    recentSwitchesMs: second.nextRecentSwitchesMs,
  });
  assert.equal(third.allowed, true);

  const blocked = applyMoveRateLimit({
    nowMs: nowMs + 3000,
    maxMovesPerMinute: 3,
    recentSwitchesMs: third.nextRecentSwitchesMs,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.nextRecentSwitchesMs.length, 3);

  const recovered = applyMoveRateLimit({
    nowMs: nowMs + 61_500,
    maxMovesPerMinute: 3,
    recentSwitchesMs: blocked.nextRecentSwitchesMs,
  });
  assert.equal(recovered.allowed, true);
  assert.equal(recovered.nextRecentSwitchesMs.length, 2);
});

test("movement engine: preferred anchor resolution follows route and section context", () => {
  const anchors = {
    rest_corner: createSnapshot("rest_corner"),
    hero_primary: createSnapshot("hero_primary"),
    section_projects: createSnapshot("section_projects"),
    project_primary_case_home: createSnapshot("project_primary_case_home"),
    project_primary_case_page: createSnapshot("project_primary_case_page"),
  };

  const projectPreferred = resolvePreferredAnchorId({
    pathname: "/projects/law-firm-management-software",
    hasActiveGuidance: true,
    availableAnchors: anchors,
  });
  assert.equal(projectPreferred, "project_primary_case_page");

  const sectionPreferred = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: anchors,
    lastSectionId: "projects",
  });
  assert.equal(sectionPreferred, "section_projects");

  const idlePreferred = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: false,
    availableAnchors: anchors,
    lastSectionId: "projects",
  });
  assert.equal(idlePreferred, "rest_corner");
});

test("movement engine: behavior trigger drives anchor preference for project and section events", () => {
  const anchors = {
    rest_corner: createSnapshot("rest_corner"),
    hero_primary: createSnapshot("hero_primary"),
    section_projects: createSnapshot("section_projects"),
    section_experience: createSnapshot("section_experience"),
    project_primary_case_home: createSnapshot("project_primary_case_home"),
  };

  const projectOpenPreferred = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: anchors,
    trigger: {
      eventId: "evt-project",
      occurredAtMs: 10,
      sessionId: "session-1",
      pathname: "/",
      roleLens: "general",
      type: "project_open",
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay",
    },
  });
  assert.equal(projectOpenPreferred, "project_primary_case_home");

  const sectionPreferred = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: anchors,
    trigger: {
      eventId: "evt-section",
      occurredAtMs: 11,
      sessionId: "session-1",
      pathname: "/",
      roleLens: "general",
      type: "section_enter",
      sectionId: "experience",
    },
  });
  assert.equal(sectionPreferred, "section_experience");
});

test("movement engine: route/context disambiguates project and twin entry anchors", () => {
  const anchors = {
    rest_corner: createSnapshot("rest_corner"),
    hero_primary: createSnapshot("hero_primary"),
    project_primary_case_home: createSnapshot("project_primary_case_home"),
    project_primary_case_page: createSnapshot("project_primary_case_page"),
    twin_entry_button_hero: createSnapshot("twin_entry_button_hero"),
    twin_entry_button_mascot: createSnapshot("twin_entry_button_mascot"),
  };

  const projectRoutePreferred = resolvePreferredAnchorId({
    pathname: "/projects/law-firm-management-software",
    hasActiveGuidance: true,
    availableAnchors: anchors,
  });
  assert.equal(projectRoutePreferred, "project_primary_case_page");

  const idleNudgePreferred = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: anchors,
    trigger: {
      eventId: "evt-idle",
      occurredAtMs: 12,
      sessionId: "session-1",
      pathname: "/",
      roleLens: "general",
      type: "idle_nudge",
      idleMs: 30_000,
      lastSectionId: "projects",
    },
  });
  assert.equal(idleNudgePreferred, "twin_entry_button_hero");
});

test("movement engine: speech starts only when speaking state is reached", () => {
  const activeGuidance = shouldActivateMotionGuidance({
    hasGuideEvent: true,
    isProcessingGuide: false,
    isRoutePaused: false,
    isCollapsed: false,
    isTypingSuppressed: false,
  });
  assert.equal(activeGuidance, true);

  const blockedInTransit = shouldStartGuideSpeech({
    movementState: "relocating",
    hasGuideEvent: true,
    isProcessingGuide: false,
    isRoutePaused: false,
    isCollapsed: false,
    isTypingSuppressed: false,
  });
  assert.equal(blockedInTransit, false);

  const allowedAtSpeaking = shouldStartGuideSpeech({
    movementState: "speaking",
    hasGuideEvent: true,
    isProcessingGuide: false,
    isRoutePaused: false,
    isCollapsed: false,
    isTypingSuppressed: false,
  });
  assert.equal(allowedAtSpeaking, true);

  const blockedByTyping = shouldStartGuideSpeech({
    movementState: "speaking",
    hasGuideEvent: true,
    isProcessingGuide: false,
    isRoutePaused: false,
    isCollapsed: false,
    isTypingSuppressed: true,
  });
  assert.equal(blockedByTyping, false);

  const staticStartAllowed = shouldStartGuideSpeech({
    movementState: "idle",
    hasGuideEvent: true,
    isProcessingGuide: false,
    isRoutePaused: false,
    isCollapsed: false,
    isTypingSuppressed: false,
    allowStaticStart: true,
  });
  assert.equal(staticStartAllowed, true);
});

test("movement engine: mobile/quiet/reduced trigger policy suppresses relocation noise", () => {
  const desktopRouteChange = shouldTriggerMotionForEvent({
    triggerType: "route_change",
    viewportMode: "desktop",
    quietMode: false,
    prefersReducedMotion: false,
  });
  assert.equal(desktopRouteChange, true);

  const mobileRouteChange = shouldTriggerMotionForEvent({
    triggerType: "route_change",
    viewportMode: "mobile",
    quietMode: false,
    prefersReducedMotion: false,
  });
  assert.equal(mobileRouteChange, false);

  const mobileProjectOpen = shouldTriggerMotionForEvent({
    triggerType: "project_open",
    viewportMode: "mobile",
    quietMode: false,
    prefersReducedMotion: false,
  });
  assert.equal(mobileProjectOpen, true);

  const quietModeSuppressed = shouldTriggerMotionForEvent({
    triggerType: "project_open",
    viewportMode: "desktop",
    quietMode: true,
    prefersReducedMotion: false,
  });
  assert.equal(quietModeSuppressed, false);

  const reducedMotionSuppressed = shouldTriggerMotionForEvent({
    triggerType: "project_open",
    viewportMode: "desktop",
    quietMode: false,
    prefersReducedMotion: true,
  });
  assert.equal(reducedMotionSuppressed, false);
});

test("movement engine: mobile travel radius clamps far anchor targets", () => {
  const clamped = limitTargetDistanceFromOrigin({
    origin: { x: 100, y: 100 },
    target: { x: 460, y: 100 },
    maxDistancePx: 180,
  });

  assert.equal(clamped.y, 100);
  assert.equal(clamped.x, 280);
});

test("movement engine: safe placement avoids protected CTA overlap when possible", () => {
  const position = resolveSafeScenePosition({
    desiredPosition: { x: 320, y: 220 },
    sceneSize: { width: 140, height: 140 },
    viewport: { width: 900, height: 620 },
    protectedRects: [
      {
        left: 340,
        top: 240,
        right: 450,
        bottom: 290,
        width: 110,
        height: 50,
      },
    ],
    clearancePx: 10,
    insetPx: 12,
  });

  const sceneRect = {
    left: position.x,
    top: position.y,
    right: position.x + 140,
    bottom: position.y + 140,
  };
  const protectedRect = {
    left: 340 - 10,
    top: 240 - 10,
    right: 450 + 10,
    bottom: 290 + 10,
  };

  const intersects =
    sceneRect.left < protectedRect.right &&
    sceneRect.right > protectedRect.left &&
    sceneRect.top < protectedRect.bottom &&
    sceneRect.bottom > protectedRect.top;

  assert.equal(intersects, false);
});

test("movement engine: scene clamp prevents viewport overflow", () => {
  const clamped = clampScenePosition(
    { x: 1000, y: 800 },
    { width: 1280, height: 720 },
    { width: 240, height: 220 },
    12
  );

  assert.equal(clamped.x, 1000);
  assert.equal(clamped.y, 488);
});
