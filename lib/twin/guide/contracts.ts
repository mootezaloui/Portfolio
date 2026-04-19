import { z } from "zod";

import { ROLE_LENSES, type RoleLens } from "../../lens/roleLens";
import { HOME_TABS, type HomeTab } from "../../navigation/homeTabs";

export const MASCOT_BEHAVIOR_EVENT_TYPES = [
  "section_enter",
  "project_open",
  "lens_switch",
  "route_change",
  "idle_nudge",
  "tab_change",
  "rail_focus",
] as const;

export type MascotBehaviorEventType = (typeof MASCOT_BEHAVIOR_EVENT_TYPES)[number];

export const MascotBehaviorEventTypeSchema = z.enum(MASCOT_BEHAVIOR_EVENT_TYPES);

export const SECTION_IDS = [
  "about",
  "projects",
  "experience",
  "skills",
  "certifications",
  "contact",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SectionIdSchema = z.enum(SECTION_IDS);
export const RoleLensSchema = z.enum(ROLE_LENSES);
export const HomeTabSchema = z.enum(HOME_TABS);

export const RAIL_FOCUS_IDS = [
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

export type RailFocusId = (typeof RAIL_FOCUS_IDS)[number];
export const RailFocusIdSchema = z.enum(RAIL_FOCUS_IDS);

export const RAIL_FOCUS_SOURCES = ["click", "scroll"] as const;
export type RailFocusSource = (typeof RAIL_FOCUS_SOURCES)[number];
export const RailFocusSourceSchema = z.enum(RAIL_FOCUS_SOURCES);

export function isRailFocusId(value: string): value is RailFocusId {
  return (RAIL_FOCUS_IDS as readonly string[]).includes(value);
}

export const SECTION_DOM_ID_MAP: Record<SectionId, string> = {
  about: "why-me",
  projects: "projects",
  experience: "experience",
  skills: "skills",
  certifications: "certifications",
  contact: "contact",
};

const SECTION_DOM_ID_ENTRIES = Object.entries(SECTION_DOM_ID_MAP) as Array<
  [SectionId, string]
>;
const DOM_SECTION_ID_MAP = SECTION_DOM_ID_ENTRIES.reduce<
  Record<string, SectionId>
>((accumulator, [sectionId, domId]) => {
  accumulator[domId] = sectionId;
  return accumulator;
}, {});

export function getDomIdForSection(sectionId: SectionId): string {
  return SECTION_DOM_ID_MAP[sectionId];
}

export function getSectionIdFromDomId(domId: string): SectionId | null {
  const normalized = domId.trim();
  if (!normalized) {
    return null;
  }
  return DOM_SECTION_ID_MAP[normalized] ?? null;
}

export const MASCOT_GUIDE_MODES = ["tour", "reactive"] as const;
export type MascotGuideMode = (typeof MASCOT_GUIDE_MODES)[number];
export const MascotGuideModeSchema = z.enum(MASCOT_GUIDE_MODES);

export const TOUR_STEP_IDS = [
  "hero",
  "why_me",
  "projects",
  "experience",
  "contact",
] as const;
export type TourStepId = (typeof TOUR_STEP_IDS)[number];
export const TourStepIdSchema = z.enum(TOUR_STEP_IDS);

const MascotBehaviorEventBaseSchema = z
  .object({
    eventId: z.string().min(1),
    occurredAtMs: z.number().int().nonnegative(),
    sessionId: z.string().min(1),
    pathname: z.string().min(1),
    roleLens: RoleLensSchema,
  })
  .strict();

const SectionEnterEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("section_enter"),
  sectionId: SectionIdSchema,
}).strict();

const ProjectOpenEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("project_open"),
  projectSlug: z.string().min(1),
  projectTitle: z.string().min(1),
}).strict();

const LensSwitchEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("lens_switch"),
  fromLens: RoleLensSchema,
  toLens: RoleLensSchema,
}).strict();

const RouteChangeEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("route_change"),
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
}).strict();

const IdleNudgeEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("idle_nudge"),
  idleMs: z.number().int().nonnegative(),
  lastSectionId: SectionIdSchema.optional(),
}).strict();

const TabChangeEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("tab_change"),
  fromTab: HomeTabSchema,
  toTab: HomeTabSchema,
}).strict();

const RailFocusEventSchema = MascotBehaviorEventBaseSchema.extend({
  type: z.literal("rail_focus"),
  tab: HomeTabSchema,
  focusId: RailFocusIdSchema,
  source: RailFocusSourceSchema,
}).strict();

export const MascotBehaviorEventSchema = z.discriminatedUnion("type", [
  SectionEnterEventSchema,
  ProjectOpenEventSchema,
  LensSwitchEventSchema,
  RouteChangeEventSchema,
  IdleNudgeEventSchema,
  TabChangeEventSchema,
  RailFocusEventSchema,
]);

export type MascotBehaviorEvent = z.infer<typeof MascotBehaviorEventSchema>;

export const maxGuideChars = 220;
export const guideVoicePolicy = "first_person_mootez" as const;
export const guideTargetSentenceRange = {
  min: 1,
  max: 2,
} as const;

export const maxMessagesPerMinute = 4;
export const globalCooldownMs = 8_000;
export const behaviorQueueLimit = 30;
export const sectionObserverThreshold = 0.55;
export const sectionDwellMs = 600;

export const perTriggerCooldownMs: Record<MascotBehaviorEventType, number> = {
  project_open: 12_000,
  section_enter: 10_000,
  lens_switch: 10_000,
  route_change: 12_000,
  idle_nudge: 20_000,
  tab_change: 12_000,
  rail_focus: 9_000,
};

export const eventPriority: Record<MascotBehaviorEventType, number> = {
  project_open: 100,
  tab_change: 95,
  rail_focus: 85,
  section_enter: 80,
  lens_switch: 70,
  route_change: 50,
  idle_nudge: 20,
};

export const tabChangeOverviewSuppressionMs = 1_500;

const MascotGuideContextSchema = z
  .object({
    roleLens: RoleLensSchema,
    mode: MascotGuideModeSchema.optional(),
    activeTourStepId: TourStepIdSchema.optional(),
    currentSectionId: SectionIdSchema.optional(),
    recentGuideMessages: z.array(z.string()).max(3),
    recentTriggerTypes: z.array(MascotBehaviorEventTypeSchema).max(5),
    conversationId: z.string().min(1).optional(),
  })
  .strict();

export const MascotGuideRequestSchema = z
  .object({
    trigger: MascotBehaviorEventSchema,
    context: MascotGuideContextSchema,
  })
  .strict();

export type MascotGuideRequest = z.infer<typeof MascotGuideRequestSchema>;

const GuideClassificationDecisionSchema = z.enum([
  "in_scope",
  "out_of_scope",
  "ambiguous",
]);

const MascotGuideSuccessResponseSchema = z
  .object({
    status: z.literal("ok"),
    guide: z
      .object({
        id: z.string().min(1),
        text: z.string().min(1),
        tone: z.literal("guide"),
        triggerType: MascotBehaviorEventTypeSchema,
        roleLens: RoleLensSchema,
        charCount: z.number().int().min(0).max(maxGuideChars),
        generatedAt: z.number().int().nonnegative(),
      })
      .strict(),
    meta: z
      .object({
        providerId: z.string().min(1),
        providerModel: z.string().min(1),
        latencyMs: z.number().int().nonnegative(),
        cached: z.boolean(),
        classificationDecision: GuideClassificationDecisionSchema,
      })
      .strict(),
  })
  .strict();

const MascotGuideErrorResponseSchema = z
  .object({
    status: z.literal("error"),
    code: z.enum(["invalid_payload", "internal_error", "not_ready"]),
    message: z.string().min(1),
    issues: z.array(z.unknown()).optional(),
  })
  .strict();

export const MascotGuideResponseSchema = z.discriminatedUnion("status", [
  MascotGuideSuccessResponseSchema,
  MascotGuideErrorResponseSchema,
]);

export type MascotGuideResponse = z.infer<typeof MascotGuideResponseSchema>;
export type MascotGuideSuccessResponse = z.infer<
  typeof MascotGuideSuccessResponseSchema
>;
export type MascotGuideErrorResponse = z.infer<
  typeof MascotGuideErrorResponseSchema
>;

export interface ProjectOpenPayload {
  projectSlug: string;
  projectTitle: string;
}

export interface RouteChangePayload {
  fromPath: string;
  toPath: string;
}

export interface LensSwitchPayload {
  fromLens: RoleLens;
  toLens: RoleLens;
}

export interface TabChangePayload {
  fromTab: HomeTab;
  toTab: HomeTab;
}

export interface RailFocusPayload {
  tab: HomeTab;
  focusId: RailFocusId;
  source: RailFocusSource;
}
