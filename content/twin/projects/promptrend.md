---
topic: project_narrative
priority: high
lastUpdated: 2026-04-17
projectSlug: promptrend-llm-vulnerability-discovery
---

# PrompTrend Narrative

## Problem

Most LLM safety evaluations are periodic and static.
That makes it hard to track evolving jailbreak and prompt-injection patterns across black-box model APIs.

## My Role

I led security-oriented design and implementation during the Datadoit internship.
I focused on continuous vulnerability discovery and risk scoring.

## Constraints

- Black-box API visibility only
- Need for reproducible execution
- Need for actionable prioritization, not raw findings only
- Limited operational budget and tooling complexity

## Key Decisions

1. Continuous pipeline over one-time testing
2. Containerized execution for reproducibility
3. Risk scoring layer to prioritize findings
4. Reporting flow that maps findings to concrete security actions

## Failures and Corrections

Early iterations produced too many low-signal findings.
I corrected by tightening transformation and scoring logic so results were more actionable.

## Outcomes

- Published research output on arXiv
- Repeatable workflow for model risk assessment
- Better traceability from discovered prompt pattern to remediation priority

## Why This Matters For My Profile

This project is the clearest signal of my AI security direction: adversarial evaluation, constrained architecture, and operationally useful outputs.
