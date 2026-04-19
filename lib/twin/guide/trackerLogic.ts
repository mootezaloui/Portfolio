import type { RoleLens } from "../../lens/roleLens";
import type { HomeTab } from "../../navigation/homeTabs";

import {
  isRailFocusId,
  SECTION_IDS,
  type LensSwitchPayload,
  type RailFocusId,
  type RailFocusSource,
  type RouteChangePayload,
  type SectionId,
  type TabChangePayload,
} from "./contracts";

export interface SectionVisibilitySnapshot {
  sectionId: SectionId;
  intersectionRatio: number;
  isIntersecting: boolean;
}

export interface SectionDwellState {
  activeSectionId: SectionId | null;
  candidateSectionId: SectionId | null;
  candidateSinceMs: number | null;
}

export const INITIAL_SECTION_DWELL_STATE: SectionDwellState = {
  activeSectionId: null,
  candidateSectionId: null,
  candidateSinceMs: null,
};

export interface SectionDwellEvaluation {
  nextState: SectionDwellState;
  emitSectionId: SectionId | null;
}

const SECTION_ORDER_INDEX = new Map<SectionId, number>(
  SECTION_IDS.map((sectionId, index) => [sectionId, index])
);

function sectionOrder(sectionId: SectionId): number {
  return SECTION_ORDER_INDEX.get(sectionId) ?? Number.MAX_SAFE_INTEGER;
}

export function selectSectionCandidate(
  snapshots: SectionVisibilitySnapshot[],
  threshold: number
): SectionId | null {
  const candidates = snapshots
    .filter((snapshot) => snapshot.isIntersecting)
    .filter((snapshot) => snapshot.intersectionRatio >= threshold);

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => {
    if (right.intersectionRatio !== left.intersectionRatio) {
      return right.intersectionRatio - left.intersectionRatio;
    }
    return sectionOrder(left.sectionId) - sectionOrder(right.sectionId);
  });

  return candidates[0]?.sectionId ?? null;
}

export function evaluateSectionDwell(
  previousState: SectionDwellState,
  candidateSectionId: SectionId | null,
  nowMs: number,
  dwellMs: number
): SectionDwellEvaluation {
  if (!candidateSectionId) {
    return {
      nextState: {
        ...previousState,
        candidateSectionId: null,
        candidateSinceMs: null,
      },
      emitSectionId: null,
    };
  }

  if (previousState.activeSectionId === candidateSectionId) {
    return {
      nextState: {
        ...previousState,
        candidateSectionId,
        candidateSinceMs: previousState.candidateSinceMs ?? nowMs,
      },
      emitSectionId: null,
    };
  }

  if (previousState.candidateSectionId !== candidateSectionId) {
    return {
      nextState: {
        ...previousState,
        candidateSectionId,
        candidateSinceMs: nowMs,
      },
      emitSectionId: null,
    };
  }

  const candidateSince = previousState.candidateSinceMs ?? nowMs;
  if (nowMs - candidateSince < dwellMs) {
    return {
      nextState: {
        ...previousState,
        candidateSectionId,
        candidateSinceMs: candidateSince,
      },
      emitSectionId: null,
    };
  }

  return {
    nextState: {
      activeSectionId: candidateSectionId,
      candidateSectionId,
      candidateSinceMs: candidateSince,
    },
    emitSectionId: candidateSectionId,
  };
}

export function getRouteChangePayload(
  previousPath: string | null,
  nextPath: string
): RouteChangePayload | null {
  if (!previousPath || previousPath === nextPath) {
    return null;
  }

  return {
    fromPath: previousPath,
    toPath: nextPath,
  };
}

export function getLensSwitchPayload(
  previousLens: RoleLens | null,
  nextLens: RoleLens
): LensSwitchPayload | null {
  if (!previousLens || previousLens === nextLens) {
    return null;
  }

  return {
    fromLens: previousLens,
    toLens: nextLens,
  };
}

export interface TabChangeEvaluationInput {
  pathname: string;
  previousTab: HomeTab | null;
  activeTab: HomeTab;
}

export function getTabChangePayload(
  input: TabChangeEvaluationInput
): TabChangePayload | null {
  if (input.pathname !== "/") {
    return null;
  }
  if (!input.previousTab || input.previousTab === input.activeTab) {
    return null;
  }
  return {
    fromTab: input.previousTab,
    toTab: input.activeTab,
  };
}

export interface RailFocusGuardInput {
  detailId: string;
  detailSource: string;
  nowMs: number;
  lastTabChangeAtMs: number;
  lastRailFocusId: string | null;
  tabChangeSuppressionMs: number;
}

export type RailFocusGuardResult =
  | { decision: "drop_invalid_id" }
  | { decision: "drop_duplicate" }
  | {
      decision: "drop_overview_after_tab_change";
      nextLastFocusId: string;
    }
  | {
      decision: "emit";
      focusId: RailFocusId;
      source: RailFocusSource;
      nextLastFocusId: string;
    };

export function evaluateRailFocusGuard(
  input: RailFocusGuardInput
): RailFocusGuardResult {
  if (!isRailFocusId(input.detailId)) {
    return { decision: "drop_invalid_id" };
  }

  if (input.detailId === input.lastRailFocusId) {
    return { decision: "drop_duplicate" };
  }

  if (
    input.detailId === "overview" &&
    input.nowMs - input.lastTabChangeAtMs < input.tabChangeSuppressionMs
  ) {
    return {
      decision: "drop_overview_after_tab_change",
      nextLastFocusId: input.detailId,
    };
  }

  const source: RailFocusSource =
    input.detailSource === "click" ? "click" : "scroll";

  return {
    decision: "emit",
    focusId: input.detailId,
    source,
    nextLastFocusId: input.detailId,
  };
}

export function extractProjectSlugFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/projects/")) {
    return null;
  }

  const slug = pathname
    .slice("/projects/".length)
    .split("/")[0]
    ?.split("?")[0]
    ?.split("#")[0];
  if (!slug) {
    return null;
  }

  const decoded = decodeURIComponent(slug).trim();
  return decoded.length > 0 ? decoded : null;
}

export function slugToReadableTitle(slug: string): string {
  return slug
    .split("-")
    .filter((token) => token.length > 0)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

export interface ProjectOpenSource {
  projectSlugAttr?: string | null;
  projectTitleAttr?: string | null;
  href?: string | null;
  textContent?: string | null;
  pathname?: string | null;
}

export interface ProjectOpenNormalized {
  projectSlug: string;
  projectTitle: string;
}

export function normalizeProjectOpenPayload(
  source: ProjectOpenSource
): ProjectOpenNormalized | null {
  const fromAttr = source.projectSlugAttr?.trim();
  const fromHref = source.href ? extractProjectSlugFromPath(source.href) : null;
  const fromPath = source.pathname
    ? extractProjectSlugFromPath(source.pathname)
    : null;

  const projectSlug = fromAttr || fromHref || fromPath;
  if (!projectSlug) {
    return null;
  }

  const preferredTitle =
    source.projectTitleAttr?.trim() || source.textContent?.trim();
  const projectTitle =
    preferredTitle && preferredTitle.length > 0
      ? preferredTitle
      : slugToReadableTitle(projectSlug);

  return {
    projectSlug,
    projectTitle,
  };
}
