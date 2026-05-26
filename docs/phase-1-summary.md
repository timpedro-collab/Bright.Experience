# Phase 1 — Public funnel: build summary

**Goal**: turn the public marketing & acquisition funnel into something a real customer can land on, navigate, and complete — quiz, proposal, booking with stubbed Stripe, legal pages, partner co-brand landing, and the share-token-gated report viewer.

**Status**: ✅ Complete. All sub-tasks shipped, 594/594 vitest tests green, typecheck + lint + build green, three new Playwright specs added for the Phase 1 journeys.

---

## What we built

### 1.1 Catalog

- Filters wired to the DB via a new reusable `src/components/catalog/CatalogFilters.tsx` (URL-param driven, server-rendered).
  - `/catalog/packages` honours `?tier=`.
  - `/catalog/case-studies` honours `?filter=` (event type).
  - `/catalog/games` is brand new with `?category=` filter.
- Centralised `loading.tsx` + `error.tsx` boundaries under `src/app/(public)/catalog/` so every catalog sub-route gets the same skeleton + retry UX.
- Every query (`src/lib/queries/{machines,packages,case-studies,games}.ts`) now logs Supabase errors via `console.warn` so silent zero-result pages get caught in production.
- `case-studies/[slug]` now renders `stats_json`, `testimonial_quote`/`testimonial_author`, and a CTA into `/quiz`. `packages/[slug]` renders `description` and links to the parent machine.
- Public nav (`src/app/(public)/layout.tsx`) updated: Machines · Games · Packages.

### 1.2 Quiz

- 6th step "Industry/brand-specific" signals layered on top of the existing 5 archetypes.
- `getRecommendation()` rewritten in `src/components/catalog/quiz-data.ts` to (a) reference real seeded `machineSlug`/`packageSlug` values and (b) merge capabilities across multi-select objectives.
- `QuizMatchCard` proposal CTA now appends `signals.industry` to the URL params so the proposal form pre-fills.

### 1.3 Proposal flow

- `submitProposalIntake` (in `src/app/actions/quotes.ts`):
  - Now resolves `packageSlug` → `package_id` on the server and stores it.
  - Reads the `bb_partner` cookie and records attribution via `recordAttribution({ partnerCode, quoteId })`.
  - Wraps the `proposal.requested` archetype dispatch in `try…catch` so a notification provider hiccup never blocks the customer write.
- `IntakeWizard` now passes `packageSlug` and surfaces server-side validation errors inline.

### 1.4 Booking flow

- Configure → checkout → confirmation rebuilt with server-side validation and pricing:
  - `src/app/(public)/book/configure/page.tsx` is now a Server Component that hydrates the wizard with the chosen package (incl. add-ons + `capability_slug`), machines, and games.
  - New `ConfigureClient` (client) owns the wizard state and hands real UUIDs + canonical capability slugs to the checkout page.
  - `ConfiguratorSteps` rewritten to drive off catalogue data; `capability_slug` replaces opaque add-on IDs.
  - `src/app/(public)/book/checkout/page.tsx` is server-rendered, displays a price recalculated from the chosen UUIDs, posts via `submitBookNowQuote`.
  - `submitBookNowQuote` re-validates the package is `is_bookable=true`, recomputes the total server-side from the DB, attaches `bb_partner` attribution, dispatches `booking.received`, and inserts a `quotes` row with `status='booked'`. Stripe call is a clearly-labelled STUB.
  - `src/app/(public)/book/confirmation/[id]/page.tsx` reads via the new `getBookingReceipt` (service-role) helper, validates the id as a UUID, renders a receipt-safe view for the anonymous customer.

### 1.5 Legal & static pages

- New `src/components/public/LegalShell.tsx` — shared ridge hero, eyebrow, last-updated date, "REPLACE BEFORE LAUNCH" banner.
- `/privacy` and `/terms` refactored onto `LegalShell` with a static `LAST_UPDATED` constant (no impure `new Date()` on every render).
- `/how-it-works` continues to live on the editorial design language (three-step walkthrough, ridge hero, brand CTA).

### 1.6 Partner public landing

- `/p/[code]` rewritten as a co-branded landing page (was previously a hard redirect).
  - Pulls partner config via `getPartnerByCode` (now status-gated to `'active'`, narrow column list).
  - Sets the `bb_partner` httpOnly cookie with `path:"/"`, 30-day TTL.
  - Hero uses the partner's brand colour for the ridge artwork; co-brands name in eyebrow + headline.
  - Friendly not-found card if the code is unknown / inactive.
- New migration `supabase/migrations/20260403000013_partner_public_read.sql` adds an RLS policy so `anon` can `SELECT` active partners (narrow column list).
- `recordAttribution` (in `src/app/actions/partners.ts`) accepts either `partnerId` or `partnerCode` and resolves + status-checks the partner before writing.
- `/p/clear` now correctly deletes the cookie with `path:"/"`.

### 1.7 Marketing report share links

- New module `src/lib/reports/normalise.ts`:
  - `normaliseMetrics()` reads both camelCase (action output) and snake_case (seed/legacy) keys into a stable shape.
  - `normalisePredictions()` reads both top-level and `raw.*` (outcome_estimates_json) keys.
  - `normaliseHighlights()` enforces the `{ url?, caption?, stat? }[]` contract; accepts bare strings as captions.
  - `costPerLeadPence()` derives cost-per-lead consistently.
- `/report/[token]` rewritten to use the normaliser — KPIs no longer silently land on zero because of key drift.
- `/events/[id]/reports` also routed through the same normaliser; the live telemetry snapshot is preferred over the static report blob where both exist.
- `ReportHighlights` type widened to `url?: string` to match the normaliser's contract (gradient placeholder still renders when no URL).
- 13 new unit tests in `src/lib/reports/normalise.test.ts`.

### 1.8 Playwright coverage

Three new specs, all guest-only (no test-mode endpoints required):

| Spec | What it proves |
| --- | --- |
| `e2e/public-quiz-to-booking.spec.ts` | Guest walks configure → checkout → confirmation. |
| `e2e/public-partner-attribution.spec.ts` | `/p/[code]` sets `bb_partner` cookie + co-branded hero; unknown code 404s. |
| `e2e/public-report-share.spec.ts` | Published share token renders; unknown token 404s. |

`e2e/README.md` updated.

---

## Tests

```
vitest:     55 files, 594 tests passed
typecheck:  ✅ pass
lint:       ✅ pass (10 pre-existing unused-var warnings)
build:      ✅ pass (next build with stub env vars)
```

---

## Stubs added this phase

See [STUBS-TO-REPLACE.md](../STUBS-TO-REPLACE.md) for the full list. Phase 1 added:

- Stripe checkout intent (currently records the `quotes` row but skips `paymentIntent.create()`).
- "REPLACE BEFORE LAUNCH" banner on legal pages.
- Catalog hero photography (monogram stand-ins).
- `/api/test/login` + `/api/test/reset` Playwright endpoints (only matter once Phase 2 internal-persona specs need them).
- Booking confirmation copy.

---

## Demo links (local)

- `/catalog`, `/catalog/machines`, `/catalog/packages`, `/catalog/games`, `/catalog/case-studies`
- `/quiz` → result → `/proposal`
- `/book/configure?package=bright-vend-single-day` → `/book/checkout` → `/book/confirmation/<id>`
- `/p/BB-NORTH001` (Northern Events co-branded landing)
- `/report/share-samsung-launch` (public share token from seed)
- `/privacy`, `/terms`, `/how-it-works`

---

## What's deliberately not in this phase

- Live Stripe — the wire-up lives in Phase 8 once the live keys are provisioned.
- Server-rendered email previews for the booking confirmation — the archetype fires; the rich-template tuning is Phase 7 cross-cutting.
- Customer "next step" CTAs on `/events/[id]` after a booking — that's Phase 3 (customer surfaces).
