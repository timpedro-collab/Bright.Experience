# Testing in Bright.Experience

A new engineer's quickstart to the test suite. Follow these conventions and CI will be happy.

## TL;DR

```bash
npm test              # run all unit + integration tests once
npm run test:watch    # watch mode (re-runs affected tests on save)
npm run test:ui       # pretty Vitest UI in the browser
npm run test:coverage # coverage report (HTML in coverage/)
npm run test:rls      # pgTAP RLS tests against local Supabase
npm run test:e2e      # Playwright browser tests
```

## What we test (and don't)

| Category | Tool | Coverage target | Where it lives |
|---|---|---|---|
| Pure functions | Vitest | 90%+ | `src/lib/**/*.test.ts` next to source |
| Module integration | Vitest + mocked Supabase | 75%+ | `src/lib/**/*.test.ts` |
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

### A new E2E journey

Only add E2E when:
- The journey crosses 3+ pages, AND
- A regression would be visible to a real customer/internal user

Otherwise prefer unit/integration tests — they're cheaper and more focused.

## CI gates

| Gate | When | Failure means |
|---|---|---|
| `lint` | every push | Pre-existing — non-blocking for now |
| `typecheck` | every push | TypeScript errors — must pass |
| `npm test` | every push | Any test failure or coverage below threshold — must pass |
| `test:rls` | PRs to main | RLS regression — must pass |
| `test:e2e` | PRs to main + nightly | Smoke regression — must pass before merge |

Branch protection on `main` enforces all of the above (except `lint`).

## Coverage thresholds

Enforced in `vitest.config.ts`:

| Path | Lines | Branches |
|---|---|---|
| `src/lib/**/*.ts` | 85% | 80% |
| `src/app/actions/**/*.ts` | 70% | 65% |
| Global | 65% | 60% |

If you drop coverage below these, CI fails. Either write the missing tests or argue for moving the threshold in your PR.

## Pre-commit hook

Husky + lint-staged are wired up. On every commit, files you touched get:
- `eslint --fix` (auto-fixes what it can)
- `vitest related --run` (runs tests affected by your changes — fast)

If lint or tests fail locally, the commit is blocked. Run `git commit --no-verify` to override only when you absolutely have to (e.g. emergency hotfix).

## When something's confusing

Open `src/lib/dates.test.ts` — it's the smallest, most readable test file in the codebase. Use it as a template.

Then `src/lib/notifications/dispatch.test.ts` — that's the canonical example for a complex integration test with mocked Supabase, spied dispatcher, and Class A/B branching.
