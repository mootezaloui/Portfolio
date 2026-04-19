# Launch Runbook

## Purpose
Operational checklist for moving Tazou Runtime from launch-ready code to production launch.

## Pre-Deploy Checklist
1. Ensure env vars are set in Vercel:
   - `GROQ_API_KEY`
   - `OPENROUTER_API_KEY`
   - `RATE_LIMIT_KV_URL` (when KV limiter is enabled)
   - `EMBEDDING_MODEL`
2. Run local readiness checks:
   - `npm run launch:check`
3. Confirm architecture checklists are current:
   - `ARCHITECTURE.md`
   - `PHASE7_READINESS.md`

## Deploy Procedure (Vercel)
1. Push latest `main` branch changes.
2. Trigger production deployment in Vercel.
3. Validate successful build and middleware activation in deployment logs.

## Post-Deploy Smoke Checks
1. Human landing:
   - `GET /` with browser-like UA returns portfolio landing content.
2. Agent routing:
   - `GET /` with `GPTBot` or `ClaudeBot` UA rewrites to `/agent`.
3. Core endpoints:
   - `GET /agent/profile.json`
   - `GET /agent/projects.json`
   - `GET /agent/verdict.json`
   - `GET /llms.txt`
4. Twin path:
   - `GET /twin`
   - send one in-scope and one out-of-scope prompt.
5. Resume:
   - `GET /resume.pdf` returns `200` and downloadable PDF.

## Announcement Checklist
1. Prepare launch post with:
   - Live URL
   - 3-sentence problem framing
   - 3 key technical differentiators
   - link to `/case-study`
2. Publish on LinkedIn.
3. Share in engineering/security communities where appropriate.

## Monitoring (Week 1)
1. Daily review:
   - API error rates (`/api/twin/chat`, `/api/twin/feedback`)
   - middleware rewrites vs normal traffic
   - provider fallback frequency
2. Log notable events:
   - false-positive agent routing
   - twin deflection anomalies
   - latency spikes
3. File fixes as concrete tasks and tag as `launch-week1`.

## Exit Conditions
Launch considered stable when:
1. No critical errors for 7 consecutive days.
2. Agent routing behavior remains correct under real traffic.
3. Twin quality remains in-scope and stable under normal use.
