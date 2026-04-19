import {
  DEFAULT_ANCHOR_REGISTRY,
  type AnchorRegistry,
  type AnchorRegistryEntry,
  type MascotAnchorId,
  type MascotAnchorViewport,
} from "./contracts";

export const MASCOT_MOBILE_BREAKPOINT_PX = 768;

export interface ViewportMetrics {
  width: number;
  height: number;
}

export interface RectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface RuntimeAnchorSnapshot {
  id: MascotAnchorId;
  selector: string;
  routePattern: string;
  viewport: MascotAnchorViewport;
  priority: number;
  requiredVisibleRatio: number;
  safeInsetPx: number;
  bounds: RectLike;
  centerX: number;
  centerY: number;
  visibleRatio: number;
}

export interface CollectRuntimeAnchorsInput {
  pathname: string;
  viewport: ViewportMetrics;
  getRectBySelector: (selector: string) => RectLike | null;
  registry?: AnchorRegistry;
}

function sanitizeDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
}

export function detectViewport(width: number): MascotAnchorViewport {
  if (width <= MASCOT_MOBILE_BREAKPOINT_PX) {
    return "mobile";
  }
  return "desktop";
}

function isViewportCompatible(
  entryViewport: MascotAnchorViewport,
  activeViewport: MascotAnchorViewport
): boolean {
  if (entryViewport === activeViewport) {
    return true;
  }

  // Mobile can reuse desktop anchors when dedicated mobile anchors are absent.
  if (activeViewport === "mobile" && entryViewport === "desktop") {
    return true;
  }

  return false;
}

export function matchesRoutePattern(routePattern: string, pathname: string): boolean {
  if (routePattern === "*") {
    return true;
  }

  if (routePattern.endsWith("/*")) {
    const prefix = routePattern.slice(0, -1);
    return pathname.startsWith(prefix);
  }

  return routePattern === pathname;
}

export function computeVisibleRatio(
  bounds: RectLike,
  viewport: ViewportMetrics
): number {
  const viewportWidth = sanitizeDimension(viewport.width);
  const viewportHeight = sanitizeDimension(viewport.height);
  const targetWidth = sanitizeDimension(bounds.width);
  const targetHeight = sanitizeDimension(bounds.height);
  const targetArea = targetWidth * targetHeight;

  if (viewportWidth === 0 || viewportHeight === 0 || targetArea === 0) {
    return 0;
  }

  const intersectionLeft = Math.max(0, bounds.left);
  const intersectionTop = Math.max(0, bounds.top);
  const intersectionRight = Math.min(viewportWidth, bounds.right);
  const intersectionBottom = Math.min(viewportHeight, bounds.bottom);

  const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
  const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);
  const intersectionArea = intersectionWidth * intersectionHeight;

  if (intersectionArea === 0) {
    return 0;
  }

  return intersectionArea / targetArea;
}

export function isAnchorOnScreen(
  bounds: RectLike,
  viewport: ViewportMetrics,
  safeInsetPx: number
): boolean {
  const viewportWidth = sanitizeDimension(viewport.width);
  const viewportHeight = sanitizeDimension(viewport.height);
  if (viewportWidth === 0 || viewportHeight === 0) {
    return false;
  }

  const inset = Math.max(0, safeInsetPx);
  const safeLeft = inset;
  const safeTop = inset;
  const safeRight = viewportWidth - inset;
  const safeBottom = viewportHeight - inset;

  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;

  if (centerX < safeLeft || centerX > safeRight) {
    return false;
  }
  if (centerY < safeTop || centerY > safeBottom) {
    return false;
  }

  return true;
}

function buildRuntimeAnchorSnapshot(
  entry: AnchorRegistryEntry,
  bounds: RectLike,
  viewport: ViewportMetrics
): RuntimeAnchorSnapshot | null {
  const visibleRatio = computeVisibleRatio(bounds, viewport);
  if (visibleRatio < entry.requiredVisibleRatio) {
    return null;
  }

  if (!isAnchorOnScreen(bounds, viewport, entry.safeInsetPx)) {
    return null;
  }

  return {
    id: entry.id,
    selector: entry.selector,
    routePattern: entry.routePattern,
    viewport: entry.viewport,
    priority: entry.priority,
    requiredVisibleRatio: entry.requiredVisibleRatio,
    safeInsetPx: entry.safeInsetPx,
    bounds,
    centerX: bounds.left + bounds.width / 2,
    centerY: bounds.top + bounds.height / 2,
    visibleRatio,
  };
}

export function collectRuntimeAnchors(
  input: CollectRuntimeAnchorsInput
): RuntimeAnchorSnapshot[] {
  const registry = input.registry ?? DEFAULT_ANCHOR_REGISTRY;
  const activeViewport = detectViewport(input.viewport.width);
  const snapshots: RuntimeAnchorSnapshot[] = [];

  for (const entry of Object.values(registry)) {
    if (!isViewportCompatible(entry.viewport, activeViewport)) {
      continue;
    }

    if (!matchesRoutePattern(entry.routePattern, input.pathname)) {
      continue;
    }

    const bounds = input.getRectBySelector(entry.selector);
    if (!bounds) {
      continue;
    }

    const snapshot = buildRuntimeAnchorSnapshot(entry, bounds, input.viewport);
    if (!snapshot) {
      continue;
    }

    snapshots.push(snapshot);
  }

  snapshots.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return left.id.localeCompare(right.id);
  });

  return snapshots;
}

export function indexRuntimeAnchorsById(
  snapshots: readonly RuntimeAnchorSnapshot[]
): Partial<Record<MascotAnchorId, RuntimeAnchorSnapshot>> {
  const index: Partial<Record<MascotAnchorId, RuntimeAnchorSnapshot>> = {};

  for (const snapshot of snapshots) {
    index[snapshot.id] = snapshot;
  }

  return index;
}
