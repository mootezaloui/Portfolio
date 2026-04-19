import { z } from "zod";

export const MASCOT_MOVEMENT_CONTRACT_VERSION = "phase0-v1";

export const MASCOT_ANCHOR_IDS = [
  "rest_corner",
  "hero_primary",
  "section_about",
  "section_projects",
  "section_experience",
  "section_skills",
  "section_certifications",
  "section_contact",
  "project_primary_case_home",
  "project_primary_case_page",
  "twin_entry_button_hero",
  "twin_entry_button_mascot",
] as const;

export type MascotAnchorId = (typeof MASCOT_ANCHOR_IDS)[number];

export const MascotAnchorIdSchema = z.enum(MASCOT_ANCHOR_IDS);

export const MASCOT_ANCHOR_VIEWPORTS = ["desktop", "mobile"] as const;
export type MascotAnchorViewport = (typeof MASCOT_ANCHOR_VIEWPORTS)[number];
export const MascotAnchorViewportSchema = z.enum(MASCOT_ANCHOR_VIEWPORTS);

export const AnchorRegistryEntrySchema = z
  .object({
    id: MascotAnchorIdSchema,
    selector: z.string().min(1),
    routePattern: z.string().min(1),
    viewport: MascotAnchorViewportSchema,
    priority: z.number().int().min(0).max(100),
    requiredVisibleRatio: z.number().min(0).max(1),
    safeInsetPx: z.number().int().nonnegative(),
  })
  .strict();

export type AnchorRegistryEntry = z.infer<typeof AnchorRegistryEntrySchema>;
export type AnchorRegistry = Record<MascotAnchorId, AnchorRegistryEntry>;

export function indexAnchorRegistryById(
  entries: readonly AnchorRegistryEntry[]
): Partial<Record<MascotAnchorId, AnchorRegistryEntry>> {
  const index: Partial<Record<MascotAnchorId, AnchorRegistryEntry>> = {};
  for (const entry of entries) {
    index[entry.id] = entry;
  }
  return index;
}

export const DEFAULT_ANCHOR_REGISTRY: AnchorRegistry = {
  rest_corner: {
    id: "rest_corner",
    selector: "[data-mascot-anchor='rest_corner']",
    routePattern: "*",
    viewport: "desktop",
    priority: 5,
    requiredVisibleRatio: 0,
    safeInsetPx: 24,
  },
  hero_primary: {
    id: "hero_primary",
    selector: "[data-mascot-anchor='hero_primary']",
    routePattern: "/",
    viewport: "desktop",
    priority: 40,
    requiredVisibleRatio: 0.45,
    safeInsetPx: 24,
  },
  section_about: {
    id: "section_about",
    selector: "#why-me",
    routePattern: "/",
    viewport: "desktop",
    priority: 60,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  section_projects: {
    id: "section_projects",
    selector: "#projects",
    routePattern: "/",
    viewport: "desktop",
    priority: 85,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  section_experience: {
    id: "section_experience",
    selector: "#experience",
    routePattern: "/",
    viewport: "desktop",
    priority: 80,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  section_skills: {
    id: "section_skills",
    selector: "#skills",
    routePattern: "/",
    viewport: "desktop",
    priority: 70,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  section_certifications: {
    id: "section_certifications",
    selector: "#certifications",
    routePattern: "/",
    viewport: "desktop",
    priority: 65,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  section_contact: {
    id: "section_contact",
    selector: "#contact",
    routePattern: "/",
    viewport: "desktop",
    priority: 75,
    requiredVisibleRatio: 0.55,
    safeInsetPx: 20,
  },
  project_primary_case_home: {
    id: "project_primary_case_home",
    selector: "[data-mascot-anchor='project_primary_case_home']",
    routePattern: "/",
    viewport: "desktop",
    priority: 100,
    requiredVisibleRatio: 0.5,
    safeInsetPx: 20,
  },
  project_primary_case_page: {
    id: "project_primary_case_page",
    selector: "[data-mascot-anchor='project_primary_case_page']",
    routePattern: "/projects/*",
    viewport: "desktop",
    priority: 100,
    requiredVisibleRatio: 0.35,
    safeInsetPx: 20,
  },
  twin_entry_button_hero: {
    id: "twin_entry_button_hero",
    selector: "[data-mascot-anchor='twin_entry_button_hero']",
    routePattern: "/",
    viewport: "desktop",
    priority: 50,
    requiredVisibleRatio: 0.35,
    safeInsetPx: 20,
  },
  twin_entry_button_mascot: {
    id: "twin_entry_button_mascot",
    selector: "[data-mascot-anchor='twin_entry_button_mascot']",
    routePattern: "*",
    viewport: "desktop",
    priority: 35,
    requiredVisibleRatio: 0,
    safeInsetPx: 20,
  },
};

export const MASCOT_MOTION_STATES = [
  "idle",
  "relocating",
  "pointing",
  "speaking",
  "returning",
] as const;

export type MascotMotionState = (typeof MASCOT_MOTION_STATES)[number];
export const MascotMotionStateSchema = z.enum(MASCOT_MOTION_STATES);

export const MASCOT_MOTION_TRIGGERS = [
  "target_acquired",
  "arrived_at_anchor",
  "point_cue_complete",
  "speech_started",
  "speech_ended",
  "guidance_cleared",
  "interrupt_new_target",
  "force_idle",
] as const;

export type MascotMotionTrigger = (typeof MASCOT_MOTION_TRIGGERS)[number];
export const MascotMotionTriggerSchema = z.enum(MASCOT_MOTION_TRIGGERS);

export type MotionTransitionTable = Record<
  MascotMotionState,
  Record<MascotMotionTrigger, MascotMotionState | null>
>;

export const MASCOT_MOTION_TRANSITIONS: MotionTransitionTable = {
  idle: {
    target_acquired: "relocating",
    arrived_at_anchor: null,
    point_cue_complete: null,
    speech_started: "speaking",
    speech_ended: null,
    guidance_cleared: null,
    interrupt_new_target: "relocating",
    force_idle: "idle",
  },
  relocating: {
    target_acquired: "relocating",
    arrived_at_anchor: "pointing",
    point_cue_complete: null,
    speech_started: null,
    speech_ended: null,
    guidance_cleared: "returning",
    interrupt_new_target: "relocating",
    force_idle: "idle",
  },
  pointing: {
    target_acquired: "relocating",
    arrived_at_anchor: null,
    point_cue_complete: "speaking",
    speech_started: "speaking",
    speech_ended: null,
    guidance_cleared: "returning",
    interrupt_new_target: "relocating",
    force_idle: "idle",
  },
  speaking: {
    target_acquired: "relocating",
    arrived_at_anchor: null,
    point_cue_complete: null,
    speech_started: "speaking",
    speech_ended: "returning",
    guidance_cleared: "returning",
    interrupt_new_target: "relocating",
    force_idle: "idle",
  },
  returning: {
    target_acquired: "relocating",
    arrived_at_anchor: "idle",
    point_cue_complete: null,
    speech_started: null,
    speech_ended: "idle",
    guidance_cleared: "idle",
    interrupt_new_target: "relocating",
    force_idle: "idle",
  },
};

export function resolveMotionTransition(
  from: MascotMotionState,
  trigger: MascotMotionTrigger
): MascotMotionState | null {
  return MASCOT_MOTION_TRANSITIONS[from][trigger];
}

export function getAllowedMotionTransitions(
  from: MascotMotionState
): MascotMotionState[] {
  const set = new Set<MascotMotionState>();
  for (const trigger of MASCOT_MOTION_TRIGGERS) {
    const next = MASCOT_MOTION_TRANSITIONS[from][trigger];
    if (next) {
      set.add(next);
    }
  }
  return [...set];
}

export interface MotionConstraintProfile {
  maxDistancePx: number;
  snapThresholdPx: number;
  minDwellMs: number;
  maxMovesPerMinute: number;
}

export const MASCOT_MOTION_CONSTRAINTS = {
  desktop: {
    maxDistancePx: 560,
    snapThresholdPx: 18,
    minDwellMs: 3200,
    maxMovesPerMinute: 5,
  },
  mobile: {
    maxDistancePx: 220,
    snapThresholdPx: 14,
    minDwellMs: 4600,
    maxMovesPerMinute: 3,
  },
  reducedMotion: {
    maxDistancePx: 0,
    snapThresholdPx: 0,
    minDwellMs: 5000,
    maxMovesPerMinute: 1,
  },
} as const satisfies Record<"desktop" | "mobile" | "reducedMotion", MotionConstraintProfile>;

export const MASCOT_MOVEMENT_PLATFORM_DOCS = {
  desktop: {
    summary:
      "Desktop uses full anchor travel with calm easing and bounded hop frequency.",
    behavior:
      "Mascot can relocate across major sections, but it must settle for at least minDwellMs before another move.",
  },
  mobile: {
    summary:
      "Mobile keeps movement local to avoid covering content and to reduce visual noise.",
    behavior:
      "Mascot uses a strict local travel radius, longer dwell, and fewer moves per minute; off-screen anchors must be ignored.",
  },
} as const satisfies Record<
  "desktop" | "mobile",
  { summary: string; behavior: string }
>;
