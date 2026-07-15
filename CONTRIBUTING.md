# Contributing to Bright.Experience

Welcome. This doc gets you from a fresh clone to your first PR.

## Setup

```bash
nvm use 22                                # node 22 is the target (minimum 20, per package.json engines)
npm install
cp .env.example .env.local                # then fill in Supabase + Pipedrive keys
npm run dev
```

The portal will be at http://localhost:3000.

For E2E tests you also need Playwright browsers:

```bash
npx playwright install --with-deps chromium
```

For RLS tests you need Docker installed so the Supabase CLI can boot a
local Postgres.

## Project shape

```
src/
  app/                Next.js App Router (RSC by default, "use client" sparingly)
    actions/          server actions — one file per domain
    api/              route handlers (cron, webhooks, test mode)
    ...               route folders mirror URL structure
  components/         React UI grouped by feature
  lib/                pure logic, no React imports
    queries/          Supabase read helpers
    notifications/    dispatcher + archetypes + email shell
    pipedrive/        REST client + outbox drain + triggers
    validations/      Zod schemas
  test/               shared test helpers (mock Supabase, fixtures, render)
supabase/
  migrations/         declarative SQL migrations
  tests/              pgTAP RLS test files
e2e/                  Playwright specs + fixtures
.github/workflows/    CI (lint, typecheck, test, rls, e2e)
docs/
  testing.md          full testing guide
```

## The non-negotiables

1. **Always create the test file alongside the source file.** See `docs/testing.md`.
2. **`npm run lint`, `npm run typecheck`, `npm test` must be green** before opening a PR.
3. **Never drop coverage** below the thresholds in `vitest.config.ts`.
4. **Always update docs in the same PR** as the code change.
5. **Keep files focused — prefer small, single-purpose modules; most files stay well under ~300 lines.** Split large domains into focused files rather than letting a monolith grow.
6. **No `any` outside of test files.**

The pre-commit hook (Husky + lint-staged) runs `eslint --fix` and
`vitest related --run` on every commit so most of these are auto-checked.

## Adding…

### A new server action

1. Create `src/app/actions/<domain>.ts`.
2. Wrap it with `"use server"`, validate inputs with a Zod schema in `src/lib/validations/`.
3. Add `src/app/actions/<domain>.test.ts` next to it. Test the happy path and every branch the user can hit (RBAC, validation, error).
4. Add a CHANGELOG entry if the action is user-facing.

### A new notification archetype

1. Register it under `src/lib/notifications/archetypes/` (catalogue modules + `index.ts` exports).
2. Decide whether it's Class A (action_required) or Class B (FYI).
3. Add a test in `src/lib/notifications/archetypes.test.ts` for the new template.
4. If it needs a new resolver, add one in `resolve-owners.ts` + a test.

### A new RLS policy

1. Add a migration under `supabase/migrations/`.
2. Add or update `supabase/tests/rls_<table>.sql`.
3. Run `npm run test:rls` locally to confirm.

### A new client component

1. One component per file under `src/components/<feature>/`.
2. Use existing primitives in `src/components/ui/` (shadcn) and `src/components/brand/` (editorial) instead of building new ones.
3. If it has any interactivity, add `Component.test.tsx` next to it.

### A new page

1. **Event sub-page** (`/events/[id]/foo`) — use `EventPageShell`. Mirror an existing sibling like `/events/[id]/timeline`.
2. **Internal admin page** (`/admin/foo`) — use `AdminPageShell`. Mirror an existing admin page.
3. **Public marketing page** — mirror `/catalog` or `/quiz`: a `RidgeArtwork` + `EditorialEyebrow` hero, then `Container` + `Section` body.
4. Read `docs/09-design-system.md` first — it lists banned patterns (no legacy `.btn`/`.card` classes, no "chapter/edition" metaphor, no ad-hoc radii).

## Running tests

```bash
npm test                  # unit + integration (fast, < 10s)
npm run test:watch        # watch mode while developing
npm run test:ui           # Vitest browser UI
npm run test:coverage     # coverage report (HTML in coverage/)
npm run test:rls          # pgTAP RLS tests (requires Docker)
npm run test:e2e          # Playwright (requires built app)
```

## Commit message style

We use conventional-ish commits:

```
feat(notifications): add Class B opt-out for daily metrics
fix(pipedrive): preserve __increment__ sentinel on retry
docs(testing): document component test conventions
chore(deps): bump zod to 4.4.3
```

Keep the subject ≤72 chars. Bodies optional but encouraged for non-obvious change.

## PR checklist

Before requesting review:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Coverage thresholds met
- [ ] Tests added for new behaviour
- [ ] Docs updated (`docs/`, `CHANGELOG.md` if user-facing)
- [ ] No `console.log` left in code
- [ ] No `any` outside of tests
- [ ] Files stay focused and single-purpose (most well under ~300 lines)

## Questions

- Architecture / conventions → `docs/`, `AGENTS.md`, `.cursor/rules/`
- Testing patterns → `docs/testing.md`
- Database schema → `supabase/migrations/` (declarative SQL)
- Notification archetypes → `src/lib/notifications/archetypes/`
- Pipedrive write-back → `src/lib/pipedrive/`
