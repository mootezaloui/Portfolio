# Tazou Runtime

Portfolio rebuild for a constrained AI systems showcase.

Current status: **Phase 7 launch preparation in progress**.

## Stack

- Next.js App Router
- TypeScript (strict mode)
- Tailwind CSS
- ESLint + Prettier
- Radix-based primitives for UI foundation

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint checks
- `npm run typecheck` - TypeScript checks
- `npm run twin:index` - build twin retrieval index
- `npm run test:twin` - run twin tests
- `npm run launch:check` - run launch readiness checks (lint + typecheck + tests + build)
- `npm run format` - format repository
- `npm run format:check` - verify formatting

## Deployment Target

- Platform: Vercel
- Runtime-specific endpoints are scaffolded under `app/api/*` and `app/agent/*`.
- Final Phase 0/1 external step still pending: link repository to Vercel and validate preview deployments.
- Launch checklist and operational steps: `LAUNCH_RUNBOOK.md`
- Final readiness matrix: `PHASE7_READINESS.md`

## Repository Notes

- Legacy CRA portfolio snapshot was archived on **2026-04-17** under `archive/cra-2026-04-17/`.
- Current architecture spec lives in `ARCHITECTURE.md`.
- Phase 6 audit details live in `PHASE6_AUDIT.md`.
