---
topic: project_narrative
priority: medium
lastUpdated: 2026-04-17
projectSlug: law-firm-management-software
---

# Ordinay Legal Operations Platform Narrative

## Problem

Law offices were running core workflows across disconnected tools. Case execution, documents, sessions, tasks, and billing were fragmented, which increased operational friction and made traceability harder.

## My Role

I built and evolved Ordinay as a full-stack and AI systems engineer. I worked on desktop architecture boundaries, backend domain logic, data integrity, and Agent v2 safety design.

## Constraints

- Confidential, document-heavy legal domain with strict operational expectations
- Local-first control requirement for sensitive office workflows
- Need to keep AI assistance useful without allowing unsafe autonomous mutations

## Key Decisions

1. Use a desktop-first runtime (React renderer + Electron IPC + Express backend + SQLite) to keep operator control and predictable performance.
2. Encode legal-work invariants in schema and service layers (entity ownership XOR rules, constrained status vocabularies, and protected referential integrity).
3. Implement Agent v2 with plan/confirm/execute gating, permission boundaries, and runtime safe-mode controls for high-impact actions.

## Failure and Lesson

Early AI workflow iterations mixed assistant reasoning and mutation intent too closely.
I corrected this by splitting planning from execution and forcing explicit confirmation before writes.
Lesson: in operational legal systems, helpful AI is not enough; mutation safety and auditability must be first-class architecture concerns.

## Outcomes

- Unified clients, dossiers, lawsuits, sessions, tasks, missions, documents, and billing in one desktop workflow.
- Maintained usable core operations even when AI-related services degrade.
- Created a practical case study of boundary design across UI, backend domain logic, and controlled agent execution.
