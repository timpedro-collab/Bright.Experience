# 14 — Codebase Map

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25 against `main`.
>
> The structural companion to [`docs/15-system-architecture.md`](15-system-architecture.md)
> (how it flows) and [`docs/16-api-and-actions-reference.md`](16-api-and-actions-reference.md)
> (what the endpoints are). This doc is *where things live*.

## Stack at a glance

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, RSC-first) | `16.2.2` |
| UI runtime | React | `19.2.4` |
| Language | TypeScript | `^5` (Node `>=20`, CI 22) |
| Styling | Tailwind CSS v4 + shadcn/ui | `^4` |
| Database / Auth / Storage | Supabase (Postgres 17) | `@supabase/supabase-js ^2`, `@supabase/ssr ^0.10` |
| Validation | Zod | `^4` |
| Email | Resend | `^6` |
| Charts / motion / icons | Recharts / Framer Motion / Lucide | `^3` / `^12` / `^1` |
| Observability | Sentry | `^10` |
| Tests | Vitest + Testing Library + Playwright + pgTAP | Vitest `^4`, Playwright `^1.60` |

Full manifest: [`package.json`](../package.json).

## Repository inventory (verified counts)

| Artefact | Count | Location |
|----------|-------|----------|
| Pages (`page.tsx`) | ~101 | `src/app/**` |
| Route handlers (`route.ts`) | 16 | `src/app/**/route.ts` |
| Server-action files (incl. tests) | 73 | `src/app/actions/**` |
| Query files (incl. tests) | 58 | `src/lib/queries/*` |
| Database migrations | 59 | `supabase/migrations/*.sql` |
| RLS pgTAP test files | 24 | `supabase/tests/*.sql` |
| Domain type modules | 14 | `src/types/*` (barrelled by `index.ts`) |

## Entry points

| Purpose | File |
|---------|------|
| Auth gate / route protection | [`src/middleware.ts`](../src/middleware.ts) |
| Root layout, fonts, theme, env check | [`src/app/layout.tsx`](../src/app/layout.tsx) |
| Marketing homepage | [`src/app/page.tsx`](../src/app/page.tsx) |
| Sentry init (server/edge) | [`src/instrumentation.ts`](../src/instrumentation.ts), `sentry.{client,server,edge}.config.ts` |
| Next.js config (headers, images, Sentry, LAN dev) | [`next.config.ts`](../next.config.ts) |

## Directory taxonomy

```
src/
├── app/                      Next.js App Router — routes only, no business logic
│   ├── actions/              Server Actions (mutations), grouped by domain
│   │   ├── logistics/        Split sub-domain (delivery windows, entries, …)
│   │   └── quotes/           Split sub-domain (book-now, proposal-intake, …)
│   ├── (public)/             Unauthenticated: catalog, quiz, book, proposal, report…
│   ├── events/[id]/          Event workspace (~24 sub-pages)
│   ├── admin/                Internal tools (~20 surfaces)
│   ├── partners/[slug]/      Reseller/partner portal
│   ├── venues/[slug]/        Venue portal (incl. public /advertise, iframe /embed)
│   ├── pipeline/ inbox/ ops/ studio/   Ops surfaces
│   ├── settings/ login/ auth/ welcome/ notifications/ help/
│   └── api/                  Route handlers (webhooks, crons, live, export, search…)
├── components/
│   ├── ui/                   shadcn/ui primitives (do not modify directly)
│   ├── cloud/                Cloud design-system kit (KPI/chart/table)
│   ├── brand/                Page chassis (EditionShell, RidgeHero, *PageShell)
│   ├── layout/ theme/        App shell, command palette, ThemeProvider
│   └── <domain>/             events, quotes, briefing, approvals, qa, telemetry, reports, partners, venues, configuration, …
├── lib/
│   ├── queries/              Supabase reads — one file per entity
│   ├── validations/          Zod schemas — one file per domain
│   ├── supabase/             Clients (server/client/service-role) + mock/
│   ├── notifications/        Dispatch spine + archetypes + email shell
│   ├── brightblue/           Cloud client + config-sync payload
│   ├── pipedrive/            REST client + outbox drain + triggers
│   ├── proposals/ reports/ metrics/ exports/ storage/ webhooks/
│   ├── asset-requirements/   Game-flow asset specs + machine placement previews
│   ├── roles.ts              RBAC role-class helpers (source of truth)
│   ├── event-access.ts       Which event sections each role sees (nav + guards)
│   ├── capabilities.ts       Capability/upsell vocabulary
│   └── auth.ts env.ts dates.ts currency.ts rate-limit.ts cron-auth.ts …
├── types/                    Domain types + enums, barrelled via index.ts
└── middleware.ts

supabase/
├── migrations/               59 timestamped SQL migrations (executable truth)
├── schema.sql                Canonical schema *reference* (not applied)
├── seed.sql                  Declarative seed rows
├── run-seed.ts               Programmatic application-data seeder
├── seed-users.ts             Auth user + profile seeder (run first)
├── seed-creative-queue.ts    Optional creative-review demo data
├── tests/                    24 pgTAP RLS test files
└── config.toml               Supabase CLI config (Postgres 17; db.seed disabled)

e2e/                          Playwright specs + fixtures
docs/                         This documentation suite
scripts/                      simulate-cloud-webhook.ts (webhook contract harness)
.github/workflows/            test.yml, e2e.yml
```

## Layering rules (enforced by convention + `.cursor/rules/`)

Pages **compose and fetch**; components **render**; `src/app/actions/*`
**mutate**; `src/lib/queries/*` **read**; `src/lib/validations/*` define **Zod
schemas**. Access is enforced by [`src/lib/roles.ts`](../src/lib/roles.ts) +
[`src/lib/event-access.ts`](../src/lib/event-access.ts) at the app layer and by
RLS at the database layer. No direct Supabase calls in components; no business
logic in pages.

## Conventions

- **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components.
- **Functions:** `camelCase`, verb-first (`getEventById`, `createQuoteFromIntake`).
- **Types:** `PascalCase` nouns. **Constants:** `UPPER_SNAKE_CASE`.
- **Tests live next to source** (`foo.ts` + `foo.test.ts`), never in `__tests__/`.
- Keep files focused; most stay well under ~300 lines.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:watch` / `test:ui` / `test:coverage` | Vitest |
| `npm run test:rls` | pgTAP RLS via Supabase CLI (Docker) |
| `npm run test:e2e` | Playwright (builds + starts prod server, `TEST_MODE=1`) |

## Configuration files

| File | Role |
|------|------|
| [`tsconfig.json`](../tsconfig.json) | TS config; `@/*` → `src/*` |
| [`vitest.config.ts`](../vitest.config.ts) | Test runner + per-path coverage thresholds |
| [`playwright.config.ts`](../playwright.config.ts) | E2E; Chromium default; prod webServer |
| [`eslint.config.mjs`](../eslint.config.mjs) | ESLint flat config |
| [`components.json`](../components.json) | shadcn config |
| [`postcss.config.mjs`](../postcss.config.mjs) | Tailwind v4 / PostCSS |
| [`vercel.json`](../vercel.json) | 5 cron schedules |
| [`supabase/config.toml`](../supabase/config.toml) | Supabase CLI (Postgres 17) |
| [`.env.example`](../.env.example) | Environment template (tiered) |

## Schema source of truth

`supabase/migrations/*` is the **executable truth** — applied in filename order
by `npx supabase db push`. [`supabase/schema.sql`](../supabase/schema.sql) is a
human-readable **reference** and is not applied. The mock dataset
(`src/lib/supabase/mock/dataset.ts`), `supabase/seed.sql`, and
`supabase/run-seed.ts` are a **manual three-way sync** — there is no generator,
so a schema/seed change must touch all relevant paths together or mock mode and
real Supabase drift.

## CI / tooling

- [`.github/workflows/test.yml`](../.github/workflows/test.yml): lint →
  typecheck → test → build on every push; pgTAP RLS on PRs.
- [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml): Playwright on PRs
  + nightly 02:00 UTC.
- Pre-commit: Husky + lint-staged run `eslint --fix` and `vitest related`.
