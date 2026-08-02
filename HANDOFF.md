# HANDOFF.md — Day 1 for the incoming CTO

Welcome. This is the shortest path from a cold clone to a working mental model
of Bright.Experience. Read this first, then follow the links.

## What the product is

**Bright.Experience** is Bright.Blue’s **delivery + proof** portal for experiential
activations. Customers and the internal team run an event from kickoff through
live telemetry to post-event proof of performance in one workspace.

- **Primary:** delivery pipeline (10 stages), creative/approvals, QA, logistics,
  live dashboards, leads, reports.
- **Intake (feeds delivery):** public catalog, quiz, proposal, and book-now —
  not a full sales CRM.
- **Secondary:** partner / reseller and venue runway portals
  (`partner_member` / `partner_admin`).

Canonical product wording: [`docs/01-product-definition.md`](./docs/01-product-definition.md).

## Run it locally

There are two runtimes, and the difference matters more than it looks.

### Local Postgres — the one that tells the truth

```bash
nvm use 22          # any Node 20+ works (see "engines" in package.json)
npm install
npm run db:local    # Docker: start Supabase, apply migrations, seed users + data
npm run dev:local   # dev server pointed at that stack, mock mode off
```

`db:local` and `dev:local` read the anon/service keys back out of the Supabase
CLI, so a `supabase stop --no-backup` and fresh `start` keeps working and
nothing needs pasting into `.env.local`. This is the only way to exercise the
real security boundary: RLS, PostgREST query shapes, password checks, storage
policies and database constraints all run. Anything touching auth, policies, or
a new query shape must be checked here before it is called done.

```bash
npm run test:rls          # pgTAP policy suite against the same stack
npm run test:integration  # the hot read path, run as real personas
npm run db:reset          # wipe and re-seed when the data drifts
npm run db:stop           # stop the containers
```

### Mock mode — demos and offline UI work

```bash
cp .env.example .env.local   # fill Supabase (+ optional Resend / Cloud / Pipedrive)
npm run dev
```

`NEXT_PUBLIC_MOCK_MODE=1` lives in `.env.development` and runs the app against
the in-memory dataset (`src/lib/supabase/mock/`) with no database at all. Fast,
and good for UI demos, but it has **no RLS, no PostgREST, and no password
check** — every session is a seeded persona. A production build ignores the flag
and logs a security error (`src/lib/supabase/mock/flag.ts`). A query that passes
in mock mode has proved nothing about whether the real database will accept it.

Open **http://localhost:3000**.

### Demo personas

At `/login`, use the **Demo accounts** pills. Password for all seeded users:

```
demo-password-123
```

Typical personas: James Chen (customer), Tim Pedro (admin / events lead),
Theo Roturu (creative), Dan Barnes (ops), Maya Patel (reseller partner),
Aaron Howe (venue). Full walkthrough: [`DEMO_ROADMAP.md`](./DEMO_ROADMAP.md).

## Quality gates (must be green)

```bash
npm run lint
npm run typecheck
npm test              # unit, hermetic (mocked Supabase)
```

Anything touching auth, RLS, or a query shape also has to pass against the local
stack, because the unit suite mocks Supabase and cannot see those failures:

```bash
npm run db:local          # if it isn't already up
npm run test:rls          # pgTAP, one file per policy
npm run test:integration  # hot read path as real personas
```

Also available: `npm run test:e2e` (Playwright). Conventions:
[`docs/testing.md`](./docs/testing.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Stubs and integrations

- **Start here for "what do we build first":**
  [`docs/13-dev-handover-priorities.md`](./docs/13-dev-handover-priorities.md)
  — the prioritized worklist (activation wiring → integration builds →
  client-committed features → full-system security checklist).
- **Launch stubs / intentional gaps:** [`STUBS-TO-REPLACE.md`](./STUBS-TO-REPLACE.md)
  (no in-portal payments; file-scan is env-gated until an AV endpoint is chosen).
- **External systems:** [`docs/10-integrations.md`](./docs/10-integrations.md)
  (Bright.Blue Cloud, Pipedrive, Resend, crons, Sentry, file-scan).
- **Schema / newer tables:** [`docs/04-data-model.md`](./docs/04-data-model.md)
  + authoritative [`docs/11-cloud-handoff.md`](./docs/11-cloud-handoff.md).

## Docs map

| Doc | Use when |
|-----|----------|
| `docs/01-product-definition.md` | Positioning, who it’s for |
| `docs/02-event-lifecycle.md` | 10-stage pipeline |
| `docs/03-roles-permissions.md` | RBAC |
| `docs/04-data-model.md` | Entities |
| `docs/05-information-architecture.md` | Routes |
| `docs/06-build-roadmap.md` | Phased plan |
| `docs/07-platform-vision.md` | Longer-term catalog / partner / runway vision |
| `docs/08-pricing-quoting-model.md` | Quoting tracks |
| `docs/09-design-system.md` | Cloud UI language |
| `docs/10-integrations.md` | Webhooks, crons, env |
| `docs/11-cloud-handoff.md` | Full schema + Cloud handoff |
| `docs/13-dev-handover-priorities.md` | Dev team's prioritized worklist + security checklist |
| `docs/14-codebase-map.md` | Directory taxonomy, entry points, tooling, inventories |
| `docs/15-system-architecture.md` | Architecture + data-flow diagrams |
| `docs/16-api-and-actions-reference.md` | Route handlers + server-action reference |
| `docs/17-feature-reference.md` | Role-based feature catalogue → implementation |
| `docs/ops/` | Operations runbooks (deploy, integrations, monitoring/DR, maintenance) |
| `OWNER-TODO.md` | Non-dev action list for the business owner (pricing, legal, accounts) |
| `SETUP.md` | Three tested setup paths (mock demo, local Supabase, hosted Supabase) |
| `DEMO_ROADMAP.md` | Live demo script |
| `CHANGELOG.md` | What shipped when |
| `README.md` | Setup, structure, scripts |

The full, role-routed index is [`docs/00-documentation-index.md`](./docs/00-documentation-index.md).

## Path to 10/10 status

**Pass 1 is done** (this handoff): product-definition sync, aspirational vs
implemented roles, changelog catch-up, data-model entity list, port 3000,
demo tour wording, integrations accuracy, README positioning, dead dashboard
cleanup, capabilities docstring, and this file.

**Pass 2 is done** (architecture): page-level Supabase reads moved into
`src/lib/queries/`; `RecommendationQuiz`, inbox `TaskGroup`/`TaskRow`, and
`VenueSponsorshipBoard` split into focused modules; proposal builder consolidated
under `src/lib/proposals/`.

**Pass 3 is done** (hardening): co-located tests for leads generator, export menu,
customer-reminder action/button, and tour finish→localStorage; `SecurityForm`
uses the shared browser Supabase client; lead list/aggregate/export queries are
bounded; `package_addons` capability-slug check synced to `capabilities.ts`
(migration + seed/mock); STUBS note for `qa_items` / unpublished `event_reports`
RLS left explicit.

**Pass 4 is done** (demo polish): GBP money formatting; home/overview “Needs you”
aligned; live hourly chart seeded; customer activity feed gated; aggregate-metrics
account check; login redirect allow-list.

**Pass 5 is done** (world-class deltas): customer home single next-action CTA;
spec-blocked asset uploads; board-ready report framing (&lt;24h proof + share/export).

Path to 10/10 passes 1–5 are complete for **demo + handoff + architecture + focused
product**. The remediation build below moved development onto real Postgres and
closed what that exposed; soak against a hosted Supabase project under
production traffic remains a separate CTO track.

## Builds since the 10/10 passes (July 2026)

Four further builds landed after passes 1–5 — each has a full entry in
[`CHANGELOG.md`](./CHANGELOG.md):

1. **Round 2 fixes & cleanup** (2026-07-10) — dead code removal, RBAC
   consolidation into `src/lib/roles.ts`, Zod validation on every action
   (`src/lib/validations/`), role-model holes closed, invoices frozen to
   display-only.
2. **World-class merged homepage** (2026-07-10) — one canonical marketing
   homepage at `/` (sections under `src/components/public/landing/`), verified
   claims in `src/lib/marketing/claims.ts`, `/catalog` slimmed to a browse index.
3. **Next 10 — security seams, Cloud handoff loop, schema debt** (2026-07-13)
   — rate limiting completed, QA/reports RLS hardening, pinned auth-callback
   redirects, Cloud webhook simulator (`scripts/simulate-cloud-webhook.ts`),
   legacy `quotes` columns dropped, duplicate migration version fixed.
4. **World-class UX polish** (2026-07-13) — optimistic UI with Undo across
   tasks / approvals / messages / notifications, live-dashboard motion and
   session deltas, global G-shortcuts + `?` overlay, command-palette Recent
   group, streaming skeletons, skip-to-content.
5. **Remediation build** (2026-08-01) — development moved onto local Postgres,
   seven security holes closed with pgTAP cases behind each, 124 swallowed
   query errors wired to Sentry, PostgREST-incompatible queries fixed, unwired
   features (approvals creation, sponsor conversion, health control,
   quote→event) connected, CSP/HSTS/rate-limiting/telemetry idempotency, and
   54 dead exports deleted with 41 more un-exported. This is the pass that made
   mock-mode-only defects visible.

Current gate status at handoff: `lint` and `typecheck` clean; `npm test`
1,858 tests / 203 files; `npm run test:rls` 215 assertions / 33 policy files;
`npm run test:integration` 58 checks. The last two run against local Postgres.

## Mock dataset sync

When running with `NEXT_PUBLIC_MOCK_MODE=1`, the in-memory dataset in
[`src/lib/supabase/mock/dataset.ts`](./src/lib/supabase/mock/dataset.ts)
mirrors the SQL seed:

- [`supabase/seed.sql`](./supabase/seed.sql) — declarative seed rows
- [`supabase/run-seed.ts`](./supabase/run-seed.ts) — programmatic seed runner

**There is no generator** — `dataset.ts` is maintained by hand, and the
three-way sync between it, `seed.sql`, and `run-seed.ts` is entirely manual.

**Rule:** any schema or seed-data change must update **both** the SQL/seed path
and `dataset.ts`, or mock mode and real Supabase will drift (missing tables,
stale columns, or demo personas that only exist in one place).

**Dates are evergreen.** Every date in `dataset.ts` + `extra.ts` is authored
against a fixed anchor of **2026-06-18** (`AUTHORED_NOW` in
[`src/lib/supabase/mock/shift-dates.ts`](./src/lib/supabase/mock/shift-dates.ts)).
At load time `store.ts` slides every date by `(today − 2026-06-18)` days, so the
demo timeline always tracks the current date — upcoming events stay upcoming,
completed events stay recently finished, and the deadline list never becomes a
wall of overdue. When adding rows, date them relative to that 2026-06-18
"present" and the shift takes care of the rest. The shift is applied once per
server start (the demo's natural refresh point).

## Deferred / gated features (deliberate)

These surfaces are **demo-ready but intentionally shallow**, gated on a real
commercial trigger rather than built speculatively:

- **Bright.Runway depth** (venue slot scheduling, recurring sponsorship ops) —
  the boards, packages, and sponsorship views exist; deeper booking/rotation
  logic waits for a **signed venue**.
- **White-label / partner theming** — partner `brand_color` is stored and used
  lightly; full white-label theming waits for a partner who needs it.
- **Partner commission depth** (statements, payout runs, disputes) — tracking
  and status display exist, gated on `partner_admin`; payment execution stays
  in the finance system until reseller volume justifies it.
- **Invoices are display-only by design** — the admin dashboard mirrors
  status; raising and settling invoices happens in the finance system. The
  `createInvoice` / `updateInvoiceStatus` actions exist (tested, unwired) for
  the day billing moves in-portal.
- **Missing personas** (finance, exec read-only, sponsor) — deliberate
  deferrals, not oversights. Add them when a real user of that shape appears.