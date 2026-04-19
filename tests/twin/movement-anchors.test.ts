import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_ANCHOR_REGISTRY } from "../../lib/twin/movement/contracts";
import {
  collectRuntimeAnchors,
  computeVisibleRatio,
  detectViewport,
  indexRuntimeAnchorsById,
  isAnchorOnScreen,
  matchesRoutePattern,
  type RectLike,
} from "../../lib/twin/movement/anchors";

function createRect(
  left: number,
  top: number,
  width: number,
  height: number
): RectLike {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

test("movement anchors: route pattern matching covers wildcard and prefix routes", () => {
  assert.equal(matchesRoutePattern("*", "/"), true);
  assert.equal(matchesRoutePattern("/projects/*", "/projects/ordinay"), true);
  assert.equal(matchesRoutePattern("/projects/*", "/projects"), false);
  assert.equal(matchesRoutePattern("/projects/*", "/case-study"), false);
  assert.equal(matchesRoutePattern("/", "/"), true);
  assert.equal(matchesRoutePattern("/", "/projects/ordinay"), false);
});

test("movement anchors: visibility ratio and safe-screen checks work for off-screen suppression", () => {
  const viewport = { width: 1280, height: 720 };

  const fullyVisible = createRect(100, 100, 200, 120);
  const clipped = createRect(1200, 100, 200, 120);
  const offScreen = createRect(1320, 120, 200, 120);

  assert.equal(computeVisibleRatio(fullyVisible, viewport), 1);
  assert.ok(computeVisibleRatio(clipped, viewport) > 0);
  assert.equal(computeVisibleRatio(offScreen, viewport), 0);

  assert.equal(isAnchorOnScreen(fullyVisible, viewport, 20), true);
  assert.equal(isAnchorOnScreen(offScreen, viewport, 20), false);
});

test("movement anchors: runtime collection resolves on-screen anchors for home sections", () => {
  const rectBySelector = new Map<string, RectLike>([
    ["[data-mascot-anchor='hero_primary']", createRect(80, 80, 900, 280)],
    ["#why-me", createRect(120, 420, 900, 220)],
    ["#projects", createRect(120, 680, 900, 320)],
    ["#experience", createRect(120, 1040, 900, 320)],
    ["#skills", createRect(120, 1400, 900, 260)],
    ["#certifications", createRect(120, 1700, 900, 260)],
    ["#contact", createRect(120, 2000, 900, 220)],
    ["[data-mascot-anchor='project_primary_case_home']", createRect(180, 760, 180, 36)],
    ["[data-mascot-anchor='twin_entry_button_hero']", createRect(380, 270, 190, 40)],
    ["[data-mascot-anchor='rest_corner']", createRect(1100, 560, 140, 140)],
  ]);

  const snapshots = collectRuntimeAnchors({
    pathname: "/",
    viewport: { width: 1280, height: 900 },
    registry: DEFAULT_ANCHOR_REGISTRY,
    getRectBySelector: (selector) => rectBySelector.get(selector) ?? null,
  });

  const byId = indexRuntimeAnchorsById(snapshots);
  assert.ok(byId.section_projects);
  assert.ok(byId.hero_primary);
  assert.ok(byId.twin_entry_button_hero);
  assert.ok(byId.rest_corner);
  assert.ok(byId.project_primary_case_home);
});

test("movement anchors: collection ignores anchors that are off-screen", () => {
  const rectBySelector = new Map<string, RectLike>([
    ["#projects", createRect(1800, 300, 420, 280)],
  ]);

  const snapshots = collectRuntimeAnchors({
    pathname: "/",
    viewport: { width: 1280, height: 900 },
    registry: DEFAULT_ANCHOR_REGISTRY,
    getRectBySelector: (selector) => rectBySelector.get(selector) ?? null,
  });

  const byId = indexRuntimeAnchorsById(snapshots);
  assert.equal(byId.section_projects, undefined);
});

test("movement anchors: lookup remains stable across desktop and mobile viewport sizes", () => {
  const sharedRectMap = new Map<string, RectLike>([
    ["#projects", createRect(16, 420, 358, 280)],
    ["[data-mascot-anchor='twin_entry_button_hero']", createRect(16, 120, 180, 36)],
    ["[data-mascot-anchor='rest_corner']", createRect(300, 640, 68, 96)],
  ]);

  const desktop = collectRuntimeAnchors({
    pathname: "/",
    viewport: { width: 1280, height: 900 },
    registry: DEFAULT_ANCHOR_REGISTRY,
    getRectBySelector: (selector) => sharedRectMap.get(selector) ?? null,
  });
  const mobile = collectRuntimeAnchors({
    pathname: "/",
    viewport: { width: 390, height: 844 },
    registry: DEFAULT_ANCHOR_REGISTRY,
    getRectBySelector: (selector) => sharedRectMap.get(selector) ?? null,
  });

  const desktopIndex = indexRuntimeAnchorsById(desktop);
  const mobileIndex = indexRuntimeAnchorsById(mobile);

  assert.equal(detectViewport(1280), "desktop");
  assert.equal(detectViewport(390), "mobile");
  assert.ok(desktopIndex.section_projects);
  assert.ok(mobileIndex.section_projects);
  assert.ok(mobileIndex.twin_entry_button_hero);
});
