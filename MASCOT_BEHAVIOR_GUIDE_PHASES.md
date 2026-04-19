# Mascot Behavior Guide Plan

## Purpose
Turn the mascot into an adaptive guide that reacts to user behavior and explains portfolio content in natural, non-repetitive language.

## Core Requirements
- No static hardcoded explanation lines for section/project guidance.
- Explanations are generated from live context (section viewed, project clicked, lens, route, interaction history).
- Responses should feel like Mootez voice, scoped to portfolio evidence.
- The mascot should not spam; guidance must be intentional and sparse.

## Scope
- In scope:
  - Behavior tracking for page/section/project interactions.
  - Context-aware generation pipeline for mascot speech bubbles.
  - Cooldown and dedup logic to avoid repetitive guidance.
  - Integration with existing twin constraints and lens framing.
- Out of scope:
  - General assistant chat inside mascot bubble.
  - Unlimited autonomous speaking without user behavior triggers.

## Target Architecture
1. `Behavior Event Layer` (client)
   - Detect section entry, project detail open, lens change, idle dwell, and return visits.
2. `Narration Context Builder` (client/server)
   - Build compact context payload: route, lens, trigger type, visible entity, recent mascot messages.
3. `Guide Generation Endpoint` (server)
   - New route (for example `/api/twin/guide`) or a dedicated mode in existing twin route.
   - Uses corpus + scope policy + lens note.
4. `Speech Queue Controller` (client)
   - Schedules bubble updates, enforces cooldown, deduplicates similar messages.
5. `Guardrails`
   - Reuse twin scope contract and style constraints.
   - Hard cap response length for bubble readability.

## Phase Plan

### Phase 0 - Contracts and Data Model
- [x] Define `MascotBehaviorEvent` types (section_enter, project_open, experience_focus, lens_switch, etc.).
- [x] Define `MascotGuideRequest` and `MascotGuideResponse` schemas.
- [x] Define anti-spam policy (`cooldownMs`, `maxMessagesPerMinute`, `eventPriority`).
- [x] Add docs for supported triggers and expected response style.
- [x] Lock defaults for Phase 1A bootstrap:
  - voice: first-person Mootez
  - bubble size: short (`maxGuideChars = 220`, target 1-2 sentences)
  - trigger baseline: `section_enter`, `project_open`, `lens_switch`, `route_change`, `idle_nudge`
  - anti-spam constants: minute cap, global cooldown constant, per-trigger cooldown map, event priority map

Definition of done:
- [x] Event and API contracts are stable and documented.
- [x] Team can add new trigger types without changing existing payload shape.

### Phase 1 - Behavior Instrumentation
- [x] Phase 1A Bootstrap: add minimal contracts and guide-store prerequisites so instrumentation compiles against stable types.
- [x] Add section visibility observers (`#about`, `#projects`, `#experience`, `#skills`, `#certifications`, `#contact`).
- [x] Capture project-card click/open events with project slug and title.
- [x] Capture route/lens transitions and pass to mascot controller.
- [x] Add client-side event queue with minimal state footprint.

Definition of done:
- [x] Mascot receives correct trigger events for real user navigation.
- [x] No duplicate trigger flood on small scroll jitter.

### Phase 2 - Guide Generation Backend
- [x] Implement guide generation API route with strict input validation.
- [x] Build prompt assembly for behavior-guided explanation (event + lens + entity context + recent lines).
- [x] Reuse twin retrieval and scope guardrails to keep responses factual and portfolio-bound.
- [x] Add provider fallback behavior for guide generation path.

Definition of done:
- [x] API returns concise context-aware guidance for each supported trigger type.
- [x] Out-of-scope or low-context requests safely deflect without generic assistant drift.

### Phase 3 - Mascot Speech Orchestration
- [x] Replace static message rotation in `TwinMascot` with generated guide pipeline.
- [x] Add priority rules (project_open > section_enter > idle_nudge).
- [x] Add dedup similarity check against recent mascot messages.
- [x] Add per-trigger cooldown and global suppression window.

Definition of done:
- [x] Mascot messages change based on actual behavior, not fixed page lists.
- [x] Reloading and repeating actions does not produce redundant copy patterns.

### Phase 4 - Quality, Testing, and Telemetry
- [x] Add unit tests for event dedup/cooldown logic.
- [x] Add API tests for schema validation and guardrail behavior.
- [x] Add integration test for scroll-to-section then project-open flow.
- [x] Log guide trigger, latency, and suppression reason for debugging.

Definition of done:
- [x] Behavior-guided narration path is test-covered and observable.
- [x] Failures degrade gracefully without breaking mascot UI.

### Phase 5 - Content Calibration
- [x] Tune output style for concise bubble readability (1-2 short sentences).
- [x] Tune lens-aware wording so messages match selected role framing.
- [x] Validate with repeated sessions to ensure low redundancy.
- [x] Final QA pass for desktop and mobile interaction quality.

Definition of done:
- [x] Mascot guidance feels natural, useful, and non-repetitive.
- [x] Lens-specific context is consistently reflected in mascot narration.

Validation evidence:
- `npm run typecheck`
- `npm run test:twin`
- `npm run lint`
- `npm run build`
- Added session-state persistence coverage (`tests/twin/guide-session-state.test.ts`) to ensure reload continuity for cooldown + dedup context.
