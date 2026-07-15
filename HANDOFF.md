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

```bash
nvm use 22          # any Node 20+ works (see "engines" in package.json)
npm install
cp .env.example .env.local   # fill Supabase (+ optional Resend / Cloud / Pipedrive)
npx supabase db push         # if using a real project
npx tsx supabase/seed-users.ts
npx tsx supabase/run-seed.ts
npm run dev
```

Open **http://localhost:3000**.

### Mock mode

Set `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local` to run against the in-memory /
mock Supabase dataset (`src/lib/supabase/mock/`) without a live project. Useful
for UI demos and offline work. Turn it off for real auth, RLS, and storage.

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
npm test
```

Also available: `npm run test:rls` (Docker), `npm run test:e2e` (Playwright).
Conventions: [`docs/testing.md`](./docs/testing.md), [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Stubs and integrations

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
| `DEMO_ROADMAP.md` | Live demo script |
| `CHANGELOG.md` | What shipped when |
| `README.md` | Setup, structure, scripts |

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
product**. Production soak against live Supabase remains a separate CTO track
(mock mode stays the default demo runtime).

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

Current gate status at handoff: `lint`, `typecheck`, and `test` (977 tests /
99 files) all green.

## Mock dataset sync

When running with `NEXT_PUBLIC_MOCK_MODE=true`, the in-memory dataset in
[`src/lib/supabase/mock/dataset.ts`](./src/lib/supabase/mock/dataset.ts)
mirrors the SQL seed:

- [`supabase/seed.sql`](./supabase/seed.sql) — declarative seed rows
- [`supabase/run-seed.ts`](./supabase/run-seed.ts) — programmatic seed runner

**There is no generator** — `dataset.ts` is maintained by hand, and the
three-way sync between it, `seed.sql`, and `run-seed.ts` is entirely manual.

**Rule:** any schema or seed-data change must update **both** the SQL/seed path
and `dataset.ts`, or mock mode and real Supabase will drift (missing tables,
stale columns, or demo personas that only exist in one place).

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