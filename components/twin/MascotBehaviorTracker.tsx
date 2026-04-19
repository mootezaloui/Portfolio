"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  MASCOT_RAIL_FOCUS_EVENT,
  type MascotRailFocusEventDetail,
} from "@/components/layout/OnThisPageRail";
import { parseRoleLens } from "@/lib/lens/roleLens";
import { parseHomeTab, type HomeTab } from "@/lib/navigation/homeTabs";
import {
  enqueueBehaviorEvent,
  getBehaviorSessionId,
} from "@/lib/twin/guide/clientStore";
import {
  getDomIdForSection,
  getSectionIdFromDomId,
  SECTION_IDS,
  sectionDwellMs,
  sectionObserverThreshold,
  tabChangeOverviewSuppressionMs,
  type LensSwitchPayload,
  type ProjectOpenPayload,
  type RailFocusPayload,
  type RouteChangePayload,
  type SectionId,
  type TabChangePayload,
} from "@/lib/twin/guide/contracts";
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
  type SectionDwellState,
  type SectionVisibilitySnapshot,
} from "@/lib/twin/guide/trackerLogic";

function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `behavior-${crypto.randomUUID()}`;
  }
  return `behavior-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function MascotBehaviorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "";
  const activeTab: HomeTab = parseHomeTab(rawTab);
  const roleLens = parseRoleLens(searchParams.get("lens"));
  const sessionId = useMemo(() => getBehaviorSessionId(), []);

  const previousPathRef = useRef<string | null>(null);
  const previousLensRef = useRef<typeof roleLens | null>(null);
  const previousTabRef = useRef<HomeTab | null>(null);
  const lastDirectProjectSlugRef = useRef<string | null>(null);
  const dwellStateRef = useRef<SectionDwellState>(INITIAL_SECTION_DWELL_STATE);
  const visibilityRef = useRef<Map<SectionId, number>>(new Map());
  const lastTabChangeAtMsRef = useRef(0);
  const lastRailFocusIdRef = useRef<string | null>(null);
  const activeTabRef = useRef<HomeTab>(activeTab);

  const createCommonEventFields = useCallback(
    () => ({
      eventId: createEventId(),
      occurredAtMs: Date.now(),
      sessionId,
      pathname,
      roleLens,
    }),
    [pathname, roleLens, sessionId]
  );

  const emitRouteChange = useCallback(
    (payload: RouteChangePayload): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "route_change",
        ...payload,
      });
    },
    [createCommonEventFields]
  );

  const emitLensSwitch = useCallback(
    (payload: LensSwitchPayload): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "lens_switch",
        ...payload,
      });
    },
    [createCommonEventFields]
  );

  const emitProjectOpen = useCallback(
    (payload: ProjectOpenPayload): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "project_open",
        ...payload,
      });
    },
    [createCommonEventFields]
  );

  const emitSectionEnter = useCallback(
    (sectionId: SectionId): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "section_enter",
        sectionId,
      });
    },
    [createCommonEventFields]
  );

  const emitTabChange = useCallback(
    (payload: TabChangePayload): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "tab_change",
        ...payload,
      });
    },
    [createCommonEventFields]
  );

  const emitRailFocus = useCallback(
    (payload: RailFocusPayload): void => {
      enqueueBehaviorEvent({
        ...createCommonEventFields(),
        type: "rail_focus",
        ...payload,
      });
    },
    [createCommonEventFields]
  );

  useEffect(() => {
    const routePayload = getRouteChangePayload(previousPathRef.current, pathname);
    if (routePayload) {
      emitRouteChange(routePayload);
    }

    const lensPayload = getLensSwitchPayload(previousLensRef.current, roleLens);
    if (lensPayload) {
      emitLensSwitch(lensPayload);
    }

    previousPathRef.current = pathname;
    previousLensRef.current = roleLens;
  }, [pathname, roleLens, emitLensSwitch, emitRouteChange]);

  useEffect(() => {
    activeTabRef.current = activeTab;

    const payload = getTabChangePayload({
      pathname,
      previousTab: previousTabRef.current,
      activeTab,
    });

    previousTabRef.current = activeTab;

    if (!payload) {
      return;
    }

    lastTabChangeAtMsRef.current = Date.now();
    lastRailFocusIdRef.current = "overview";
    emitTabChange(payload);
  }, [activeTab, emitTabChange, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleRailFocus = (event: Event) => {
      const detail = (event as CustomEvent<MascotRailFocusEventDetail>).detail;
      if (!detail || typeof detail.id !== "string") {
        return;
      }

      const result = evaluateRailFocusGuard({
        detailId: detail.id,
        detailSource: detail.source,
        nowMs: Date.now(),
        lastTabChangeAtMs: lastTabChangeAtMsRef.current,
        lastRailFocusId: lastRailFocusIdRef.current,
        tabChangeSuppressionMs: tabChangeOverviewSuppressionMs,
      });

      if (result.decision === "drop_invalid_id") {
        return;
      }

      if (result.decision === "drop_duplicate") {
        return;
      }

      if (result.decision === "drop_overview_after_tab_change") {
        lastRailFocusIdRef.current = result.nextLastFocusId;
        return;
      }

      lastRailFocusIdRef.current = result.nextLastFocusId;
      emitRailFocus({
        tab: activeTabRef.current,
        focusId: result.focusId,
        source: result.source,
      });
    };

    window.addEventListener(MASCOT_RAIL_FOCUS_EVENT, handleRailFocus);
    return () => {
      window.removeEventListener(MASCOT_RAIL_FOCUS_EVENT, handleRailFocus);
    };
  }, [emitRailFocus]);

  useEffect(() => {
    const projectSlug = extractProjectSlugFromPath(pathname);
    if (!projectSlug) {
      lastDirectProjectSlugRef.current = null;
      return;
    }

    if (lastDirectProjectSlugRef.current === projectSlug) {
      return;
    }

    const emitDirectProjectOpen = () => {
      const heading = document.querySelector("main h1")?.textContent ?? null;
      const payload = normalizeProjectOpenPayload({
        projectSlugAttr: projectSlug,
        projectTitleAttr: heading,
        pathname,
      });

      if (!payload) {
        return;
      }

      emitProjectOpen(payload);
      lastDirectProjectSlugRef.current = payload.projectSlug;
    };

    const timeoutId = window.setTimeout(emitDirectProjectOpen, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, emitProjectOpen]);

  useEffect(() => {
    dwellStateRef.current = INITIAL_SECTION_DWELL_STATE;
    visibilityRef.current = new Map();

    const observedSections = SECTION_IDS.map((sectionId) => ({
      sectionId,
      element: document.getElementById(getDomIdForSection(sectionId)),
    })).filter(
      (
        entry
      ): entry is {
        sectionId: SectionId;
        element: HTMLElement;
      } => entry.element instanceof HTMLElement
    );

    if (observedSections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = getSectionIdFromDomId(entry.target.id);
          if (!sectionId) {
            continue;
          }
          visibilityRef.current.set(
            sectionId,
            entry.isIntersecting ? entry.intersectionRatio : 0
          );
        }

        const snapshots: SectionVisibilitySnapshot[] = SECTION_IDS.map(
          (sectionId) => {
            const intersectionRatio = visibilityRef.current.get(sectionId) ?? 0;
            return {
              sectionId,
              intersectionRatio,
              isIntersecting: intersectionRatio > 0,
            };
          }
        );

        let candidateSectionId = selectSectionCandidate(
          snapshots,
          sectionObserverThreshold
        );

        const activeSectionId = dwellStateRef.current.activeSectionId;
        if (activeSectionId) {
          const activeRatio = visibilityRef.current.get(activeSectionId) ?? 0;
          const stickinessThreshold = Math.max(0.28, sectionObserverThreshold - 0.14);
          if (activeRatio >= stickinessThreshold) {
            candidateSectionId = activeSectionId;
          }
        }

        const evaluation = evaluateSectionDwell(
          dwellStateRef.current,
          candidateSectionId,
          Date.now(),
          sectionDwellMs
        );

        dwellStateRef.current = evaluation.nextState;

        if (evaluation.emitSectionId) {
          emitSectionEnter(evaluation.emitSectionId);
        }
      },
      {
        threshold: [0, 0.25, sectionObserverThreshold, 0.75, 1],
      }
    );

    for (const { element } of observedSections) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [activeTab, emitSectionEnter]);

  useEffect(() => {
    const handleProjectClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[data-mascot-project-slug]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const payload = normalizeProjectOpenPayload({
        projectSlugAttr: anchor.dataset.mascotProjectSlug ?? null,
        projectTitleAttr: anchor.dataset.mascotProjectTitle ?? null,
        href: anchor.getAttribute("href"),
        textContent: anchor.textContent,
      });

      if (!payload) {
        return;
      }

      emitProjectOpen(payload);
    };

    document.addEventListener("click", handleProjectClick);
    return () => document.removeEventListener("click", handleProjectClick);
  }, [emitProjectOpen]);

  return null;
}
