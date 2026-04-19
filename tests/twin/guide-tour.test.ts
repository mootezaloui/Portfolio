import assert from "node:assert/strict";
import test from "node:test";

import type { MascotBehaviorEvent } from "../../lib/twin/guide/contracts";
import {
  advanceTourStep,
  buildGuideTemplate,
  completeActiveTourStep,
  createInitialTourProgressState,
  doesEventCompleteTourStep,
  getActiveTourStep,
  getNextTourStep,
  getTourTabForStep,
  getTourStepCompletionSection,
  hasSeenSessionMascotIntro,
  isStalkerEventAllowed,
  isStalkerTriggerTypeAllowed,
  isTourFinished,
  loadTourProgressState,
  markSessionMascotIntroSeen,
  MASCOT_TOUR_SEQUENCE,
  resolveGuideModeForOrchestrator,
  resolveMascotOrchestratorMode,
  resolveTourStepFromTab,
  saveTourProgressState,
  shouldProcessStalkerSpeech,
  skipTour,
  startTour,
  syncTourProgressToStep,
} from "../../lib/twin/guide/tour";

function createEvent(overrides: Partial<MascotBehaviorEvent>): MascotBehaviorEvent {
  const base: MascotBehaviorEvent = {
    eventId: "evt-1",
    occurredAtMs: 100,
    sessionId: "session-1",
    pathname: "/",
    roleLens: "general",
    type: "section_enter",
    sectionId: "about",
  };

  return {
    ...base,
    ...overrides,
  } as MascotBehaviorEvent;
}

function createStorageMock(initial: Record<string, string> = {}) {
  const record = { ...initial };
  return {
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(record, key)
        ? record[key]
        : null;
    },
    setItem(key: string, value: string) {
      record[key] = value;
    },
    removeItem(key: string) {
      delete record[key];
    },
    dump() {
      return { ...record };
    },
  };
}

test("tour state: startup stays in stalker until user starts tour", () => {
  const initial = createInitialTourProgressState();
  assert.equal(initial.status, "not_started");
  assert.equal(
    resolveMascotOrchestratorMode({
      pausedOnRoute: false,
      tourStatus: initial.status,
    }),
    "stalker"
  );
  assert.equal(resolveGuideModeForOrchestrator("stalker"), "reactive");
  assert.equal(resolveGuideModeForOrchestrator("paused"), "reactive");

  const running = startTour(initial);
  assert.equal(running.status, "running");
  assert.equal(getActiveTourStep(running), "hero");
  assert.equal(
    resolveMascotOrchestratorMode({
      pausedOnRoute: false,
      tourStatus: running.status,
    }),
    "tour"
  );

  const skipped = skipTour(running);
  assert.equal(skipped.status, "skipped");
  assert.equal(isTourFinished(skipped.status), true);

  const replayed = startTour(skipped);
  assert.equal(replayed.status, "running");
  assert.equal(replayed.currentStepIndex, 0);
});

test("tour state: intro is shown once per browser session", () => {
  const storage = createStorageMock();
  assert.equal(hasSeenSessionMascotIntro(storage as unknown as Storage), false);
  markSessionMascotIntroSeen(storage as unknown as Storage);
  assert.equal(hasSeenSessionMascotIntro(storage as unknown as Storage), true);
});

test("tour state: stalker trigger whitelist allows only section/project commentary", () => {
  assert.equal(isStalkerTriggerTypeAllowed("section_enter"), true);
  assert.equal(isStalkerTriggerTypeAllowed("project_open"), true);
  assert.equal(isStalkerTriggerTypeAllowed("tab_change"), true);
  assert.equal(isStalkerTriggerTypeAllowed("rail_focus"), true);
  assert.equal(isStalkerTriggerTypeAllowed("route_change"), false);
  assert.equal(isStalkerTriggerTypeAllowed("lens_switch"), false);
  assert.equal(isStalkerTriggerTypeAllowed("idle_nudge"), false);

  assert.equal(
    isStalkerEventAllowed(createEvent({ type: "section_enter", sectionId: "contact" })),
    true
  );
  assert.equal(
    isStalkerEventAllowed(
      createEvent({
        type: "project_open",
        projectSlug: "ordinay",
        projectTitle: "Ordinay",
      })
    ),
    true
  );
  assert.equal(
    isStalkerEventAllowed(
      createEvent({
        type: "route_change",
        fromPath: "/",
        toPath: "/projects/ordinay",
      })
    ),
    false
  );
});

test("tour state: mode exclusivity blocks stalker speech while tour is active", () => {
  assert.equal(shouldProcessStalkerSpeech("stalker"), true);
  assert.equal(shouldProcessStalkerSpeech("tour"), false);
  assert.equal(shouldProcessStalkerSpeech("paused"), false);
});

test("tour state: next-step and completion-section helpers are deterministic", () => {
  assert.equal(getNextTourStep("hero"), "why_me");
  assert.equal(getNextTourStep("why_me"), "projects");
  assert.equal(getNextTourStep("projects"), "experience");
  assert.equal(getNextTourStep("experience"), "contact");
  assert.equal(getNextTourStep("contact"), null);

  assert.equal(getTourStepCompletionSection("hero"), null);
  assert.equal(getTourStepCompletionSection("why_me"), "about");
  assert.equal(getTourStepCompletionSection("projects"), "projects");
  assert.equal(getTourStepCompletionSection("experience"), "experience");
  assert.equal(getTourStepCompletionSection("contact"), "contact");

  assert.equal(getTourTabForStep("hero"), "why-me");
  assert.equal(getTourTabForStep("why_me"), "why-me");
  assert.equal(getTourTabForStep("projects"), "projects");
  assert.equal(resolveTourStepFromTab("why-me"), "why_me");
  assert.equal(resolveTourStepFromTab("contact"), "contact");
  assert.equal(resolveTourStepFromTab("skills"), null);
});

test("tour state: core step sequence advances to completed", () => {
  let state = startTour(createInitialTourProgressState());

  for (let index = 0; index < MASCOT_TOUR_SEQUENCE.length; index += 1) {
    const activeStep = getActiveTourStep(state);
    assert.equal(activeStep, MASCOT_TOUR_SEQUENCE[index]);
    state = advanceTourStep(state);
  }

  assert.equal(state.status, "completed");
  assert.equal(state.lastCompletedStep, "contact");
  assert.equal(isTourFinished(state.status), true);
});

test("tour state: step completion rules map to expected behavior events", () => {
  assert.equal(
    doesEventCompleteTourStep(
      "why_me",
      createEvent({ type: "section_enter", sectionId: "about" })
    ),
    true
  );
  assert.equal(
    doesEventCompleteTourStep(
      "projects",
      createEvent({
        type: "project_open",
        projectSlug: "law-firm-management-software",
        projectTitle: "Ordinay",
      })
    ),
    true
  );
  assert.equal(
    doesEventCompleteTourStep(
      "projects",
      createEvent({ type: "section_enter", sectionId: "projects" })
    ),
    true
  );
  assert.equal(
    doesEventCompleteTourStep(
      "contact",
      createEvent({ type: "section_enter", sectionId: "contact" })
    ),
    true
  );
});

test("tour state: completeActiveTourStep transitions exactly like advance", () => {
  const running = startTour(createInitialTourProgressState());
  const advanced = advanceTourStep(running);
  const completed = completeActiveTourStep(running);
  assert.deepEqual(completed, advanced);
});

test("tour state: syncTourProgressToStep advances to manually selected tab step", () => {
  const running = startTour(createInitialTourProgressState());
  const synced = syncTourProgressToStep(running, "projects");
  assert.equal(synced.currentStepIndex, 2);
  assert.equal(synced.lastCompletedStep, "why_me");

  const rewinded = syncTourProgressToStep(synced, "why_me");
  assert.equal(rewinded.currentStepIndex, 1);
  assert.equal(rewinded.lastCompletedStep, "hero");
});

test("tour persistence: save/load roundtrip keeps status and index", () => {
  const storage = createStorageMock();
  const state = {
    status: "running" as const,
    currentStepIndex: 2,
    lastCompletedStep: "why_me" as const,
  };

  saveTourProgressState(state, storage as unknown as Storage);
  const loaded = loadTourProgressState(storage as unknown as Storage);

  assert.equal(loaded.status, "running");
  assert.equal(loaded.currentStepIndex, 2);
  assert.equal(loaded.lastCompletedStep, "why_me");
});

test("tour templates: tab_change produces a branch per home tab", () => {
  const tabs = ["why-me", "projects", "experience", "skills", "contact"] as const;

  for (const toTab of tabs) {
    const template = buildGuideTemplate({
      mode: "reactive",
      roleLens: "ai",
      trigger: createEvent({
        type: "tab_change",
        fromTab: "why-me",
        toTab,
      }),
    });

    assert.ok(template.length > 0);
    assert.ok(template.length <= 220);
    if (toTab === "why-me") {
      assert.ok(template.includes("Why Me"));
    } else if (toTab === "projects") {
      assert.ok(template.includes("Projects"));
    } else if (toTab === "experience") {
      assert.ok(template.includes("Experience"));
    } else if (toTab === "skills") {
      assert.ok(template.includes("Skills"));
    } else if (toTab === "contact") {
      assert.ok(template.includes("Contact"));
    }
  }
});

test("tour templates: rail_focus covers every rail id and differentiates click vs scroll verbs", () => {
  const railFocusIds = [
    "overview",
    "why-me",
    "explore",
    "projects",
    "research",
    "experience",
    "education",
    "leadership",
    "beta-programs",
    "skills",
    "certifications",
    "contact",
  ] as const;

  for (const focusId of railFocusIds) {
    const scrollTemplate = buildGuideTemplate({
      mode: "reactive",
      roleLens: "ai",
      trigger: createEvent({
        type: "rail_focus",
        tab: "why-me",
        focusId,
        source: "scroll",
      }),
    });

    assert.ok(scrollTemplate.length > 0);
    assert.ok(scrollTemplate.length <= 220);

    if (focusId === "overview") {
      assert.ok(scrollTemplate.toLowerCase().includes("top"));
      continue;
    }

    const clickTemplate = buildGuideTemplate({
      mode: "reactive",
      roleLens: "ai",
      trigger: createEvent({
        type: "rail_focus",
        tab: "why-me",
        focusId,
        source: "click",
      }),
    });

    assert.ok(clickTemplate.includes("jumped to"));
    assert.ok(scrollTemplate.includes("reached"));
    assert.notEqual(clickTemplate, scrollTemplate);
  }
});

test("tour templates: deterministic output for same input", () => {
  const first = buildGuideTemplate({
    mode: "tour",
    roleLens: "ai",
    activeTourStepId: "projects",
  });
  const second = buildGuideTemplate({
    mode: "tour",
    roleLens: "ai",
    activeTourStepId: "projects",
  });
  const reactive = buildGuideTemplate({
    mode: "reactive",
    roleLens: "general",
    trigger: createEvent({ type: "section_enter", sectionId: "experience" }),
  });

  assert.equal(first, second);
  assert.ok(first.length > 0);
  assert.ok(reactive.length > 0);
});
