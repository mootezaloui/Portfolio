import assert from "node:assert/strict";
import test from "node:test";

import {
  collectRuntimeAnchors,
  indexRuntimeAnchorsById,
  type RectLike,
} from "../../lib/twin/movement/anchors";
import { DEFAULT_ANCHOR_REGISTRY } from "../../lib/twin/movement/contracts";
import { resolvePreferredAnchorId } from "../../lib/twin/movement/engine";

function rect(left: number, top: number, width: number, height: number): RectLike {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

test("movement integration: section changes resolve to section anchors on home route", () => {
  const rectMap = new Map<string, RectLike>([
    ["[data-mascot-anchor='hero_primary']", rect(80, 80, 920, 260)],
    ["#projects", rect(120, 220, 900, 280)],
    ["#experience", rect(120, 540, 900, 260)],
    ["[data-mascot-anchor='rest_corner']", rect(1120, 620, 120, 120)],
  ]);

  const snapshots = collectRuntimeAnchors({
    pathname: "/",
    viewport: { width: 1280, height: 900 },
    registry: DEFAULT_ANCHOR_REGISTRY,
    getRectBySelector: (selector) => rectMap.get(selector) ?? null,
  });
  const byId = indexRuntimeAnchorsById(snapshots);

  const projectsAnchor = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: byId,
    trigger: {
      eventId: "evt-section-projects",
      occurredAtMs: 1,
      sessionId: "session-1",
      pathname: "/",
      roleLens: "general",
      type: "section_enter",
      sectionId: "projects",
    },
  });
  assert.equal(projectsAnchor, "section_projects");

  const experienceAnchor = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: byId,
    trigger: {
      eventId: "evt-section-experience",
      occurredAtMs: 2,
      sessionId: "session-1",
      pathname: "/",
      roleLens: "general",
      type: "section_enter",
      sectionId: "experience",
    },
  });
  assert.equal(experienceAnchor, "section_experience");
});

test("movement integration: route changes resolve project anchor then return to home fallback", () => {
  const homeRectMap = new Map<string, RectLike>([
    ["[data-mascot-anchor='hero_primary']", rect(80, 80, 920, 260)],
    ["#projects", rect(120, 520, 900, 300)],
    ["[data-mascot-anchor='project_primary_case_home']", rect(220, 560, 220, 44)],
    ["[data-mascot-anchor='rest_corner']", rect(1120, 620, 120, 120)],
  ]);

  const homeAnchors = indexRuntimeAnchorsById(
    collectRuntimeAnchors({
      pathname: "/",
      viewport: { width: 1280, height: 900 },
      registry: DEFAULT_ANCHOR_REGISTRY,
      getRectBySelector: (selector) => homeRectMap.get(selector) ?? null,
    })
  );

  const toProjectAnchor = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: homeAnchors,
    trigger: {
      eventId: "evt-route-project",
      occurredAtMs: 10,
      sessionId: "session-2",
      pathname: "/",
      roleLens: "general",
      type: "route_change",
      fromPath: "/",
      toPath: "/projects/law-firm-management-software",
    },
  });
  assert.equal(toProjectAnchor, "project_primary_case_home");

  const projectRectMap = new Map<string, RectLike>([
    ["[data-mascot-anchor='hero_primary']", rect(80, 80, 920, 260)],
    ["[data-mascot-anchor='project_primary_case_page']", rect(220, 260, 220, 44)],
    ["[data-mascot-anchor='rest_corner']", rect(1120, 620, 120, 120)],
  ]);

  const projectRouteAnchors = indexRuntimeAnchorsById(
    collectRuntimeAnchors({
      pathname: "/projects/law-firm-management-software",
      viewport: { width: 1280, height: 900 },
      registry: DEFAULT_ANCHOR_REGISTRY,
      getRectBySelector: (selector) => projectRectMap.get(selector) ?? null,
    })
  );
  assert.ok(projectRouteAnchors.project_primary_case_page);

  const returnHomeAnchor = resolvePreferredAnchorId({
    pathname: "/",
    hasActiveGuidance: true,
    availableAnchors: homeAnchors,
    trigger: {
      eventId: "evt-route-home",
      occurredAtMs: 11,
      sessionId: "session-2",
      pathname: "/projects/law-firm-management-software",
      roleLens: "general",
      type: "route_change",
      fromPath: "/projects/law-firm-management-software",
      toPath: "/",
    },
  });

  // Once returning from project context without an explicit section trigger,
  // home hero is the default fallback anchor.
  assert.equal(returnHomeAnchor, "hero_primary");
});
