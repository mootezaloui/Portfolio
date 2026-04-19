# V2 Ideas Backlog

## Purpose
Captured follow-up ideas after v1 launch prep.

## Priority Queue

### 1) Vercel KV Rate Limiter (High)
- Replace in-memory limiter in `lib/twin/rateLimit.ts`.
- Add per-IP and per-conversation counters with durable windows.
- Add structured telemetry for throttling decisions.

### 2) Performance Benchmarking Harness (High)
- Add repeatable Lighthouse + route latency script for:
  - `/`
  - `/twin`
  - `/case-study`
- Track historical score trends in a report file.

### 3) Real Conversation Persistence (High)
- Move twin conversation storage from local-only to server-side KV.
- Keep share URLs stable without requiring local snapshot query payload.

### 4) Feedback Loop Pipeline (Medium)
- Store `/api/twin/feedback` payloads persistently.
- Build weekly triage report for misalignment and deflection quality.

### 5) Multi-Language Twin (Medium)
- Add scoped EN/FR/AR response mode with explicit language controls.
- Keep same safety and scope contract across languages.

### 6) Agent Detection Tuning (Medium)
- Add false-positive/false-negative tracking hooks.
- Introduce configurable signature profiles and confidence calibration.

### 7) Red-Team Demonstration Mode (Medium)
- Optional controlled mode showing attack attempts and blocked behavior.
- Keep separate from recruiter-facing default flow.

### 8) Advanced Observability Dashboard (Low)
- Basic internal dashboard for:
  - twin latency
  - deflection rates
  - provider fallback usage
  - agent traffic split

### 9) Prompt/Corpus Diff Tooling (Low)
- CLI to compare corpus revisions and expected answer shifts.
- Helps maintain voice consistency during content updates.

### 10) Public OSS Hardening Pack (Low)
- Add docs that safely open-source the runtime without leaking sensitive prompt strategy details.
