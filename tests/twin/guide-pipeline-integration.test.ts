import assert from "node:assert/strict";
import test from "node:test";

import {
  clearBehaviorQueue,
  enqueueBehaviorEvent,
  getQueuedBehaviorEvents,
} from "../../lib/twin/guide/clientStore";
import {
  sectionDwellMs,
  sectionObserverThreshold,
  type MascotBehaviorEvent,
  type MascotBehaviorEventType,
  type MascotGuideRequest,
  type SectionId,
} from "../../lib/twin/guide/contracts";
import {
  appendPendingEvent,
  createGuideCooldownSnapshot,
  processGuideEventTurn,
  removePendingEventById,
  selectHighestPriorityEvent,
} from "../../lib/twin/guide/orchestration";
import {
  evaluateSectionDwell,
  INITIAL_SECTION_DWELL_STATE,
  normalizeProjectOpenPayload,
  selectSectionCandidate,
  type SectionVisibilitySnapshot,
} from "../../lib/twin/guide/trackerLogic";
import { isStalkerEventAllowed } from "../../lib/twin/guide/tour";

function makeSectionEnterEvent(
  sectionId: SectionId,
  occurredAtMs: number
): MascotBehaviorEvent {
  return {
    eventId: `evt-section-${occurredAtMs}`,
    occurredAtMs,
    sessionId: "session-integration",
    pathname: "/",
    roleLens: "general",
    type: "section_enter",
    sectionId,
  };
}

function makeProjectOpenEvent(
  occurredAtMs: number,
  payload: { projectSlug: string; projectTitle: string }
): MascotBehaviorEvent {
  return {
    eventId: `evt-project-${occurredAtMs}`,
    occurredAtMs,
    sessionId: "session-integration",
    pathname: "/projects/law-firm-management-software",
    roleLens: "general",
    type: "project_open",
    projectSlug: payload.projectSlug,
    projectTitle: payload.projectTitle,
  };
}

test("guide integration flow: scroll-to-section then project-open uses priority order and section context", async () => {
  clearBehaviorQueue();

  const snapshots: SectionVisibilitySnapshot[] = [
    { sectionId: "about", intersectionRatio: 0.15, isIntersecting: true },
    { sectionId: "projects", intersectionRatio: 0.34, isIntersecting: true },
    { sectionId: "experience", intersectionRatio: 0.7, isIntersecting: true },
    { sectionId: "skills", intersectionRatio: 0.2, isIntersecting: true },
    { sectionId: "certifications", intersectionRatio: 0, isIntersecting: false },
    { sectionId: "contact", intersectionRatio: 0, isIntersecting: false },
  ];

  const candidateSectionId = selectSectionCandidate(
    snapshots,
    sectionObserverThreshold
  );
  assert.equal(candidateSectionId, "experience");

  const firstDwell = evaluateSectionDwell(
    INITIAL_SECTION_DWELL_STATE,
    candidateSectionId,
    0,
    sectionDwellMs
  );
  assert.equal(firstDwell.emitSectionId, null);

  const secondDwell = evaluateSectionDwell(
    firstDwell.nextState,
    candidateSectionId,
    sectionDwellMs + 10,
    sectionDwellMs
  );
  assert.equal(secondDwell.emitSectionId, "experience");

  const sectionEvent = makeSectionEnterEvent(
    secondDwell.emitSectionId ?? "experience",
    10_000
  );
  assert.equal(enqueueBehaviorEvent(sectionEvent), true);

  const projectPayload = normalizeProjectOpenPayload({
    projectSlugAttr: "law-firm-management-software",
    projectTitleAttr: "Ordinay - Desktop Legal Operations Platform",
    href: "/projects/law-firm-management-software?lens=general",
  });
  assert.ok(projectPayload);

  const projectEvent = makeProjectOpenEvent(
    11_000,
    projectPayload ?? {
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay - Desktop Legal Operations Platform",
    }
  );
  assert.equal(enqueueBehaviorEvent(projectEvent), true);

  const queuedEvents = getQueuedBehaviorEvents();
  assert.equal(queuedEvents.length, 2);

  let pendingEvents: MascotBehaviorEvent[] = [];
  let lastSectionId: SectionId | undefined;
  for (const event of queuedEvents) {
    pendingEvents = appendPendingEvent(pendingEvents, event);
    if (event.type === "section_enter") {
      lastSectionId = event.sectionId;
    }
  }

  const handledTypes: MascotBehaviorEventType[] = [];
  const capturedRequests: MascotGuideRequest[] = [];
  let nowMs = 200_000;
  let cooldownSnapshot = createGuideCooldownSnapshot();
  let recentGuideMessages: string[] = [];
  let recentTriggerTypes: MascotBehaviorEventType[] = [];

  while (pendingEvents.length > 0) {
    const selected = selectHighestPriorityEvent(pendingEvents);
    assert.ok(selected);
    if (!selected) {
      break;
    }

    pendingEvents = removePendingEventById(pendingEvents, selected.eventId);

    const turnInput: Parameters<typeof processGuideEventTurn>[0] = {
      trigger: selected,
      roleLens: "general",
      recentGuideMessages,
      recentTriggerTypes,
      cooldownSnapshot,
      nowMs,
      fetchGuide: async (request) => {
        capturedRequests.push(request);
        return {
          status: "ok",
          guide: {
            id: `guide-${request.trigger.type}`,
            text:
              request.trigger.type === "project_open"
                ? "I highlight the project case first because it carries the strongest immediate decision signal."
                : "I then anchor your reading with section context so the flow stays understandable.",
            tone: "guide",
            triggerType: request.trigger.type,
            roleLens: request.context.roleLens,
            charCount: 120,
            generatedAt: nowMs,
          },
          meta: {
            providerId: "mock",
            providerModel: "mock-v1",
            latencyMs: 2,
            cached: false,
            classificationDecision: "in_scope",
          },
        };
      },
    };
    if (lastSectionId) {
      turnInput.currentSectionId = lastSectionId;
    }

    const result = await processGuideEventTurn(turnInput);
    assert.equal(result.outcome, "shown");

    handledTypes.push(selected.type);
    cooldownSnapshot = result.cooldownSnapshot;
    recentGuideMessages = result.recentGuideMessages;
    recentTriggerTypes = result.recentTriggerTypes;
    nowMs += 12_000;
  }

  assert.deepEqual(handledTypes, ["project_open", "section_enter"]);
  assert.equal(capturedRequests.length, 2);
  assert.equal(capturedRequests[0]?.trigger.type, "project_open");
  assert.equal(capturedRequests[0]?.context.currentSectionId, "experience");
  assert.equal(capturedRequests[1]?.trigger.type, "section_enter");
});

test("guide integration flow: stalker whitelist excludes route/lens/idle chatter", () => {
  const events: MascotBehaviorEvent[] = [
    makeSectionEnterEvent("contact", 100),
    makeProjectOpenEvent(200, {
      projectSlug: "law-firm-management-software",
      projectTitle: "Ordinay",
    }),
    {
      eventId: "evt-route-100",
      occurredAtMs: 300,
      sessionId: "session-integration",
      pathname: "/",
      roleLens: "general",
      type: "route_change",
      fromPath: "/",
      toPath: "/projects/law-firm-management-software",
    },
    {
      eventId: "evt-lens-100",
      occurredAtMs: 400,
      sessionId: "session-integration",
      pathname: "/",
      roleLens: "general",
      type: "lens_switch",
      fromLens: "general",
      toLens: "ai",
    },
    {
      eventId: "evt-idle-100",
      occurredAtMs: 500,
      sessionId: "session-integration",
      pathname: "/",
      roleLens: "general",
      type: "idle_nudge",
      idleMs: 30_000,
      lastSectionId: "about",
    },
  ];

  const allowed = events.filter((event) => isStalkerEventAllowed(event));
  assert.deepEqual(
    allowed.map((event) => event.type),
    ["section_enter", "project_open"]
  );
});
