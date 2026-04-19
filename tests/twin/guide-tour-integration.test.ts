import assert from "node:assert/strict";
import test from "node:test";

import type { MascotBehaviorEvent } from "../../lib/twin/guide/contracts";
import {
  appendPendingEvent,
  selectHighestPriorityEvent,
} from "../../lib/twin/guide/orchestration";
import {
  completeActiveTourStep,
  createInitialTourProgressState,
  doesEventCompleteTourStep,
  getActiveTourStep,
  resolveMascotOrchestratorMode,
  skipTour,
  startTour,
} from "../../lib/twin/guide/tour";

function sectionEvent(
  sectionId: "about" | "projects" | "experience" | "contact",
  occurredAtMs: number
): MascotBehaviorEvent {
  return {
    eventId: `evt-section-${sectionId}-${occurredAtMs}`,
    occurredAtMs,
    sessionId: "session-tour",
    pathname: "/",
    roleLens: "general",
    type: "section_enter",
    sectionId,
  };
}

test("tour integration: core walkthrough completes in expected order", () => {
  let progress = startTour(createInitialTourProgressState());
  assert.equal(getActiveTourStep(progress), "hero");

  progress = completeActiveTourStep(progress);
  assert.equal(getActiveTourStep(progress), "why_me");

  const whyMeEvent = sectionEvent("about", 1000);
  assert.equal(doesEventCompleteTourStep("why_me", whyMeEvent), true);
  progress = completeActiveTourStep(progress);
  assert.equal(getActiveTourStep(progress), "projects");

  const projectsSectionEvent = sectionEvent("projects", 1900);
  assert.equal(doesEventCompleteTourStep("projects", projectsSectionEvent), true);

  const projectOpenEvent: MascotBehaviorEvent = {
    eventId: "evt-project-open",
    occurredAtMs: 2000,
    sessionId: "session-tour",
    pathname: "/",
    roleLens: "general",
    type: "project_open",
    projectSlug: "law-firm-management-software",
    projectTitle: "Ordinay",
  };
  assert.equal(doesEventCompleteTourStep("projects", projectOpenEvent), true);
  progress = completeActiveTourStep(progress);
  assert.equal(getActiveTourStep(progress), "experience");

  const experienceEvent = sectionEvent("experience", 3000);
  assert.equal(doesEventCompleteTourStep("experience", experienceEvent), true);
  progress = completeActiveTourStep(progress);
  assert.equal(getActiveTourStep(progress), "contact");

  const contactEvent = sectionEvent("contact", 4000);
  assert.equal(doesEventCompleteTourStep("contact", contactEvent), true);
  progress = completeActiveTourStep(progress);
  assert.equal(progress.status, "completed");
});

test("tour integration: reactive queue priority resumes after tour completion", () => {
  const events: MascotBehaviorEvent[] = [
    sectionEvent("experience", 10),
    {
      eventId: "evt-route",
      occurredAtMs: 20,
      sessionId: "session-tour",
      pathname: "/",
      roleLens: "general",
      type: "route_change",
      fromPath: "/",
      toPath: "/projects/law-firm-management-software",
    },
    {
      eventId: "evt-project",
      occurredAtMs: 30,
      sessionId: "session-tour",
      pathname: "/",
      roleLens: "general",
      type: "project_open",
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay",
    },
  ];

  let pending: MascotBehaviorEvent[] = [];
  for (const event of events) {
    pending = appendPendingEvent(pending, event, 30);
  }

  const selected = selectHighestPriorityEvent(pending);
  assert.ok(selected);
  assert.equal(selected?.type, "project_open");
});

test("tour integration: manual start/skip lifecycle returns to stalker mode", () => {
  const initial = createInitialTourProgressState();
  assert.equal(
    resolveMascotOrchestratorMode({
      pausedOnRoute: false,
      tourStatus: initial.status,
    }),
    "stalker"
  );

  const running = startTour(initial);
  assert.equal(
    resolveMascotOrchestratorMode({
      pausedOnRoute: false,
      tourStatus: running.status,
    }),
    "tour"
  );

  const skipped = skipTour(running);
  assert.equal(
    resolveMascotOrchestratorMode({
      pausedOnRoute: false,
      tourStatus: skipped.status,
    }),
    "stalker"
  );
});
