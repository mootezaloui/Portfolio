---
topic: project_narrative
priority: medium
lastUpdated: 2026-04-17
projectSlug: equation-solver-chatbot
---

# Equation Solver Chatbot Narrative

## Problem

A chatbot that solves equations can become unstable if execution environments differ between development and deployment.

## My Role

I implemented the backend logic and deployment setup with reliability as the primary goal.

## Constraints

- Deterministic response expectations
- Dependency and environment drift risk
- Need for simple operation and reproducible setup

## Key Decisions

1. Containerize services with Docker
2. Keep interface flow simple and focused on one job
3. Prioritize predictable execution over feature breadth

## Failure and Lesson

Early versions had inconsistent behavior across setups.
Containerization reduced this drift significantly.
Lesson: environment consistency is a first-order requirement for reliable ML-assisted features.

## Outcomes

- Working equation-solving conversational flow
- More stable and portable deployment model
- Clear baseline for future security hardening in similar assistant systems
