import assert from "node:assert/strict";
import test from "node:test";

import {
  getDomIdForSection,
  getSectionIdFromDomId,
} from "../../lib/twin/guide/contracts";
import {
  evaluateRailFocusGuard,
  evaluateSectionDwell,
  extractProjectSlugFromPath,
  getLensSwitchPayload,
  getRouteChangePayload,
  getTabChangePayload,
  INITIAL_SECTION_DWELL_STATE,
  normalizeProjectOpenPayload,
  selectSectionCandidate,
  slugToReadableTitle,
  type SectionVisibilitySnapshot,
} from "../../lib/twin/guide/trackerLogic";

test("tracker logic: section candidate selection prefers highest visible ratio", () => {
  const snapshots: SectionVisibilitySnapshot[] = [
    { sectionId: "about", isIntersecting: true, intersectionRatio: 0.2 },
    { sectionId: "projects", isIntersecting: true, intersectionRatio: 0.6 },
    { sectionId: "experience", isIntersecting: true, intersectionRatio: 0.8 },
  ];

  const selected = selectSectionCandidate(snapshots, 0.55);
  assert.equal(selected, "experience");

  const noneSelected = selectSectionCandidate(snapshots, 0.9);
  assert.equal(noneSelected, null);
});

test("tracker logic: dwell gate emits only after threshold and section switch", () => {
  let state = INITIAL_SECTION_DWELL_STATE;

  const first = evaluateSectionDwell(state, "experience", 0, 600);
  assert.equal(first.emitSectionId, null);
  state = first.nextState;

  const beforeDwell = evaluateSectionDwell(state, "experience", 500, 600);
  assert.equal(beforeDwell.emitSectionId, null);
  state = beforeDwell.nextState;

  const afterDwell = evaluateSectionDwell(state, "experience", 700, 600);
  assert.equal(afterDwell.emitSectionId, "experience");
  state = afterDwell.nextState;

  const sameSection = evaluateSectionDwell(state, "experience", 900, 600);
  assert.equal(sameSection.emitSectionId, null);
  state = sameSection.nextState;

  const switchCandidate = evaluateSectionDwell(state, "skills", 1_000, 600);
  assert.equal(switchCandidate.emitSectionId, null);
  state = switchCandidate.nextState;

  const switchedAfterDwell = evaluateSectionDwell(state, "skills", 1_700, 600);
  assert.equal(switchedAfterDwell.emitSectionId, "skills");
});

test("tracker logic: route and lens diff payloads are emitted only on changes", () => {
  assert.equal(getRouteChangePayload(null, "/"), null);
  assert.deepEqual(getRouteChangePayload("/", "/projects/ordinay"), {
    fromPath: "/",
    toPath: "/projects/ordinay",
  });
  assert.equal(getRouteChangePayload("/projects/ordinay", "/projects/ordinay"), null);

  assert.equal(getLensSwitchPayload(null, "general"), null);
  assert.deepEqual(getLensSwitchPayload("general", "ai"), {
    fromLens: "general",
    toLens: "ai",
  });
  assert.equal(getLensSwitchPayload("ai", "ai"), null);
});

test("tracker logic: project slug/title extraction supports fallback paths", () => {
  assert.equal(extractProjectSlugFromPath("/projects/law-firm-management-software"), "law-firm-management-software");
  assert.equal(extractProjectSlugFromPath("/"), null);
  assert.equal(extractProjectSlugFromPath("/projects/"), null);

  assert.equal(slugToReadableTitle("law-firm-management-software"), "Law Firm Management Software");

  const fromAttributes = normalizeProjectOpenPayload({
    projectSlugAttr: "promptrend-llm-vulnerability-discovery",
    projectTitleAttr: "PrompTrend — LLM Vulnerability Discovery and Risk Scoring",
  });
  assert.deepEqual(fromAttributes, {
    projectSlug: "promptrend-llm-vulnerability-discovery",
    projectTitle: "PrompTrend — LLM Vulnerability Discovery and Risk Scoring",
  });

  const fromHrefFallback = normalizeProjectOpenPayload({
    href: "/projects/law-firm-management-software?lens=ai",
  });
  assert.deepEqual(fromHrefFallback, {
    projectSlug: "law-firm-management-software",
    projectTitle: "Law Firm Management Software",
  });

  const fromPathAndText = normalizeProjectOpenPayload({
    pathname: "/projects/equation-solver-chatbot",
    textContent: "Equation Solver Chat Bot",
  });
  assert.deepEqual(fromPathAndText, {
    projectSlug: "equation-solver-chatbot",
    projectTitle: "Equation Solver Chat Bot",
  });

  const invalid = normalizeProjectOpenPayload({
    href: "/agent",
  });
  assert.equal(invalid, null);
});

test("tracker logic: section canonicalization maps about to why-me DOM id", () => {
  assert.equal(getDomIdForSection("about"), "why-me");
  assert.equal(getSectionIdFromDomId("why-me"), "about");
  assert.equal(getSectionIdFromDomId("experience"), "experience");
  assert.equal(getSectionIdFromDomId(""), null);
});

test("tracker logic: tab_change payload is only emitted for real transitions on home", () => {
  assert.equal(
    getTabChangePayload({
      pathname: "/projects/ordinay",
      previousTab: "why-me",
      activeTab: "projects",
    }),
    null
  );

  assert.equal(
    getTabChangePayload({
      pathname: "/",
      previousTab: null,
      activeTab: "projects",
    }),
    null
  );

  assert.equal(
    getTabChangePayload({
      pathname: "/",
      previousTab: "projects",
      activeTab: "projects",
    }),
    null
  );

  assert.deepEqual(
    getTabChangePayload({
      pathname: "/",
      previousTab: "why-me",
      activeTab: "projects",
    }),
    { fromTab: "why-me", toTab: "projects" }
  );
});

test("tracker logic: rail focus guard drops unknown ids and duplicates", () => {
  const invalid = evaluateRailFocusGuard({
    detailId: "not-a-focus",
    detailSource: "click",
    nowMs: 1_000,
    lastTabChangeAtMs: 0,
    lastRailFocusId: null,
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(invalid.decision, "drop_invalid_id");

  const duplicate = evaluateRailFocusGuard({
    detailId: "projects",
    detailSource: "scroll",
    nowMs: 5_000,
    lastTabChangeAtMs: 0,
    lastRailFocusId: "projects",
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(duplicate.decision, "drop_duplicate");
});

test("tracker logic: rail focus guard suppresses overview within the tab-change window", () => {
  const suppressed = evaluateRailFocusGuard({
    detailId: "overview",
    detailSource: "scroll",
    nowMs: 500,
    lastTabChangeAtMs: 0,
    lastRailFocusId: null,
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(suppressed.decision, "drop_overview_after_tab_change");
  if (suppressed.decision === "drop_overview_after_tab_change") {
    assert.equal(suppressed.nextLastFocusId, "overview");
  }

  const allowedAfterWindow = evaluateRailFocusGuard({
    detailId: "overview",
    detailSource: "scroll",
    nowMs: 2_000,
    lastTabChangeAtMs: 0,
    lastRailFocusId: null,
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(allowedAfterWindow.decision, "emit");
  if (allowedAfterWindow.decision === "emit") {
    assert.equal(allowedAfterWindow.focusId, "overview");
    assert.equal(allowedAfterWindow.source, "scroll");
    assert.equal(allowedAfterWindow.nextLastFocusId, "overview");
  }

  const nonOverviewIgnoresWindow = evaluateRailFocusGuard({
    detailId: "projects",
    detailSource: "scroll",
    nowMs: 500,
    lastTabChangeAtMs: 0,
    lastRailFocusId: null,
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(nonOverviewIgnoresWindow.decision, "emit");
});

test("tracker logic: rail focus guard normalizes click vs scroll source", () => {
  const click = evaluateRailFocusGuard({
    detailId: "experience",
    detailSource: "click",
    nowMs: 5_000,
    lastTabChangeAtMs: 0,
    lastRailFocusId: "overview",
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(click.decision, "emit");
  if (click.decision === "emit") {
    assert.equal(click.source, "click");
    assert.equal(click.focusId, "experience");
  }

  const unknownSourceFallsBackToScroll = evaluateRailFocusGuard({
    detailId: "skills",
    detailSource: "programmatic",
    nowMs: 5_000,
    lastTabChangeAtMs: 0,
    lastRailFocusId: "overview",
    tabChangeSuppressionMs: 1_500,
  });
  assert.equal(unknownSourceFallsBackToScroll.decision, "emit");
  if (unknownSourceFallsBackToScroll.decision === "emit") {
    assert.equal(unknownSourceFallsBackToScroll.source, "scroll");
  }
});
