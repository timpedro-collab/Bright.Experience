# Testing in Bright.Experience

A new engineer's quickstart to the test suite. Follow these conventions and CI will be happy.

## TL;DR

```bash
npm test                 # unit tests, hermetic (mocked Supabase)
npm run test:watch       # watch mode (re-runs affected tests on save)
npm run test:ui          # pretty Vitest UI in the browser
npm run test:coverage    # coverage report (HTML in coverage/)
npm run test:integration # real queries against local Postgres (needs db:local)
npm run test:rls         # pgTAP RLS tests against local Supabase
npm run test:e2e         # Playwright browser tests
```

## What we test (and don't)

| Category | Tool | Coverage target | Where it lives |
|---|---|---|---|
| Pure functions | Vitest | 90%+ | `src/lib/**/*.test.ts` next to source |
| Module integration | Vitest + mocked Supabase | 75%+ | `src/lib/**/*.test.ts` |
| Query shape against real Postgres | Vitest + local Supabase | the hot read path | `src/**/*.integration.test.ts` |
| Server actions | Vitest + mocked Supabase + spied dispatcher | 70%+ branches | `src/app/actions/**/*.test.ts` |
| Components | Vitest + @testing-library/react | critical UI only | `src/components/**/*.test.tsx` |
| RLS policies | pgTAP via Supabase CLI | every sensitive table | `supabase/tests/*.sql` |
| User journeys | Playwright | 10 critical journeys | `e2e/*.spec.ts` |

**We don't test:** shadcn primitives (already tested upstream), pure presentation components, Next.js framework internals, type-only helpers, mock data.

## Conventions

### 1. Test files live next to source

```
src/lib/dates.ts
src/lib/dates.test.ts        ← lives RIGHT next to it
```

Not in a `__tests__/` folder. Not in a `test/` root. Same folder. This makes deletes safe (delete source → tests are obviously orphaned), keeps grep-ability sharp, and removes "where do tests live again?" friction.

### 2. Test names describe behaviour, not implementation

Bad:
```ts
it("calls supabase.from with 'tasks'", () => {});
```

Good:
```ts
it("returns zero counts when no events are provided", () => {});
it("counts only customer-visible tasks for non-internal viewers", () => {});
```

### 3. Use the shared helpers

- `import { createMockSupabase } from "@/test/supabase"` for any DB-touching code
- `import { render, userEvent } from "@/test/render"` for React component tests
- `import { makeEvent, makeUser, makeAsset, ... } from "@/test/fixtures"` for canonical mock data
- `import { server } from "@/test/handlers"` for tests that hit the Pipedrive REST client

### 4. Mock at the right layer

We mock **the Supabase client** (one boundary outside our code), not individual query functions. That way the tests still cover our wrapping logic — table names, column names, chain calls, error handling — and only the network is stubbed.

Same principle for Resend (`src/lib/email.ts` is mocked, not the server action that calls it) and Pipedrive (MSW intercepts HTTP at the network layer).

### 5. Server actions: test the function body, not the runtime

`"use server"` is just a marker — the exported function works fine when imported into a test. Test what it does given a mocked `auth.getUser()` and `createClient()`.

### 6. Don't snapshot React markup

Snapshots rot. Assert on what the user sees:

```tsx
expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
expect(screen.getByText(/uploaded — pending Bright.Blue review/i)).toBeVisible();
```

## Writing a new test

### A new pure helper

```ts
// src/lib/widgets.ts
export function widgetize(x: number) { return x * 2; }

// src/lib/widgets.test.ts
import { describe, it, expect } from "vitest";
import { widgetize } from "./widgets";

describe("widgetize", () => {
  it("doubles a positive number", () => {
    expect(widgetize(3)).toBe(6);
  });
  it("returns 0 for 0", () => {
    expect(widgetize(0)).toBe(0);
  });
  it("handles negatives", () => {
    expect(widgetize(-2)).toBe(-4);
  });
});
```

### A new server action

```ts
// src/app/actions/widgets.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase } from "@/test/supabase";
import { makeEvent } from "@/test/fixtures";

const supabase = createMockSupabase();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(async () => ({ id: "u1", role: "events_lead" })),
}));

describe("createWidget", () => {
  beforeEach(() => {
    supabase.setTableResponse("widgets", {
      data: { id: "w1" },
      error: null,
    });
  });

  it("inserts a widget and revalidates the dashboard", async () => {
    const { createWidget } = await import("./widgets");
    const result = await createWidget({ name: "Test" });
    expect(result).toEqual({ id: "w1" });
    expect(supabase.callsFor("widgets")).toContainEqual(
      expect.objectContaining({ method: "insert" })
    );
  });
});
```

### A new RLS policy

When you add or change a policy on a table, add or update the matching file under `supabase/tests/`:

```sql
-- supabase/tests/rls_widgets.sql
begin;
select plan(3);

-- Customer can read their own widgets
set local "request.jwt.claims" = '{"sub":"customer-1","role":"customer_admin"}';
select results_eq(
  $$ select count(*) from widgets where account_id = 'acc-1' $$,
  $$ values (5::bigint) $$,
  'customer sees only their own widgets'
);

-- ...

select * from finish();
rollback;
```

Run `npm run test:rls` to confirm.

The suite runs against your local database, which also carries the demo seed, so
fixtures and assertions have to be scoped:

- Give fixture rows `rls-` prefixed slugs, codes and other unique values.
  `supabase/tests/_fixtures.psql` follows this; a bare `northern` or
  `BB-NORTH001` collides with a seeded row and the whole file aborts.
- Never assert on a whole-table count. `select count(*) from venues` counts the
  demo data too. Scope every assertion to the fixture ids or slugs it created,
  and let the policy — not an empty table — be the thing under test.

### A new query against real Postgres

The unit suite drives Supabase through `createMockSupabase()`, a chainable
recorder. It cannot tell you that a `select()` names a column that doesn't
exist, that an embed is ambiguous because two foreign keys connect the tables,
that an `upsert`'s `on_conflict` has no matching unique index, or that an
`rpc()` was never migrated. Every one of those shipped to `main` at some point.

`src/lib/queries/hot-queries.integration.test.ts` runs the hot read path against
local Postgres under real RLS. Add a case when you add a query a page depends
on:

```ts
[
  "getWidgetsByEvent",
  async () => (await import("./widgets")).getWidgetsByEvent(fixtures.eventId),
],
```

The assertion is uniform — the call resolves and nothing reached
`logQueryError`, i.e. PostgREST accepted the request. Row-shape assertions stay
in the unit suite.

```bash
npm run db:local          # start Postgres, apply migrations, seed in three steps
npm run test:integration  # skips with a warning if the stack isn't up
```

Seeding is ordered: `seed-users.ts` (auth users) → `seed.sql` (catalogue,
events, the canonical asset checklist) → `run-seed.ts` (the lived-in demo layer
built on top). `seed.sql` cannot run during `supabase db reset` because it
references auth users created out of band, so `scripts/apply-seed-sql.sh`
applies it in between and skips if the catalogue is already there. To re-seed,
use `npm run db:reset` rather than re-running the parts.

Personas (`internal`, `customer`) sign in with real passwords from
`supabase/seed-users.ts`, so RLS applies exactly as in production. The harness
lives in `src/test/integration/harness.ts`.

### A new E2E journey

Only add E2E when:
- The journey crosses 3+ pages, AND
- A regression would be visible to a real customer/internal user

Otherwise prefer unit/integration tests — they're cheaper and more focused.

## CI gates

Verified against [`.github/workflows/test.yml`](../.github/workflows/test.yml)
and [`.github/workflows/e2e.yml`](../.github/workflows/e2e.yml) (2026-07-31).

**Job `lint-typecheck-unit`** (push + PR to `main` and `frontend-mock-data`)
runs these steps in order — each is blocking, a failure fails the job:

| Step | Notes |
|---|---|
| `npm run lint` | **Blocking** — runs before typecheck/test in the same job |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:coverage` | Vitest **with the coverage gate on** — below a threshold fails the build |
| `npm run build` | Production build with stub env; must compile |

**Job `database`** (same triggers): checks that every RLS policy has a pgTAP
test (`node scripts/check-policy-tests.mjs`), then spins up local Supabase via
the CLI and runs `npm run test:rls` (pgTAP) followed by
`npm run test:integration` (hot queries against real Postgres). Requires the
Supabase CLI/Docker in the runner.

**E2E** (`e2e.yml`, separate workflow): Playwright on PRs + nightly 02:00 UTC;
builds and starts a production server with `TEST_MODE=1`.

## Coverage thresholds

Defined in `vitest.config.ts` and enforced by `npm run test:coverage`, which is
what CI runs. Measured 2026-07-31:

| Path | Lines | Branches | Functions |
|---|---|---|---|
| `src/lib/**/*.ts` | 50% | 42% | 53% |
| `src/app/actions/**/*.ts` | 41% | 34% | 36% |
| Global | 30% | 24% | 24% |

These are **ratchets, not targets**. They previously read 85 / 70 / 65 — numbers
the suite had never met — and CI ran `npm test` without the coverage reporter,
so nothing enforced them. They now sit just under measured coverage, which means
the build fails the moment a change makes coverage worse. Raise them as tests
land; never lower one to make a build pass.

## Every RLS policy needs a pgTAP test

`scripts/check-policy-tests.mjs` parses every `create policy` in
`supabase/migrations/` and fails when the table it targets isn't mentioned by
any file under `supabase/tests/`. Run it locally before pushing a migration
that touches RLS:

```bash
node scripts/check-policy-tests.mjs
```

Matching is by table name, not filename — one test file often covers a domain
(`rls_telemetry.sql` covers four tables). If you genuinely cannot test a policy
yet, add the table to `supabase/tests/.policy-coverage-baseline` and expect to
justify it in review; the list is empty today.

One gotcha when writing the test: `supabase test db` runs against a **seeded**
database, so never assert on an unqualified `count(*)`. Scope every assertion to
your fixture rows (`where id in (...)`).

## Pre-commit hook

Husky + lint-staged are wired up. On every commit, files you touched get:
- `eslint --fix` (auto-fixes what it can)
- `vitest related --run` (runs tests affected by your changes — fast)

If lint or tests fail locally, the commit is blocked. Run `git commit --no-verify` to override only when you absolutely have to (e.g. emergency hotfix).

## When something's confusing

Open `src/lib/dates.test.ts` — it's the smallest, most readable test file in the codebase. Use it as a template.

Then `src/lib/notifications/dispatch.test.ts` — that's the canonical example for a complex integration test with mocked Supabase, spied dispatcher, and Class A/B branching.
