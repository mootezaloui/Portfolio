# Mascot Movement QA Checklist

## Goal
Verify the mascot movement layer stays readable, non-blocking, and stable across desktop/mobile and reduced-motion contexts.

## Automated Coverage (Completed)
- [x] Motion state transitions and deterministic transition path tests pass.
- [x] Dwell + move-rate cooldown tests pass (including one-minute recovery).
- [x] Trigger policy tests pass for desktop/mobile/quiet/reduced modes.
- [x] Safe placement anti-overlap tests pass for protected CTA zones.
- [x] Route + section anchor resolution integration tests pass.

## Manual Visual Pass (Per Release)
- [ ] Desktop home route: mascot does not overlap project CTA while guiding section/project anchors.
- [ ] Desktop `/projects/[slug]`: mascot guidance remains readable and does not cover primary action controls.
- [ ] Mobile viewport (`<= 768px`): movement stays local, with visibly reduced travel and fewer hops.
- [ ] Reduced motion enabled: mascot remains mostly static and still provides bubble guidance.
- [ ] Quiet mode enabled: mascot guidance text remains available while relocation is minimized.
- [ ] Twin panel typing: no disruptive movement while user is actively entering text.

## Regression Notes
- Re-run this checklist when changing:
  - anchor selectors or section layout,
  - motion constraints (`maxDistancePx`, `minDwellMs`, `maxMovesPerMinute`),
  - protected CTA anchors or bubble controls.
