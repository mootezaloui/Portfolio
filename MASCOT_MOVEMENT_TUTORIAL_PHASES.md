# Mascot Movement Tutorial Plan

## Purpose

Evolve mascot motion from fixed bottom-corner presence to controlled tutorial-style movement that points users to relevant UI areas without becoming distracting.

## Core Requirements

- Movement must be intentional and tied to interaction context.
- Mascot should guide attention (section, project card, action button) with clear but limited motion.
- Avoid "flying bug" behavior: no constant wandering.
- Respect accessibility preferences (`prefers-reduced-motion`) and mobile constraints.

## Scope

- In scope:
  - Anchor-based movement system mapped to key interface regions.
  - Motion state machine with throttle/cooldown.
  - Lightweight "point and explain" choreography.
  - Route-aware fallback position handling.
- Out of scope:
  - Continuous freeform path animation.
  - Heavy game-like character controller.

## Target Movement Model

1. `Anchor Map`
   - Define visual anchors per route and section (hero, projects grid, experience timeline, twin entry button).
2. `Motion State Machine`
   - `idle`, `relocating`, `pointing`, `speaking`, `returning`.
3. `Trigger-to-Anchor Resolver`
   - Maps behavior events to nearest anchor target.
4. `Choreography Rules`
   - Move -> settle -> point cue -> bubble explanation.
5. `Safety Limits`
   - Minimum dwell before next move.
   - Max moves per minute.
   - Disable or simplify motion for reduced-motion users.

## Phase Plan

### Phase 0 - Anchor and Motion Contracts

- [x] Define `MascotAnchorId` and `AnchorRegistry` structure.
- [x] Define `MascotMotionState` and allowed transitions.
- [x] Define movement constraints (`maxDistance`, `snapThreshold`, `minDwellMs`).
- [x] Add docs for motion behavior on desktop vs mobile.

Definition of done:

- [x] Anchor and state contracts are explicit and versioned in code docs.
- [x] No ambiguous transition paths in motion state machine.

Phase 0 implementation notes:

- Contracts live in `lib/twin/movement/contracts.ts` with `MASCOT_MOVEMENT_CONTRACT_VERSION = "phase0-v1"`.
- Determinism and transition coverage validated in `tests/twin/movement-contracts.test.ts`.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`.

### Phase 1 - UI Anchor Instrumentation

- [x] Add stable data attributes for anchor targets on key sections and controls.
- [x] Register anchors at runtime with bounding boxes.
- [x] Handle responsive layout changes and re-measure anchors on resize.
- [x] Add visibility checks so mascot does not move to off-screen anchors.

Definition of done:

- [x] Mascot can resolve valid on-screen coordinates for all primary sections.
- [x] Anchor lookup remains stable across viewport sizes.

Phase 1 implementation notes:

- Added stable `data-mascot-anchor` attributes across hero/sections/project/twin-entry controls and mascot rest corner.
- Added runtime anchor measurement + indexing in `TwinMascot` with resize/orientation/scroll + `ResizeObserver` re-measure scheduling.
- Added anchor resolver module `lib/twin/movement/anchors.ts` with route matching, viewport compatibility, visibility ratio, and safe-screen filtering.
- Added tests in `tests/twin/movement-anchors.test.ts` for off-screen suppression and desktop/mobile stability.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`.

### Phase 2 - Movement Engine

- [x] Implement interpolation-based movement loop in `TwinMascot` (no jitter).
- [x] Add easing presets for calm tutorial-style motion.
- [x] Add pointing stance/action once mascot reaches target.
- [x] Add return-to-rest behavior when no active guidance trigger exists.

Definition of done:

- [x] Motion appears deliberate and readable.
- [x] Mascot never oscillates rapidly between anchors.

Phase 2 implementation notes:

- Added movement engine helpers in `lib/twin/movement/engine.ts` (interpolation, easing presets, dwell-gated anchor switching, route-aware preferred anchor selection, viewport clamping).
- Integrated movement state machine + anchor-driven position updates in `components/twin/TwinMascot.tsx` using `idle -> relocating -> pointing -> speaking -> returning`.
- Added explicit pointing cue timing (`POINTING_CUE_MS`) and motion action overrides (walk while relocating/returning, standup while pointing).
- Added rest anchor element + absolute scene positioning updates in `components/twin/TwinMascot.module.css` and `TwinMascot.tsx`.
- Added pure tests in `tests/twin/movement-engine.test.ts` for interpolation, switch gating, preferred anchor resolution, and clamping.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`, `npm run build`.

### Phase 3 - Behavior Integration

- [x] Connect motion engine to behavior events from guide system.
- [x] Prioritize target selection (project_open > section_enter > idle).
- [x] Couple movement with speech timing (speak after settle, not during transit).
- [x] Add suppression if user is actively typing in twin panel.

Definition of done:

- [x] Mascot movement and narration feel synchronized.
- [x] Important user interactions are not interrupted by motion jumps.

Phase 3 implementation notes:

- Split mascot behavior flow into two phases in `TwinMascot`: (1) select highest-priority behavior event, (2) generate speech only after movement reaches `speaking` state.
- Motion anchor targeting now uses active behavior trigger context (project-open and section-enter first), via `resolvePreferredAnchorId(...trigger)` in `lib/twin/movement/engine.ts`.
- Added explicit speech gating helper `shouldStartGuideSpeech` so narration cannot start during `relocating`/`pointing`.
- Added typing suppression gate (2.2s rolling window) for twin panel input activity, preventing movement/narration interruptions while typing.
- Added twin panel/input markers (`data-twin-panel`, `data-twin-input`) to support robust suppression detection.
- Added/updated pure engine tests in `tests/twin/movement-engine.test.ts` for trigger-driven anchor preference and speech gating.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`, `npm run build`.

### Phase 4 - UX Safeguards and Accessibility

- [x] Add global "quiet mode" toggle (minimal movement).
- [x] Respect `prefers-reduced-motion` with static or fade-only transitions.
- [x] Add mobile mode with reduced travel radius and fewer movement triggers.
- [x] Ensure mascot never blocks critical CTA/button hit areas.

Definition of done:

- [x] Movement is accessible and non-intrusive across devices.
- [x] User can reduce mascot motion without disabling mascot completely.

Phase 4 implementation notes:

- Added persistent quiet mode (`localStorage`) in `TwinMascot` with an inline toggle (`Quiet On/Off`) that keeps mascot guidance active while suppressing relocation.
- Updated reduced-motion behavior to static guidance mode: mascot no longer relocates when `prefers-reduced-motion` is active, but guide speech still triggers in-place.
- Added trigger-level movement policy in `lib/twin/movement/engine.ts`:
  - desktop: all behavior triggers can relocate;
  - mobile: relocation is limited to `project_open` and `section_enter`;
  - quiet/reduced-motion: relocation suppressed.
- Added mobile travel-radius clamp so mascot movement remains within the mobile constraint profile around rest anchor.
- Added safe scene placement resolver to avoid overlap with protected CTA zones (`twin_entry_button`, `project_primary_case`) before applying scene transforms.
- Extended `tests/twin/movement-engine.test.ts` with Phase 4 coverage for trigger policy, travel-radius clamp, safe placement anti-overlap, and static speech gate behavior.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`.

### Phase 5 - Testing and Calibration

- [x] Add unit tests for state transitions and cooldown limits.
- [x] Add integration tests for anchor resolution after route/section changes.
- [x] Add visual QA checklist for overlap/collision with UI components.
- [x] Tune motion timing and distance based on usability feedback.

Definition of done:

- [x] Movement system is stable, test-covered, and production-safe.
- [x] Mascot guidance improves orientation without annoying the user.

Phase 5 implementation notes:

- Added movement rate-limit helper `applyMoveRateLimit` in `lib/twin/movement/engine.ts` and integrated it in `TwinMascot` anchor switching to enforce `maxMovesPerMinute` while still allowing return-to-rest.
- Expanded movement unit coverage:
  - `tests/twin/movement-contracts.test.ts`: canonical state path assertions (`idle -> relocating -> pointing -> speaking -> returning -> idle`) and stricter constraint bounds.
  - `tests/twin/movement-engine.test.ts`: move-rate cooldown saturation + one-minute recovery assertions.
- Added integration test `tests/twin/movement-flow-integration.test.ts` to validate anchor resolution after section transitions and route transitions.
- Added `MASCOT_MOVEMENT_QA_CHECKLIST.md` with automated coverage checks and repeatable manual visual overlap/collision pass criteria.
- Tuned motion constraints for calmer behavior:
  - desktop: `maxDistancePx 560`, `snapThresholdPx 18`, `minDwellMs 3200`, `maxMovesPerMinute 5`.
  - mobile: `maxDistancePx 220`, `snapThresholdPx 14`, `minDwellMs 4600`, `maxMovesPerMinute 3`.
- Validation gates passed: `npm run typecheck`, `npm run test:twin`, `npm run lint`.

### Phase 6 - Guided Tour Redesign (Hybrid + Deterministic Core)

- [x] Introduce explicit orchestrator modes: `tour`, `reactive`, `paused`.
- [x] Add persistent first-run tour progress (`not_started`, `running`, `completed`, `skipped`) with replay control.
- [x] Implement deterministic core tour stops (`hero -> why_me -> projects -> experience -> contact`) with user-driven controls.
- [x] Enforce tour precedence over reactive queue until complete/skip.
- [x] Add section canonicalization (`about` contract maps to `why-me` DOM id) in tracker and resolver flow.
- [x] Replace ambiguous anchor ids with route/context-specific ids for twin-entry and project CTAs.
- [x] Add template-first bubble generation for tour/reactive guidance with optional LLM polish.
- [x] Ensure fallback behavior is deterministic when provider/validator paths fail.
- [x] Keep movement tour-targeted (active step anchor), not random oscillation.

Definition of done:

- [x] First visit runs deterministic tour once, then resumes reactive guidance.
- [x] Bubble output is contextual and stable (non-random) under repeated interactions.
- [x] Mascot follows active tour anchors and no longer collapses to simple A/B oscillation.
- [x] Replay control restarts tour deterministically without breaking reactive flow.

Phase 6 implementation notes:

- Tour state machine + persistence implemented in `lib/twin/guide/tour.ts`.
- Orchestration and UI controls integrated in `components/twin/TwinMascot.tsx` (`Next`, `Skip tour`, `Replay tour`).
- Section canonicalization implemented via `SECTION_DOM_ID_MAP` in `lib/twin/guide/contracts.ts` and consumed by `components/twin/MascotBehaviorTracker.tsx`.
- Anchor disambiguation integrated in `lib/twin/movement/contracts.ts`, `lib/twin/movement/engine.ts`, and section/page anchor attributes.
- Template-first generation wired in `lib/twin/guide/chat.ts` + `lib/twin/guide/prompt.ts`; local fallback updated in `lib/twin/providers/local.ts`.
- Validation gates for this redesign pass on current branch: `npm run test:twin`, `npm run lint`.
