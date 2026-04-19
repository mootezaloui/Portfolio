"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { buildLensHref, parseRoleLens, type RoleLens } from "@/lib/lens/roleLens";
import { buildHomeTabHref, parseHomeTab, type HomeTab } from "@/lib/navigation/homeTabs";
import {
  getBehaviorSessionId,
  subscribeToBehaviorQueue,
} from "@/lib/twin/guide/clientStore";
import {
  type MascotBehaviorEvent,
  type MascotBehaviorEventType,
  type MascotGuideMode,
  type MascotGuideRequest,
  type MascotGuideResponse,
  type SectionId,
  type TourStepId,
} from "@/lib/twin/guide/contracts";
import {
  loadMascotGuideSessionState,
  saveMascotGuideSessionState,
} from "@/lib/twin/guide/sessionState";
import {
  appendRecentGuideMessage,
  appendRecentTriggerType,
  appendPendingEvent,
  buildGuideTelemetryPayload,
  createGuideCooldownSnapshot,
  GUIDE_FETCH_TIMEOUT_MS,
  isGuideRoutePaused,
  MASCOT_PENDING_EVENT_LIMIT,
  processGuideEventTurn,
  removePendingEventById,
  selectHighestPriorityEvent,
} from "@/lib/twin/guide/orchestration";
import {
  advanceTourStep,
  buildGuideTemplate,
  completeActiveTourStep,
  createInitialTourProgressState,
  getActiveTourStep,
  getNextTourStep,
  getTourTabForStep,
  hasSeenSessionMascotIntro,
  isStalkerEventAllowed,
  markSessionMascotIntroSeen,
  loadTourProgressState,
  resolveGuideModeForOrchestrator,
  resolveMascotOrchestratorMode,
  resolveTourStepFromTab,
  saveTourProgressState,
  shouldProcessStalkerSpeech,
  skipTour,
  startTour,
  syncTourProgressToStep,
  TOUR_STEP_ANCHOR_MAP,
  type MascotOrchestratorMode,
  type TourProgressState,
} from "@/lib/twin/guide/tour";
import {
  collectRuntimeAnchors,
  detectViewport,
  indexRuntimeAnchorsById,
  type RuntimeAnchorSnapshot,
} from "@/lib/twin/movement/anchors";
import {
  applyMoveRateLimit,
  clampScenePosition,
  limitTargetDistanceFromOrigin,
  POINTING_CUE_MS,
  resolveSafeScenePosition,
  resolvePreferredAnchorId,
  shouldActivateMotionGuidance,
  shouldStartGuideSpeech,
  shouldTriggerMotionForEvent,
  shouldSwitchAnchorTarget,
  stepInterpolatedMotion,
  type BoundsLike,
  type MotionPoint,
} from "@/lib/twin/movement/engine";
import {
  MASCOT_MOTION_CONSTRAINTS,
  resolveMotionTransition,
  type MascotAnchorId,
  type MascotMotionState,
} from "@/lib/twin/movement/contracts";
import styles from "./TwinMascot.module.css";
import {
  drawMascot,
  SPRITE_PIXEL_HEIGHT,
  SPRITE_PIXEL_WIDTH,
  type MascotAction,
} from "./mascotSprite";

interface SuppressedCounts {
  cooldown: number;
  similarity: number;
  routePaused: number;
  failed: number;
}

type BubbleMode = "idle" | "thinking" | "typing" | "visible";

interface TourGuidePrefetchEntry {
  eventId: string;
  startedAtMs: number;
  templateText: string;
  promise: Promise<MascotGuideResponse>;
}

const QUIET_MODE_STORAGE_KEY = "tazou.mascot.quiet-mode.v1";
const GUIDE_THINKING_DELAY_MS = 260;
const GUIDE_STREAM_TOKEN_DELAY_MS = 24;
const BUBBLE_IDLE_CLOSE_MS = 11_000;
const MAX_PENDING_EVENT_AGE_MS = 12_000;
const GUIDE_SPEECH_HOLD_MIN_MS = 1_800;
const GUIDE_SPEECH_HOLD_MAX_MS = 7_000;
const POST_SPEECH_ANCHOR_HOLD_MIN_MS = 5_000;
const INTRO_REACTIVE_QUIET_MS = 0;
const INTRO_MESSAGE_LOCK_MS = 0;
const INTRO_FALLBACK_LINE =
  "Hi, I am Tazou, Mootez's twin assistant. I will help you navigate this portfolio and quickly surface what matters most.";
const INTERACT_FALLBACK_LINE =
  "Hi, I am Tazou. Start a tour if you want, or open any section and I will guide you in context.";
const PROTECTED_CTA_ANCHOR_IDS: readonly MascotAnchorId[] = [
  "twin_entry_button_hero",
  "project_primary_case_home",
  "project_primary_case_page",
];

const DEFAULT_SUPPRESSED_COUNTS: SuppressedCounts = {
  cooldown: 0,
  similarity: 0,
  routePaused: 0,
  failed: 0,
};

function isGuideEventStillRelevant(
  event: MascotBehaviorEvent,
  mode: MascotGuideMode,
  pathname: string,
  activeTab: HomeTab,
  lastSectionId?: SectionId
): boolean {
  if (Date.now() - event.occurredAtMs > MAX_PENDING_EVENT_AGE_MS) {
    return false;
  }

  if (mode !== "reactive") {
    return true;
  }

  if (event.type === "section_enter") {
    if (pathname !== "/") {
      return false;
    }
    if (lastSectionId && lastSectionId !== event.sectionId) {
      return false;
    }
  }

  if (event.type === "route_change" && pathname !== event.toPath) {
    return false;
  }

  if (event.type === "project_open" && pathname.startsWith("/projects/")) {
    return pathname.includes(event.projectSlug);
  }

  if (event.type === "tab_change") {
    if (pathname !== "/") {
      return false;
    }
    if (event.toTab !== activeTab) {
      return false;
    }
  }

  if (event.type === "rail_focus") {
    if (pathname !== "/") {
      return false;
    }
    if (event.tab !== activeTab) {
      return false;
    }
  }

  return true;
}

function createGuideErrorResponse(message: string): MascotGuideResponse {
  return {
    status: "error",
    code: "internal_error",
    message,
  };
}

function actionForTrigger(
  triggerType: MascotBehaviorEventType,
  guideMode: MascotGuideMode
): MascotAction {
  if (triggerType === "project_open") {
    return "talk";
  }
  if (
    guideMode === "reactive" &&
    (triggerType === "section_enter" ||
      triggerType === "tab_change" ||
      triggerType === "rail_focus")
  ) {
    return "talk";
  }
  if (
    triggerType === "section_enter" ||
    triggerType === "lens_switch" ||
    triggerType === "rail_focus"
  ) {
    return "think";
  }
  if (triggerType === "route_change" || triggerType === "tab_change") {
    return "walk";
  }
  return "type";
}

function estimateSpeechHoldMs(text: string): number {
  const tokenCount = text
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
  if (tokenCount === 0) {
    return GUIDE_SPEECH_HOLD_MIN_MS;
  }

  const estimateMs = tokenCount * GUIDE_STREAM_TOKEN_DELAY_MS * 2 + 900;
  return Math.min(
    GUIDE_SPEECH_HOLD_MAX_MS,
    Math.max(GUIDE_SPEECH_HOLD_MIN_MS, estimateMs)
  );
}

function createSyntheticTourEvent(input: {
  stepId: TourStepId;
  pathname: string;
  roleLens: RoleLens;
  sessionId: string;
}): MascotBehaviorEvent {
  const eventId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? `tour-${crypto.randomUUID()}`
      : `tour-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const common = {
    eventId,
    occurredAtMs: Date.now(),
    sessionId: input.sessionId,
    pathname: input.pathname,
    roleLens: input.roleLens,
  };

  if (input.stepId === "projects") {
    return {
      ...common,
      type: "section_enter",
      sectionId: "projects",
    };
  }
  if (input.stepId === "why_me") {
    return {
      ...common,
      type: "section_enter",
      sectionId: "about",
    };
  }
  if (input.stepId === "experience") {
    return {
      ...common,
      type: "section_enter",
      sectionId: "experience",
    };
  }
  if (input.stepId === "contact") {
    return {
      ...common,
      type: "section_enter",
      sectionId: "contact",
    };
  }

  return {
    ...common,
    type: "route_change",
    fromPath: input.pathname,
    toPath: input.pathname,
  };
}

function createSyntheticEventId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function resolveScenePositionForAnchor(
  anchor: RuntimeAnchorSnapshot,
  viewport: { width: number; height: number },
  sceneSize: { width: number; height: number }
): MotionPoint {
  const inset = Math.max(12, anchor.safeInsetPx);

  if (anchor.id === "rest_corner") {
    return clampScenePosition(
      {
        x: anchor.bounds.left - sceneSize.width + 104,
        y: anchor.bounds.top - sceneSize.height + 168,
      },
      viewport,
      sceneSize,
      inset
    );
  }

  // Lock mascot exclusively to the right-hand side gutter of the screen
  const x = viewport.width - sceneSize.width - Math.max(inset, 24);

  let y = anchor.bounds.top + 8;
  if (
    anchor.id === "project_primary_case_home" ||
    anchor.id === "project_primary_case_page"
  ) {
    y = anchor.bounds.top - 10;
  }

  return clampScenePosition(
    {
      x,
      y,
    },
    viewport,
    sceneSize,
    inset
  );
}

export function TwinMascot() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLens = parseRoleLens(searchParams.get("lens"));
  const activeTab = parseHomeTab(searchParams.get("tab"));
  const twinLink = buildLensHref("/twin", activeLens) as Route;
  const sessionId = useMemo(() => getBehaviorSessionId(), []);
  const pausedOnRoute = isGuideRoutePaused(pathname);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const actionRef = useRef<MascotAction>("idle");
  const motionActionOverrideRef = useRef<MascotAction | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const frameRef = useRef(0);
  const frameTimerRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const blinkOnRef = useRef(false);
  const thinkingTimerRef = useRef<number | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const speechReleaseTimerRef = useRef<number | null>(null);
  const activeTurnTokenRef = useRef(0);
  const bubbleModeRef = useRef<BubbleMode>("idle");
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const bootstrappedQueueRef = useRef(false);
  const restoredSessionStateRef = useRef(false);
  const runtimeAnchorsRef = useRef<RuntimeAnchorSnapshot[]>([]);
  const runtimeAnchorIndexRef = useRef<Partial<Record<MascotAnchorId, RuntimeAnchorSnapshot>>>(
    {}
  );
  const motionStateRef = useRef<MascotMotionState>("idle");
  const motionStateEnteredAtRef = useRef(Date.now());
  const motionPositionRef = useRef<MotionPoint | null>(null);
  const motionTargetPositionRef = useRef<MotionPoint | null>(null);
  const activeAnchorIdRef = useRef<MascotAnchorId>("rest_corner");
  const activeGuideEventRef = useRef<MascotBehaviorEvent | null>(null);
  const anchorHoldEventRef = useRef<MascotBehaviorEvent | null>(null);
  const anchorHoldUntilRef = useRef(0);
  const lastAnchorSwitchAtRef = useRef(0);
  const recentAnchorSwitchesMsRef = useRef<number[]>([]);
  const sceneBoundsRef = useRef({ width: 240, height: 240 });
  const typingSuppressedUntilRef = useRef(0);
  const bubbleOpenRef = useRef(false);
  const processingGuideRef = useRef(false);
  const pendingEventsCountRef = useRef(0);
  const collapsedRef = useRef(false);
  const routePausedRef = useRef(pausedOnRoute);
  const orchestratorModeRef = useRef<MascotOrchestratorMode>("stalker");
  const tourProgressRef = useRef<TourProgressState>(createInitialTourProgressState());
  const lastSpokenTourStepRef = useRef<TourStepId | null>(null);
  const previousOrchestratorModeRef = useRef<MascotOrchestratorMode>("stalker");
  const tourPrefetchRef = useRef<TourGuidePrefetchEntry | null>(null);
  const suppressNextTabSyncRef = useRef(false);
  const introTimersRef = useRef<number[]>([]);
  const introCompletedRef = useRef(false);
  const introStartedRef = useRef(false);
  const introReactiveQuietUntilRef = useRef(0);
  const introMessageLockUntilRef = useRef(0);
  const hasUserInteractedRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const cooldownSnapshotRef = useRef(createGuideCooldownSnapshot());
  const recentGuideMessagesRef = useRef<string[]>([]);
  const recentTriggerTypesRef = useRef<MascotBehaviorEventType[]>([]);
  const suppressedCountsRef = useRef<SuppressedCounts>({
    ...DEFAULT_SUPPRESSED_COUNTS,
  });
  const lastSectionIdRef = useRef<SectionId | undefined>(undefined);
  const quietModeRef = useRef(false);
  const viewportModeRef = useRef<"desktop" | "mobile">("desktop");
  const prefersReducedMotionRef = useRef(false);
  const randomIdleActionRef = useRef<MascotAction | null>(null);

  const [action, setAction] = useState<MascotAction>("idle");
  const [randomIdleAction, setRandomIdleAction] = useState<MascotAction | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [bubbleMode, setBubbleMode] = useState<BubbleMode>("idle");
  const [collapsed, setCollapsed] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<MascotBehaviorEvent[]>([]);
  const [processingGuide, setProcessingGuide] = useState(false);
  const [movementState, setMovementState] = useState<MascotMotionState>("idle");
  const [quietMode, setQuietMode] = useState(false);
  const [orchestratorMode, setOrchestratorMode] =
    useState<MascotOrchestratorMode>("stalker");
  const [activeGuideSignal, setActiveGuideSignal] = useState(0);
  const [tourProgress, setTourProgress] = useState<TourProgressState>(
    createInitialTourProgressState()
  );

  const persistGuideSessionState = useCallback((nowMs: number) => {
    saveMascotGuideSessionState(
      {
        cooldownSnapshot: cooldownSnapshotRef.current,
        recentGuideMessages: recentGuideMessagesRef.current,
        recentTriggerTypes: recentTriggerTypesRef.current,
        ...(lastSectionIdRef.current
          ? { lastSectionId: lastSectionIdRef.current }
          : {}),
      },
      undefined,
      nowMs
    );
  }, []);

  const setMotionState = useCallback(
    (trigger: Parameters<typeof resolveMotionTransition>[1], nowMs: number) => {
      const next = resolveMotionTransition(motionStateRef.current, trigger);
      if (!next || next === motionStateRef.current) {
        return;
      }
      motionStateRef.current = next;
      motionStateEnteredAtRef.current = nowMs;
      setMovementState(next);
    },
    []
  );

  const clearPostSpeechAnchorHold = useCallback(() => {
    anchorHoldEventRef.current = null;
    anchorHoldUntilRef.current = 0;
  }, []);

  const pinMascotAtGuideAnchor = useCallback(
    (event: MascotBehaviorEvent, text: string) => {
      const speechEstimateMs = estimateSpeechHoldMs(text);
      const holdMs = Math.max(
        POST_SPEECH_ANCHOR_HOLD_MIN_MS,
        Math.min(BUBBLE_IDLE_CLOSE_MS, speechEstimateMs)
      );
      anchorHoldEventRef.current = event;
      anchorHoldUntilRef.current = Date.now() + holdMs;
    },
    []
  );

  const applyScenePosition = useCallback((position: MotionPoint) => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    scene.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  }, []);

  const clearTourPrefetch = useCallback(() => {
    tourPrefetchRef.current = null;
  }, []);

  const clearIntroTimers = useCallback(() => {
    if (introTimersRef.current.length === 0) {
      return;
    }
    for (const timerId of introTimersRef.current) {
      window.clearTimeout(timerId);
    }
    introTimersRef.current = [];
  }, []);

  const clearThinkingTimer = useCallback(() => {
    if (thinkingTimerRef.current !== null) {
      window.clearTimeout(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
  }, []);

  const clearTypingTimer = useCallback(() => {
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  const clearSpeechReleaseTimer = useCallback(() => {
    if (speechReleaseTimerRef.current !== null) {
      window.clearTimeout(speechReleaseTimerRef.current);
      speechReleaseTimerRef.current = null;
    }
  }, []);

  const scheduleThinkingBubble = useCallback(
    (turnToken: number) => {
      clearThinkingTimer();
      thinkingTimerRef.current = window.setTimeout(() => {
        if (activeTurnTokenRef.current !== turnToken) {
          return;
        }
        setBubbleMode("thinking");
        setBubbleText("");
        setBubbleOpen(false);
        setAction("think");
      }, GUIDE_THINKING_DELAY_MS);
    },
    [clearThinkingTimer]
  );

  const streamBubbleText = useCallback(
    (rawText: string, turnToken: number) => {
      clearThinkingTimer();
      clearTypingTimer();

      const normalized = rawText.replace(/\s+/g, " ").trim();
      if (!normalized) {
        setBubbleMode("visible");
        setBubbleText(null);
        setBubbleOpen(false);
        return;
      }

      const tokens = normalized.split(/(\s+)/).filter((token) => token.length > 0);
      let cursor = 0;
      let rendered = "";

      setBubbleMode("typing");
      setBubbleText("");
      setBubbleOpen(true);

      const step = () => {
        if (activeTurnTokenRef.current !== turnToken) {
          return;
        }

        const nextToken = tokens[cursor];
        if (!nextToken) {
          setBubbleMode("visible");
          typingTimerRef.current = null;
          return;
        }

        rendered += nextToken;
        cursor += 1;
        setBubbleText(rendered);

        if (cursor >= tokens.length) {
          setBubbleMode("visible");
          typingTimerRef.current = null;
          return;
        }

        typingTimerRef.current = window.setTimeout(step, GUIDE_STREAM_TOKEN_DELAY_MS);
      };

      step();
    },
    [clearThinkingTimer, clearTypingTimer]
  );

  const measureRuntimeAnchors = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshots = collectRuntimeAnchors({
      pathname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      getRectBySelector: (selector) => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      },
    });

    runtimeAnchorsRef.current = snapshots;
    runtimeAnchorIndexRef.current = indexRuntimeAnchorsById(snapshots);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[mascot-anchor-registry]", {
        pathname,
        viewport: detectViewport(window.innerWidth),
        count: snapshots.length,
        anchorIds: snapshots.map((snapshot) => snapshot.id),
      });
    }
  }, [pathname]);

  useEffect(() => {
    actionRef.current = action;
    if (action === "walk") {
      directionRef.current = directionRef.current === 1 ? -1 : 1;
    }
  }, [action]);

  useEffect(() => {
    randomIdleActionRef.current = randomIdleAction;
  }, [randomIdleAction]);

  useEffect(() => {
    if (action !== "idle") {
      setRandomIdleAction(null);
      return;
    }

    let isSubscribed = true;
    let timeout2: number;

    const scheduleRandom = () => {
      const waitMs = 5000 + Math.random() * 10000;
      return window.setTimeout(() => {
        if (!isSubscribed) return;
        const choices: MascotAction[] = ["coffee", "type", "debug", "coffee"];
        setRandomIdleAction(choices[Math.floor(Math.random() * choices.length)] ?? null);
        timeout2 = window.setTimeout(() => {
          if (!isSubscribed) return;
          setRandomIdleAction(null);
          scheduleRandom();
        }, 3000 + Math.random() * 3000);
      }, waitMs);
    };

    const timeout1 = scheduleRandom();

    return () => {
      isSubscribed = false;
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
    };
  }, [action]);

  useEffect(() => {
    routePausedRef.current = pausedOnRoute;
    if (pausedOnRoute) {
      clearIntroTimers();
      clearSpeechReleaseTimer();
      clearThinkingTimer();
      clearTypingTimer();
      activeTurnTokenRef.current += 1;
      clearTourPrefetch();
      activeGuideEventRef.current = null;
      clearPostSpeechAnchorHold();
      setBubbleMode("idle");
      setBubbleOpen(false);
    }
  }, [
    clearPostSpeechAnchorHold,
    clearIntroTimers,
    clearSpeechReleaseTimer,
    clearThinkingTimer,
    clearTypingTimer,
    clearTourPrefetch,
    pausedOnRoute,
  ]);

  useEffect(() => {
    bubbleOpenRef.current = bubbleOpen;
  }, [bubbleOpen]);

  useEffect(() => {
    bubbleModeRef.current = bubbleMode;
  }, [bubbleMode]);

  useEffect(() => {
    processingGuideRef.current = processingGuide;
  }, [processingGuide]);

  useEffect(() => {
    pendingEventsCountRef.current = pendingEvents.length;
  }, [pendingEvents.length]);

  useEffect(() => {
    collapsedRef.current = collapsed;
    if (collapsed) {
      clearIntroTimers();
      clearSpeechReleaseTimer();
      introCompletedRef.current = true;
      clearThinkingTimer();
      clearTypingTimer();
      activeTurnTokenRef.current += 1;
      clearTourPrefetch();
      clearPostSpeechAnchorHold();
      setBubbleMode("idle");
      setBubbleOpen(false);
    }
  }, [
    clearPostSpeechAnchorHold,
    clearIntroTimers,
    clearSpeechReleaseTimer,
    clearThinkingTimer,
    clearTypingTimer,
    clearTourPrefetch,
    collapsed,
  ]);

  useEffect(() => {
    quietModeRef.current = quietMode;
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(QUIET_MODE_STORAGE_KEY, quietMode ? "1" : "0");
  }, [quietMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(QUIET_MODE_STORAGE_KEY);
    if (stored === "1") {
      setQuietMode(true);
      quietModeRef.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearIntroTimers();
      clearSpeechReleaseTimer();
      clearThinkingTimer();
      clearTypingTimer();
      clearTourPrefetch();
      activeTurnTokenRef.current += 1;
      clearPostSpeechAnchorHold();
    };
  }, [
    clearPostSpeechAnchorHold,
    clearIntroTimers,
    clearSpeechReleaseTimer,
    clearThinkingTimer,
    clearTypingTimer,
    clearTourPrefetch,
  ]);

  useEffect(() => {
    orchestratorModeRef.current = orchestratorMode;
  }, [orchestratorMode]);

  useEffect(() => {
    tourProgressRef.current = tourProgress;
    if (typeof window === "undefined") {
      return;
    }
    saveTourProgressState(tourProgress);
  }, [tourProgress]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const persistedProgress = loadTourProgressState();
    const storedProgress =
      persistedProgress.status === "running"
        ? createInitialTourProgressState()
        : persistedProgress;
    setTourProgress(storedProgress);
    tourProgressRef.current = storedProgress;
  }, []);

  useEffect(() => {
    setOrchestratorMode(
      resolveMascotOrchestratorMode({
        pausedOnRoute,
        tourStatus: tourProgress.status,
      })
    );
  }, [pausedOnRoute, tourProgress.status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (pathname !== "/" || pausedOnRoute) {
      return;
    }
    if (introCompletedRef.current || introStartedRef.current) {
      return;
    }

    introStartedRef.current = true;
    const introTurnToken = activeTurnTokenRef.current + 1;
    activeTurnTokenRef.current = introTurnToken;
    introMessageLockUntilRef.current = Date.now() + INTRO_MESSAGE_LOCK_MS;

    const isReturningSession = hasSeenSessionMascotIntro();
    if (!isReturningSession) {
      markSessionMascotIntroSeen();
    }

    setProcessingGuide(true);
    scheduleThinkingBubble(introTurnToken);

    const introEvent: MascotBehaviorEvent = {
      type: "route_change",
      fromPath: isReturningSession ? "/resume" : "/entry",
      toPath: "/",
      eventId: createSyntheticEventId("intro"),
      occurredAtMs: Date.now(),
      sessionId,
      pathname: "/",
      roleLens: activeLens,
    };

    const introRequest: MascotGuideRequest = {
      trigger: introEvent,
      context: {
        roleLens: activeLens,
        mode: "reactive",
        currentSectionId: "about",
        recentGuideMessages: recentGuideMessagesRef.current.slice(-3),
        recentTriggerTypes: recentTriggerTypesRef.current.slice(-5),
      },
    };

    const runIntroFetch = async (): Promise<MascotGuideResponse> => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        GUIDE_FETCH_TIMEOUT_MS
      );
      try {
        const response = await fetch("/api/twin/guide", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(introRequest),
          signal: controller.signal,
        });
        const parsed = (await response.json()) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "status" in parsed &&
          (((parsed as MascotGuideResponse).status === "ok") ||
            (parsed as MascotGuideResponse).status === "error")
        ) {
          return parsed as MascotGuideResponse;
        }
        return createGuideErrorResponse("Guide response shape is unsupported.");
      } catch {
        return createGuideErrorResponse("Guide request failed.");
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    void runIntroFetch()
      .then((response) => {
        if (activeTurnTokenRef.current !== introTurnToken) {
          return;
        }
        clearThinkingTimer();
        const introText =
          response.status === "ok" && response.guide.text.trim().length > 0
            ? response.guide.text.trim()
            : INTRO_FALLBACK_LINE;
        streamBubbleText(introText, introTurnToken);
        setAction("talk");
        const introTimer = window.setTimeout(() => {
          setAction("idle");
        }, 1800);
        introTimersRef.current = [introTimer];
        introCompletedRef.current = true;
        introReactiveQuietUntilRef.current =
          Date.now() + Math.max(INTRO_REACTIVE_QUIET_MS, INTRO_MESSAGE_LOCK_MS);
        introMessageLockUntilRef.current = Date.now() + INTRO_MESSAGE_LOCK_MS;
        recentGuideMessagesRef.current = appendRecentGuideMessage(
          recentGuideMessagesRef.current,
          introText
        );
        persistGuideSessionState(Date.now());
      })
      .catch(() => {
        if (activeTurnTokenRef.current !== introTurnToken) {
          return;
        }
        clearThinkingTimer();
        streamBubbleText(INTRO_FALLBACK_LINE, introTurnToken);
        setAction("talk");
        const introTimer = window.setTimeout(() => {
          setAction("idle");
        }, 1800);
        introTimersRef.current = [introTimer];
        introCompletedRef.current = true;
        introReactiveQuietUntilRef.current =
          Date.now() + Math.max(INTRO_REACTIVE_QUIET_MS, INTRO_MESSAGE_LOCK_MS);
        introMessageLockUntilRef.current = Date.now() + INTRO_MESSAGE_LOCK_MS;
      })
      .finally(() => {
        if (activeTurnTokenRef.current === introTurnToken) {
          setProcessingGuide(false);
        }
      });
  }, [
    activeLens,
    clearThinkingTimer,
    pathname,
    pausedOnRoute,
    persistGuideSessionState,
    scheduleThinkingBubble,
    sessionId,
    streamBubbleText,
  ]);

  useEffect(() => {
    if (suppressNextTabSyncRef.current) {
      suppressNextTabSyncRef.current = false;
      return;
    }

    if (orchestratorMode !== "tour" || pausedOnRoute) {
      return;
    }

    const targetStep = resolveTourStepFromTab(activeTab);
    if (!targetStep) {
      return;
    }

    setTourProgress((previous) => syncTourProgressToStep(previous, targetStep));
  }, [activeTab, orchestratorMode, pausedOnRoute]);

  useEffect(() => {
    const previousMode = previousOrchestratorModeRef.current;
    if (previousMode === "tour" && orchestratorMode === "stalker") {
      setPendingEvents([]);
      lastSpokenTourStepRef.current = null;
      clearTourPrefetch();
    }
    previousOrchestratorModeRef.current = orchestratorMode;
  }, [clearTourPrefetch, orchestratorMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isTwinTypingTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) {
        return false;
      }
      if (target.id === "twin-input") {
        return true;
      }
      if (target.closest("[data-twin-panel='true'] #twin-input")) {
        return true;
      }
      return Boolean(
        target.closest(
          "[data-twin-panel='true'] textarea, [data-twin-panel='true'] input, [data-twin-panel='true'] [contenteditable='true']"
        )
      );
    };

    const markTypingSuppression = () => {
      typingSuppressedUntilRef.current = Date.now() + 2200;
    };

    const handleKeyDown = (event: Event) => {
      if (isTwinTypingTarget(event.target)) {
        markTypingSuppression();
      }
    };

    const handleInput = (event: Event) => {
      if (isTwinTypingTarget(event.target)) {
        markTypingSuppression();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("input", handleInput, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("input", handleInput, true);
    };
  }, []);

  const queuePendingEvent = useCallback((event: MascotBehaviorEvent) => {
    if (!isStalkerEventAllowed(event)) {
      return;
    }
    if (!hasUserInteractedRef.current) {
      return;
    }
    setPendingEvents((previous) =>
      appendPendingEvent(previous, event, MASCOT_PENDING_EVENT_LIMIT)
    );
    if (event.type === "section_enter") {
      lastSectionIdRef.current = event.sectionId;
    }
  }, []);

  useEffect(() => {
    if (restoredSessionStateRef.current) {
      return;
    }
    restoredSessionStateRef.current = true;

    const restored = loadMascotGuideSessionState(undefined, Date.now());
    if (!restored) {
      return;
    }

    cooldownSnapshotRef.current = restored.cooldownSnapshot;
    recentGuideMessagesRef.current = restored.recentGuideMessages;
    recentTriggerTypesRef.current = restored.recentTriggerTypes;
    if (restored.lastSectionId) {
      lastSectionIdRef.current = restored.lastSectionId;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToBehaviorQueue((queuedEvents, lastEvent) => {
      if (!bootstrappedQueueRef.current) {
        bootstrappedQueueRef.current = true;
        for (const queuedEvent of queuedEvents) {
          if (routePausedRef.current) {
            suppressedCountsRef.current.routePaused += 1;
            continue;
          }
          queuePendingEvent(queuedEvent);
        }
        return;
      }

      if (!lastEvent) {
        return;
      }

      if (routePausedRef.current) {
        suppressedCountsRef.current.routePaused += 1;
        return;
      }

      queuePendingEvent(lastEvent);

      if (process.env.NODE_ENV !== "production") {
        console.debug("[mascot-behavior]", {
          queued: queuedEvents.length,
          eventType: lastEvent.type,
          pathname: lastEvent.pathname,
          roleLens: lastEvent.roleLens,
        });
      }
    });

    return unsubscribe;
  }, [queuePendingEvent]);

  useEffect(() => {
    if (
      orchestratorMode !== "tour" ||
      pausedOnRoute ||
      collapsed ||
      processingGuide ||
      activeGuideEventRef.current
    ) {
      return;
    }

    const activeStep = getActiveTourStep(tourProgress);
    if (!activeStep) {
      return;
    }

    if (lastSpokenTourStepRef.current === activeStep) {
      return;
    }

    const syntheticEvent = createSyntheticTourEvent({
      stepId: activeStep,
      pathname,
      roleLens: activeLens,
      sessionId,
    });
    activeGuideEventRef.current = syntheticEvent;
    clearPostSpeechAnchorHold();
    setActiveGuideSignal((previous) => previous + 1);
    lastSpokenTourStepRef.current = activeStep;
    setMotionState("target_acquired", Date.now());
  }, [
    activeLens,
    clearPostSpeechAnchorHold,
    collapsed,
    orchestratorMode,
    pathname,
    pausedOnRoute,
    processingGuide,
    sessionId,
    setMotionState,
    tourProgress,
  ]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }

    const updateSceneBounds = () => {
      const rect = scene.getBoundingClientRect();
      sceneBoundsRef.current = {
        width: Math.max(96, rect.width),
        height: Math.max(120, rect.height),
      };
    };

    updateSceneBounds();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateSceneBounds();
    });
    observer.observe(scene);

    return () => {
      observer.disconnect();
    };
  }, [bubbleOpen, collapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const scheduleMeasurement = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        measureRuntimeAnchors();
      });
    };

    measureRuntimeAnchors();

    window.addEventListener("resize", scheduleMeasurement);
    window.addEventListener("orientationchange", scheduleMeasurement);
    window.addEventListener("scroll", scheduleMeasurement, { passive: true });

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        scheduleMeasurement();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", scheduleMeasurement);
      window.removeEventListener("orientationchange", scheduleMeasurement);
      window.removeEventListener("scroll", scheduleMeasurement);
      resizeObserver?.disconnect();
    };
  }, [measureRuntimeAnchors]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let animationFrameId: number | null = null;
    let previousFrameMs = performance.now();
    let prefersReducedMotion = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    prefersReducedMotionRef.current = prefersReducedMotion;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMediaChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
      prefersReducedMotionRef.current = event.matches;
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    const step = (frameMs: number) => {
      // Prevent massive 'teleportation' jumps if tab is suspended or lags
      const deltaMs = Math.min(Math.max(1, frameMs - previousFrameMs), 64);
      previousFrameMs = frameMs;

      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      const viewportMode = detectViewport(viewport.width);
      viewportModeRef.current = viewportMode;
      const constraints = MASCOT_MOTION_CONSTRAINTS[viewportMode];
      const activeTourStep = getActiveTourStep(tourProgressRef.current);
      const hasTourGuidance =
        orchestratorModeRef.current === "tour" && Boolean(activeTourStep);
      const nowMs = Date.now();
      const hasHeldGuideEvent =
        anchorHoldUntilRef.current > nowMs && Boolean(anchorHoldEventRef.current);
      if (!hasHeldGuideEvent && anchorHoldEventRef.current) {
        clearPostSpeechAnchorHold();
      }
      const activeGuideEvent =
        activeGuideEventRef.current ??
        (hasHeldGuideEvent ? anchorHoldEventRef.current : null);
      const hasGuideEvent = Boolean(activeGuideEvent) || hasTourGuidance;
      const isTypingSuppressed = Date.now() < typingSuppressedUntilRef.current;
      const activeGuidance = shouldActivateMotionGuidance({
        hasGuideEvent,
        isProcessingGuide: processingGuideRef.current,
        isRoutePaused: routePausedRef.current,
        isCollapsed: collapsedRef.current,
        isTypingSuppressed,
      });
      const triggerTypeForMotion = activeGuideEvent
        ? activeGuideEvent.type
        : hasTourGuidance
          ? "section_enter"
          : null;
      const isReturningToRest = motionStateRef.current === "returning" && activeAnchorIdRef.current === "rest_corner";
      const shouldRelocateForTrigger = triggerTypeForMotion
        ? shouldTriggerMotionForEvent({
            triggerType: triggerTypeForMotion,
            viewportMode,
            quietMode: quietModeRef.current,
            prefersReducedMotion,
          })
        : isReturningToRest;
      const movementGuidance = activeGuidance && shouldRelocateForTrigger;
      const forcedAnchorId =
        hasTourGuidance && activeTourStep
          ? (TOUR_STEP_ANCHOR_MAP[activeTourStep] as MascotAnchorId)
          : undefined;

      const preferredAnchorId = movementGuidance
        ? resolvePreferredAnchorId({
            pathname,
            hasActiveGuidance: movementGuidance,
            availableAnchors: runtimeAnchorIndexRef.current,
            ...(forcedAnchorId ? { forcedAnchorId } : {}),
            ...(activeGuideEvent ? { trigger: activeGuideEvent } : {}),
            ...(lastSectionIdRef.current
              ? { lastSectionId: lastSectionIdRef.current }
              : {}),
          })
        : "rest_corner";

      if (
        shouldSwitchAnchorTarget({
          currentAnchorId: activeAnchorIdRef.current,
          nextAnchorId: preferredAnchorId,
          nowMs,
          lastSwitchAtMs: lastAnchorSwitchAtRef.current,
          minDwellMs: constraints.minDwellMs,
        })
      ) {
        const moveRateLimit = applyMoveRateLimit({
          nowMs,
          maxMovesPerMinute: constraints.maxMovesPerMinute,
          recentSwitchesMs: recentAnchorSwitchesMsRef.current,
        });
        const switchingToRest = preferredAnchorId === "rest_corner";
        const allowSwitch = switchingToRest || moveRateLimit.allowed;

        if (allowSwitch) {
          if (!switchingToRest) {
            recentAnchorSwitchesMsRef.current = moveRateLimit.nextRecentSwitchesMs;
          } else {
            recentAnchorSwitchesMsRef.current = recentAnchorSwitchesMsRef.current.filter(
              (timestamp) => timestamp >= nowMs - 60_000
            );
          }
          activeAnchorIdRef.current = preferredAnchorId;
          lastAnchorSwitchAtRef.current = nowMs;
          setMotionState("target_acquired", nowMs);
        } else {
          recentAnchorSwitchesMsRef.current = moveRateLimit.nextRecentSwitchesMs;
        }
      }

      const resolvedAnchor =
        runtimeAnchorIndexRef.current[activeAnchorIdRef.current] ??
        runtimeAnchorIndexRef.current.rest_corner;
      if (!resolvedAnchor) {
        const fallbackPosition = clampScenePosition(
          {
            x: viewport.width - sceneBoundsRef.current.width - 24,
            y: viewport.height - sceneBoundsRef.current.height - 24,
          },
          viewport,
          sceneBoundsRef.current,
          12
        );
        const currentPosition = motionPositionRef.current;
        if (!currentPosition) {
          motionPositionRef.current = fallbackPosition;
          motionTargetPositionRef.current = fallbackPosition;
          applyScenePosition(fallbackPosition);
          activeAnchorIdRef.current = "rest_corner";
          animationFrameId = window.requestAnimationFrame(step);
          return;
        }
        const fallbackMotion = stepInterpolatedMotion({
          position: currentPosition,
          target: fallbackPosition,
          deltaMs,
          snapThresholdPx: constraints.snapThresholdPx,
          maxSpeedPxPerSec: 360,
          easingPreset: "returning",
        });
        const clampedFallback = clampScenePosition(
          fallbackMotion.nextPosition,
          viewport,
          sceneBoundsRef.current,
          12
        );
        motionPositionRef.current = clampedFallback;
        motionTargetPositionRef.current = fallbackPosition;
        applyScenePosition(clampedFallback);
        activeAnchorIdRef.current = "rest_corner";
        animationFrameId = window.requestAnimationFrame(step);
        return;
      }

      let desiredTarget = resolveScenePositionForAnchor(
        resolvedAnchor,
        viewport,
        sceneBoundsRef.current
      );
      if (viewportMode === "mobile" && resolvedAnchor.id !== "rest_corner") {
        const restAnchor = runtimeAnchorIndexRef.current.rest_corner;
        if (restAnchor) {
          const restPosition = resolveScenePositionForAnchor(
            restAnchor,
            viewport,
            sceneBoundsRef.current
          );
          desiredTarget = limitTargetDistanceFromOrigin({
            origin: restPosition,
            target: desiredTarget,
            maxDistancePx: constraints.maxDistancePx,
          });
        }
      }

      const protectedRects: BoundsLike[] = PROTECTED_CTA_ANCHOR_IDS.map(
        (anchorId) => runtimeAnchorIndexRef.current[anchorId]?.bounds
      ).filter((bounds): bounds is BoundsLike => Boolean(bounds));

      desiredTarget = resolveSafeScenePosition({
        desiredPosition: desiredTarget,
        sceneSize: sceneBoundsRef.current,
        viewport,
        protectedRects,
        insetPx: 12,
        clearancePx: 12,
      });
      motionTargetPositionRef.current = desiredTarget;

      if (!motionPositionRef.current) {
        const scene = sceneRef.current;
        if (scene) {
          const rect = scene.getBoundingClientRect();
          motionPositionRef.current = clampScenePosition(
            { x: rect.left, y: rect.top },
            viewport,
            sceneBoundsRef.current,
            12
          );
        } else {
          motionPositionRef.current = desiredTarget;
          applyScenePosition(desiredTarget);
        }
      }

      if (!shouldRelocateForTrigger) {
        const staticPosition = clampScenePosition(
          motionPositionRef.current ?? desiredTarget,
          viewport,
          sceneBoundsRef.current,
          12
        );
        motionPositionRef.current = staticPosition;
        applyScenePosition(staticPosition);
        motionActionOverrideRef.current = null;

        if (activeGuidance) {
          if (motionStateRef.current !== "speaking") {
            setMotionState("speech_started", nowMs);
          }
        } else if (motionStateRef.current !== "idle") {
          setMotionState("force_idle", nowMs);
        }

        animationFrameId = window.requestAnimationFrame(step);
        return;
      }

      const motionStep = stepInterpolatedMotion({
        position: motionPositionRef.current ?? desiredTarget,
        target: desiredTarget,
        deltaMs,
        snapThresholdPx: constraints.snapThresholdPx,
        maxSpeedPxPerSec:
          activeAnchorIdRef.current === "rest_corner" ? 460 : 360,
        easingPreset:
          activeAnchorIdRef.current === "rest_corner" ? "returning" : "calm",
      });

      const clampedNextPosition = clampScenePosition(
        motionStep.nextPosition,
        viewport,
        sceneBoundsRef.current,
        12
      );
      motionPositionRef.current = clampedNextPosition;
      applyScenePosition(clampedNextPosition);

      if (
        motionStateRef.current === "relocating" &&
        motionStep.arrived &&
        activeAnchorIdRef.current !== "rest_corner"
      ) {
        setMotionState("arrived_at_anchor", nowMs);
      }

      if (motionStateRef.current === "pointing") {
        if (nowMs - motionStateEnteredAtRef.current >= POINTING_CUE_MS) {
          if (activeGuidance) {
            setMotionState("point_cue_complete", nowMs);
          } else {
            setMotionState("guidance_cleared", nowMs);
          }
        }
      }

      if (!activeGuidance && activeAnchorIdRef.current !== "rest_corner") {
        activeAnchorIdRef.current = "rest_corner";
        setMotionState("guidance_cleared", nowMs);
      }

      if (motionStateRef.current === "speaking" && !activeGuidance) {
        setMotionState("speech_ended", nowMs);
      }

      if (
        motionStateRef.current === "returning" &&
        activeAnchorIdRef.current === "rest_corner" &&
        motionStep.arrived
      ) {
        setMotionState("arrived_at_anchor", nowMs);
      }

      if (
        motionStateRef.current === "idle" &&
        activeGuidance &&
        activeAnchorIdRef.current !== "rest_corner"
      ) {
        setMotionState("target_acquired", nowMs);
      }

      switch (motionStateRef.current) {
        case "relocating":
        case "returning":
          motionActionOverrideRef.current = motionStep.arrived ? null : "walk";
          break;
        case "pointing":
          motionActionOverrideRef.current = "standup";
          break;
        default:
          motionActionOverrideRef.current = null;
      }

      animationFrameId = window.requestAnimationFrame(step);
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, [applyScenePosition, clearPostSpeechAnchorHold, pathname, setMotionState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const step = (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const currentAction =
        motionActionOverrideRef.current ??
        (actionRef.current === "idle" && randomIdleActionRef.current
          ? randomIdleActionRef.current
          : actionRef.current);
      const speed =
        currentAction === "walk"
          ? 120
          : currentAction === "type"
            ? 90
            : currentAction === "coffee"
              ? 220
              : 200;

      frameTimerRef.current += dt;
      if (frameTimerRef.current > speed) {
        frameTimerRef.current = 0;
        frameRef.current += 1;
      }

      blinkTimerRef.current += dt;
      if (blinkTimerRef.current > 3000) blinkOnRef.current = true;
      if (blinkTimerRef.current > 3160) {
        blinkOnRef.current = false;
        blinkTimerRef.current = 0;
      }

      drawMascot(ctx, {
        action: currentAction,
        frame: frameRef.current,
        direction: directionRef.current,
        blink: blinkOnRef.current,
      });

      if (!prefersReduced) {
        rafRef.current = window.requestAnimationFrame(step);
      }
    };

    if (prefersReduced) {
      drawMascot(ctx, {
        action: actionRef.current,
        frame: 0,
        direction: directionRef.current,
        blink: false,
      });
    } else {
      rafRef.current = window.requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setAction("walk");
    const resetId = window.setTimeout(() => setAction("idle"), 2200);
    return () => window.clearTimeout(resetId);
  }, [pathname]);

  useEffect(() => {
    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };
    const markInteraction = () => {
      hasUserInteractedRef.current = true;
      markActivity();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markActivity();
      }
    };

    markActivity();

    window.addEventListener("scroll", markInteraction, { passive: true });
    window.addEventListener("pointerdown", markInteraction, { passive: true });
    window.addEventListener("keydown", markInteraction);
    window.addEventListener("touchstart", markInteraction, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("scroll", markInteraction);
      window.removeEventListener("pointerdown", markInteraction);
      window.removeEventListener("keydown", markInteraction);
      window.removeEventListener("touchstart", markInteraction);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const fetchGuide = useCallback(async (payload: MascotGuideRequest) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      GUIDE_FETCH_TIMEOUT_MS
    );

    try {
      const response = await fetch("/api/twin/guide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const parsed = (await response.json()) as unknown;
      if (!parsed || typeof parsed !== "object") {
        return createGuideErrorResponse("Guide response is invalid.");
      }

      if (
        "status" in parsed &&
        (((parsed as MascotGuideResponse).status === "ok") ||
          (parsed as MascotGuideResponse).status === "error")
      ) {
        return parsed as MascotGuideResponse;
      }

      return createGuideErrorResponse("Guide response shape is unsupported.");
    } catch {
      return createGuideErrorResponse("Guide request failed.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    if (pausedOnRoute || collapsed) {
      return;
    }

    const selectedEvent = activeGuideEventRef.current;
    if (!selectedEvent) {
      return;
    }

    if (tourPrefetchRef.current?.eventId === selectedEvent.eventId) {
      return;
    }

    const guideMode = resolveGuideModeForOrchestrator(orchestratorModeRef.current);
    const activeTourStepId = getActiveTourStep(tourProgressRef.current);
    const templateText = buildGuideTemplate({
      mode: guideMode,
      roleLens: activeLens,
      ...(activeTourStepId ? { activeTourStepId } : {}),
      trigger: selectedEvent,
    });

    const request: MascotGuideRequest = {
      trigger: selectedEvent,
      context: {
        roleLens: activeLens,
        mode: guideMode,
        ...(activeTourStepId ? { activeTourStepId } : {}),
        ...(lastSectionIdRef.current
          ? { currentSectionId: lastSectionIdRef.current }
          : {}),
        recentGuideMessages: recentGuideMessagesRef.current.slice(-3),
        recentTriggerTypes: recentTriggerTypesRef.current.slice(-5),
      },
    };

    const startedAtMs = Date.now();
    const promise = fetchGuide(request);

    tourPrefetchRef.current = {
      eventId: selectedEvent.eventId,
      startedAtMs,
      templateText,
      promise,
    };
  }, [
    activeGuideSignal,
    activeLens,
    collapsed,
    fetchGuide,
    pausedOnRoute,
  ]);

  useEffect(() => {
    const selectedEvent = activeGuideEventRef.current;
    if (!selectedEvent || pausedOnRoute || collapsed || processingGuide) {
      return;
    }
    setAction("think");
  }, [activeGuideSignal, collapsed, pausedOnRoute, processingGuide]);

  useEffect(() => {
    if (
      !shouldProcessStalkerSpeech(orchestratorMode) ||
      processingGuide ||
      collapsed ||
      pausedOnRoute
    ) {
      return;
    }
    if (!introCompletedRef.current || !hasUserInteractedRef.current) {
      return;
    }

    if (activeGuideEventRef.current) {
      return;
    }

    const nowMs = Date.now();
    if (nowMs < introMessageLockUntilRef.current) {
      return;
    }
    if (nowMs < introReactiveQuietUntilRef.current) {
      return;
    }
    const freshPending = pendingEvents.filter((event) => {
      if (!isStalkerEventAllowed(event)) {
        return false;
      }
      if (nowMs - event.occurredAtMs > MAX_PENDING_EVENT_AGE_MS) {
        return false;
      }
      if (event.type === "section_enter" && pathname !== "/") {
        return false;
      }
      return true;
    });

    if (freshPending.length !== pendingEvents.length) {
      setPendingEvents(freshPending);
    }

    const selectedEvent = selectHighestPriorityEvent(freshPending);
    if (!selectedEvent) {
      return;
    }

    setPendingEvents((previous) =>
      removePendingEventById(previous, selectedEvent.eventId)
    );

    activeGuideEventRef.current = selectedEvent;
    clearPostSpeechAnchorHold();
    setActiveGuideSignal((previous) => previous + 1);
    if (selectedEvent.type === "section_enter") {
      lastSectionIdRef.current = selectedEvent.sectionId;
    }
    setMotionState("target_acquired", Date.now());
  }, [
    collapsed,
    orchestratorMode,
    pendingEvents,
    pathname,
    pausedOnRoute,
    processingGuide,
    setMotionState,
    clearPostSpeechAnchorHold,
  ]);

  useEffect(() => {
    const selectedEvent = activeGuideEventRef.current;
    if (!selectedEvent) {
      return;
    }

    const activeTourStepId = getActiveTourStep(tourProgress);
    const guideMode: MascotGuideMode =
      resolveGuideModeForOrchestrator(orchestratorMode);

    const prefersReducedMotion =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : prefersReducedMotionRef.current;
    const viewportMode =
      typeof window !== "undefined"
        ? detectViewport(window.innerWidth)
        : viewportModeRef.current;
    const shouldRelocateForTrigger = shouldTriggerMotionForEvent({
      triggerType: selectedEvent.type,
      viewportMode,
      quietMode,
      prefersReducedMotion,
    });
    const isTypingSuppressed = Date.now() < typingSuppressedUntilRef.current;
    const canStartSpeech = shouldStartGuideSpeech({
      movementState,
      hasGuideEvent: true,
      isProcessingGuide: processingGuide,
      isRoutePaused: pausedOnRoute,
      isCollapsed: collapsed,
      isTypingSuppressed,
      allowStaticStart: !shouldRelocateForTrigger,
    });

    if (!canStartSpeech) {
      return;
    }

    setProcessingGuide(true);
    const turnToken = activeTurnTokenRef.current + 1;
    activeTurnTokenRef.current = turnToken;
    scheduleThinkingBubble(turnToken);

    const turnStartedAtMs = Date.now();
    const templateText = buildGuideTemplate({
      mode: guideMode,
      roleLens: activeLens,
      ...(activeTourStepId ? { activeTourStepId } : {}),
      trigger: selectedEvent,
    });

    if (guideMode === "tour") {
      const prefetched = tourPrefetchRef.current;
      const hasPrefetchedForEvent = prefetched?.eventId === selectedEvent.eventId;
      let speechHoldMs = 0;
      let shouldPinToAnchorAfterSpeech = false;
      let pinText = "";

      const request: MascotGuideRequest = {
        trigger: selectedEvent,
        context: {
          roleLens: activeLens,
          mode: "tour",
          ...(activeTourStepId ? { activeTourStepId } : {}),
          ...(lastSectionIdRef.current
            ? { currentSectionId: lastSectionIdRef.current }
            : {}),
          recentGuideMessages: recentGuideMessagesRef.current.slice(-3),
          recentTriggerTypes: recentTriggerTypesRef.current.slice(-5),
        },
      };

      const fallbackTemplateText =
        hasPrefetchedForEvent && prefetched
          ? prefetched.templateText
          : templateText;
      const responsePromise =
        hasPrefetchedForEvent && prefetched
          ? prefetched.promise
          : fetchGuide(request);
      const startedAtMs =
        hasPrefetchedForEvent && prefetched
          ? prefetched.startedAtMs
          : turnStartedAtMs;

      void responsePromise
        .then((response) => {
          if (activeTurnTokenRef.current !== turnToken) {
            return;
          }

          clearThinkingTimer();
          const latencyMs = Date.now() - startedAtMs;
          const nextText =
            response.status === "ok" && response.guide.text.trim().length > 0
              ? response.guide.text.trim()
              : fallbackTemplateText;

          if (
            !isGuideEventStillRelevant(
              selectedEvent,
              guideMode,
              pathname,
              activeTab,
              lastSectionIdRef.current
            )
          ) {
            return;
          }

          speechHoldMs = estimateSpeechHoldMs(nextText);
          shouldPinToAnchorAfterSpeech = true;
          pinText = nextText;
          streamBubbleText(nextText, turnToken);
          setAction(actionForTrigger(selectedEvent.type, guideMode));
          window.setTimeout(() => setAction("idle"), 1800);

          recentGuideMessagesRef.current = appendRecentGuideMessage(
            recentGuideMessagesRef.current,
            nextText
          );
          recentTriggerTypesRef.current = appendRecentTriggerType(
            recentTriggerTypesRef.current,
            selectedEvent.type
          );
          persistGuideSessionState(Date.now());

          if (process.env.NODE_ENV !== "production") {
            console.debug("[mascot-guide-tour]", {
              step: activeTourStepId,
              triggerType: selectedEvent.type,
              mode: guideMode,
              latencyMs,
              provider:
                response.status === "ok" ? response.meta.providerId : "template",
            });
          }
        })
        .finally(() => {
          const finalizeTurn = () => {
            clearThinkingTimer();
            if (tourPrefetchRef.current?.eventId === selectedEvent.eventId) {
              clearTourPrefetch();
            }
            if (shouldPinToAnchorAfterSpeech && pinText) {
              pinMascotAtGuideAnchor(selectedEvent, pinText);
            } else {
              clearPostSpeechAnchorHold();
            }
            activeGuideEventRef.current = null;
            setProcessingGuide(false);
            setMotionState("speech_ended", Date.now());
          };

          if (speechHoldMs > 0) {
            clearSpeechReleaseTimer();
            speechReleaseTimerRef.current = window.setTimeout(() => {
              speechReleaseTimerRef.current = null;
              finalizeTurn();
            }, speechHoldMs);
            return;
          }

          finalizeTurn();
        });

      return;
    }

    const prefetched = tourPrefetchRef.current;
    const hasPrefetchedForEvent = prefetched?.eventId === selectedEvent.eventId;
    const prefetchedStartedAtMs =
      hasPrefetchedForEvent && prefetched ? prefetched.startedAtMs : turnStartedAtMs;

    const turnInput: Parameters<typeof processGuideEventTurn>[0] = {
      trigger: selectedEvent,
      roleLens: activeLens,
      mode: guideMode,
      recentGuideMessages: recentGuideMessagesRef.current,
      recentTriggerTypes: recentTriggerTypesRef.current,
      cooldownSnapshot: cooldownSnapshotRef.current,
      nowMs: turnStartedAtMs,
      fetchGuide: async (request) => {
        if (hasPrefetchedForEvent && prefetched) {
          return prefetched.promise;
        }
        return fetchGuide(request);
      },
    };
    if (lastSectionIdRef.current) {
      turnInput.currentSectionId = lastSectionIdRef.current;
    }
    let speechHoldMs = 0;
    let shouldPinToAnchorAfterSpeech = false;
    let pinText = "";

    void processGuideEventTurn(turnInput)
      .then((result) => {
        if (activeTurnTokenRef.current !== turnToken) {
          return;
        }

        clearThinkingTimer();
        const latencyMs = Date.now() - prefetchedStartedAtMs;

        if (result.outcome === "shown" && result.guideText) {
          if (
            !isGuideEventStillRelevant(
              selectedEvent,
              guideMode,
              pathname,
              activeTab,
              lastSectionIdRef.current
            )
          ) {
            return;
          }

          cooldownSnapshotRef.current = result.cooldownSnapshot;
          recentGuideMessagesRef.current = result.recentGuideMessages;
          recentTriggerTypesRef.current = result.recentTriggerTypes;
          persistGuideSessionState(Date.now());

          speechHoldMs = estimateSpeechHoldMs(result.guideText);
          shouldPinToAnchorAfterSpeech = true;
          pinText = result.guideText;
          streamBubbleText(result.guideText, turnToken);

          const nextAction = actionForTrigger(selectedEvent.type, guideMode);
          setAction(nextAction);
          window.setTimeout(() => setAction("idle"), 1800);
        } else if (result.outcome === "suppressed_cooldown") {
          if (bubbleModeRef.current === "thinking") {
            setBubbleMode("idle");
            setBubbleOpen(false);
          }
          suppressedCountsRef.current.cooldown += 1;
        } else if (result.outcome === "suppressed_similarity") {
          if (bubbleModeRef.current === "thinking") {
            setBubbleMode("idle");
            setBubbleOpen(false);
          }
          suppressedCountsRef.current.similarity += 1;
        } else if (result.outcome === "failed") {
          suppressedCountsRef.current.failed += 1;
          if (
            !isGuideEventStillRelevant(
              selectedEvent,
              guideMode,
              pathname,
              activeTab,
              lastSectionIdRef.current
            )
          ) {
            return;
          }
          speechHoldMs = estimateSpeechHoldMs(templateText);
          shouldPinToAnchorAfterSpeech = true;
          pinText = templateText;
          streamBubbleText(templateText, turnToken);
          setAction(actionForTrigger(selectedEvent.type, guideMode));
          window.setTimeout(() => setAction("idle"), 1800);
          recentGuideMessagesRef.current = appendRecentGuideMessage(
            recentGuideMessagesRef.current,
            templateText
          );
          recentTriggerTypesRef.current = appendRecentTriggerType(
            recentTriggerTypesRef.current,
            selectedEvent.type
          );
          persistGuideSessionState(Date.now());
        }

        if (process.env.NODE_ENV !== "production") {
          const telemetryInput: Parameters<typeof buildGuideTelemetryPayload>[0] = {
            trigger: selectedEvent,
            roleLens: activeLens,
            outcome: result.outcome,
            latencyMs,
          };
          if (result.suppressionReason) {
            telemetryInput.suppressionReason = result.suppressionReason;
          }
          if (typeof result.similarityScore === "number") {
            telemetryInput.similarityScore = result.similarityScore;
          }

          const telemetryPayload = buildGuideTelemetryPayload(telemetryInput);

          console.debug("[mascot-guide]", {
            ...telemetryPayload,
            movementState,
            suppressedCounts: suppressedCountsRef.current,
          });
        }
      })
      .finally(() => {
        const finalizeTurn = () => {
          clearThinkingTimer();
          if (tourPrefetchRef.current?.eventId === selectedEvent.eventId) {
            clearTourPrefetch();
          }
          if (shouldPinToAnchorAfterSpeech && pinText) {
            pinMascotAtGuideAnchor(selectedEvent, pinText);
          } else {
            clearPostSpeechAnchorHold();
          }
          activeGuideEventRef.current = null;
          setProcessingGuide(false);
          setMotionState("speech_ended", Date.now());
        };

        if (speechHoldMs > 0) {
          clearSpeechReleaseTimer();
          speechReleaseTimerRef.current = window.setTimeout(() => {
            speechReleaseTimerRef.current = null;
            finalizeTurn();
          }, speechHoldMs);
          return;
        }

        finalizeTurn();
      });
  }, [
    activeLens,
    activeTab,
    collapsed,
    clearThinkingTimer,
    clearSpeechReleaseTimer,
    clearTourPrefetch,
    clearPostSpeechAnchorHold,
    fetchGuide,
    orchestratorMode,
    pathname,
    pinMascotAtGuideAnchor,
    quietMode,
    scheduleThinkingBubble,
    movementState,
    pausedOnRoute,
    persistGuideSessionState,
    processingGuide,
    setMotionState,
    streamBubbleText,
    tourProgress,
  ]);

  useEffect(() => {
    if (!bubbleOpen || bubbleMode !== "visible") {
      return;
    }
    if (
      pausedOnRoute ||
      collapsed ||
      processingGuide ||
      activeGuideEventRef.current ||
      !shouldProcessStalkerSpeech(orchestratorMode)
    ) {
      return;
    }

    const id = window.setTimeout(() => {
      if (
        processingGuideRef.current ||
        activeGuideEventRef.current ||
        routePausedRef.current ||
        collapsedRef.current ||
        !shouldProcessStalkerSpeech(orchestratorModeRef.current)
      ) {
        return;
      }
      setBubbleMode("idle");
      setBubbleOpen(false);
    }, BUBBLE_IDLE_CLOSE_MS);

    return () => window.clearTimeout(id);
  }, [
    bubbleMode,
    bubbleOpen,
    collapsed,
    orchestratorMode,
    pausedOnRoute,
    processingGuide,
  ]);

  const handleInteract = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (collapsed) {
      setCollapsed(false);
    }
    setBubbleMode("visible");
    setBubbleOpen(true);
    if (!bubbleText || bubbleText.trim().length === 0) {
      setBubbleText(INTERACT_FALLBACK_LINE);
    }
    setAction("talk");
    window.setTimeout(() => setAction("idle"), 1800);
  }, [bubbleText, collapsed]);

  const navigateTourStep = useCallback(
    (stepId: TourStepId) => {
      if (typeof window === "undefined") {
        return;
      }

      const scrollToStep = () => {
        if (stepId === "hero") {
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        const domIdByStep: Record<Exclude<TourStepId, "hero">, string> = {
          why_me: "why-me",
          projects: "projects",
          experience: "experience",
          contact: "contact",
        };
        const targetId = domIdByStep[stepId];
        const section = document.getElementById(targetId);
        if (section instanceof HTMLElement) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
          return;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      const targetTab = parseHomeTab(getTourTabForStep(stepId));
      if (targetTab === activeTab) {
        scrollToStep();
        return;
      }

      suppressNextTabSyncRef.current = true;
      router.push(buildHomeTabHref(targetTab, activeLens) as Route);
      window.setTimeout(scrollToStep, 220);
    },
    [activeLens, activeTab, router]
  );

  const handleNextTourStep = useCallback(() => {
    const activeStep = getActiveTourStep(tourProgressRef.current);
    if (!activeStep) {
      return;
    }

    const nextStep = getNextTourStep(activeStep);
    if (!nextStep) {
      setTourProgress((previous) => completeActiveTourStep(previous));
      return;
    }

    setTourProgress((previous) => advanceTourStep(previous));
    navigateTourStep(nextStep);
  }, [navigateTourStep]);

  const handleSkipTour = useCallback(() => {
    setTourProgress((previous) => skipTour(previous));
  }, []);

  const handleStartTour = useCallback(() => {
    clearIntroTimers();
    introStartedRef.current = true;
    introCompletedRef.current = true;
    hasUserInteractedRef.current = true;
    clearThinkingTimer();
    clearTypingTimer();
    clearTourPrefetch();
    activeTurnTokenRef.current += 1;
    activeGuideEventRef.current = null;
    clearPostSpeechAnchorHold();
    lastSpokenTourStepRef.current = null;
    setPendingEvents([]);
    setProcessingGuide(false);
    setTourProgress((previous) => startTour(previous));
    navigateTourStep("hero");
    setBubbleMode("visible");
    setBubbleOpen(true);
    setMotionState("force_idle", Date.now());
  }, [
    clearThinkingTimer,
    clearTypingTimer,
    clearTourPrefetch,
    clearPostSpeechAnchorHold,
    clearIntroTimers,
    navigateTourStep,
    setMotionState,
  ]);

  if (pathname.startsWith("/agent")) {
    return null;
  }

  const isTourMode = orchestratorMode === "tour";
  const canReplayTour = tourProgress.status === "completed" || tourProgress.status === "skipped";
  const displayText =
    bubbleText && bubbleText.trim().length > 0
      ? bubbleText
      : isTourMode
        ? "Tour mode is active. Use Next to move through the walkthrough."
        : INTERACT_FALLBACK_LINE;
  const bubbleVisible = bubbleOpen && !collapsed && !pausedOnRoute;

  return (
    <div className={styles.viewport}>
      <span
        aria-hidden
        data-mascot-anchor="rest_corner"
        className={styles.restAnchor}
      />
      <div
        ref={sceneRef}
        className={`${styles.scene} ${collapsed ? styles.collapsed : ""}`}
      >
        <button
          type="button"
          aria-label="Interact with Tazou.exe"
          className={styles.spriteButton}
          onClick={handleInteract}
        >
          <canvas
            ref={canvasRef}
            width={SPRITE_PIXEL_WIDTH}
            height={SPRITE_PIXEL_HEIGHT}
            className={styles.sprite}
            aria-hidden
          />
        </button>

        <aside
          className={`${styles.bubble} ${bubbleVisible ? "" : styles.bubbleHidden}`}
          role="status"
          aria-live="polite"
        >
          <p className={styles.bubbleHeader}>
            &gt; Tazou.exe
          </p>
          <p className={styles.bubbleText}>{displayText}</p>
          <div className={styles.bubbleActions}>
            <Link
              href={twinLink}
              data-mascot-anchor="twin_entry_button_mascot"
              className={styles.bubbleLink}
            >
              Open Twin Chat
            </Link>
            {isTourMode ? (
              <>
                <button
                  type="button"
                  className={styles.bubbleButton}
                  onClick={handleNextTourStep}
                  aria-label="Go to guided section"
                >
                  Next
                </button>
                <button
                  type="button"
                  className={styles.bubbleButton}
                  onClick={handleSkipTour}
                  aria-label="Skip guided tour"
                >
                  Skip tour
                </button>
              </>
            ) : null}
            {!isTourMode ? (
              <button
                type="button"
                className={styles.bubbleButton}
                onClick={handleStartTour}
                aria-label={canReplayTour ? "Replay guided tour" : "Start guided tour"}
              >
                {canReplayTour ? "Replay tour" : "Start Tour"}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.bubbleButton}
              onClick={() => setQuietMode((previous) => !previous)}
              aria-pressed={quietMode}
              aria-label={
                quietMode ? "Disable quiet mode" : "Enable quiet mode"
              }
            >
              Quiet {quietMode ? "On" : "Off"}
            </button>
            <button
              type="button"
              className={styles.bubbleButton}
              onClick={() => setCollapsed(true)}
              aria-label="Minimize mascot"
            >
              ×
            </button>
          </div>
        </aside>

        {collapsed && (
          <button
            type="button"
            className={styles.reopen}
            onClick={() => setCollapsed(false)}
            aria-label="Reopen Tazou.exe"
          >
            ⦿
          </button>
        )}
      </div>
    </div>
  );
}
