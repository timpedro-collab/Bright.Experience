# Stubs to replace before launch

Every entry here is a clearly-labelled placeholder that ships behind a real surface so the platform compiles, renders, and tests cleanly today — but **must be swapped for the real thing** before we hand the keys to customers.

Each row tells you:
- **What** is currently stubbed
- **Where** in the codebase the stub lives (grep-able)
- **Why** it was stubbed (so the next engineer doesn't second-guess us)
- **Phase / Owner** that will own the replacement

---

## Phase 0 — Foundations (this phase)

| What | Where | Why stubbed | Replace in |
| --- | --- | --- | --- |
| ~~Stripe API keys / webhook secret~~ | ~~`.env.example` placeholders; checkout flow uses fake intent IDs prefixed `pi_stub_`~~ | ~~Real Stripe account / Connect setup is a business onboarding decision~~ | **REMOVED** — business decision: no in-portal payments. Bookings are confirmed + invoiced separately by an account manager. All Stripe code/env/webhooks deleted. |
| Customer / partner logos in seed data | `supabase/seed.sql` — references monogram SVGs at `/public/brand/logos/*.svg` | We don't have rights to real customer logos until contracts are signed | Phase 1 (catalog) + Phase 5 (partner portal) — replace with the signed-off brand kit |
| ~~Legal copy on `/privacy`, `/terms`~~ | ~~`src/app/(public)/privacy/page.tsx`, `src/app/(public)/terms/page.tsx`~~ | ~~Lorem-shaped placeholder; needs legal review~~ | ~~Done — pages built with `LegalShell`~~ |
| Virus scan on uploaded assets | `src/lib/storage/scan.ts` — `scanUpload` hook is wired into all upload actions but is a graceful no-op until `FILE_SCAN_URL`/`FILE_SCAN_TOKEN` are set | We don't have a chosen AV provider (ClamAV vs Cloudmersive vs S3 Object Lambda) yet; the integration point is built and tested, just unconfigured | Point `FILE_SCAN_URL` at a ClamAV REST shim / cloud AV endpoint once chosen |
| Real auth callback redirect domain | `src/app/auth/callback/route.ts` — uses `request.nextUrl.origin` which trusts the incoming host | Fine for local + Vercel previews; production deploy may need an allow-list | Phase 8 (auth hardening) — pin to `NEXT_PUBLIC_SITE_URL` once domain is locked |
| `pg_prove` not run locally | `package.json` `test:rls` script + `.github/workflows/test.yml` | Docker not running on the dev machine during Phase 0 implementation; pgTAP tests do run in CI on every PR | Already wired in CI — no replacement needed, just a heads-up |

---

## Phase 1 — Public funnel

| What | Where | Why stubbed | Replace in |
| --- | --- | --- | --- |
| ~~Stripe checkout intent~~ | ~~`src/app/(public)/book/checkout/page.tsx`, `src/app/actions/quotes.ts::submitBookNowQuote`~~ | ~~The submit creates a `quotes` row and skips `paymentIntent.create()` until keys are live~~ | **REMOVED** — `submitBookNowQuote` now creates a `submitted` quote and auto-provisions the event; checkout collects details only and routes to invoicing. No payment is taken in-portal. |
| ~~Legal copy banner~~ | ~~`src/components/public/LegalShell.tsx` "REPLACE BEFORE LAUNCH" notice~~ | ~~Marker so we never accidentally ship lorem~~ | ~~Done — legal copy in place~~ |
| Catalog hero photography | `/public/catalog/*.jpg` paths in seed | Stand-in monogram tiles; not the brand photoshoot | Phase 9 (final polish) — replace with the signed-off media kit |
| `/api/test/login`, `/api/test/reset` Playwright endpoints | Referenced by `e2e/fixtures/auth.ts` + `e2e/fixtures/data.ts` | The three new Phase 1 specs (`public-quiz-to-booking`, `public-partner-attribution`, `public-report-share`) are intentionally guest-only and don't need these endpoints. Internal-persona specs still do. | Phase 2 (internal ops) — the first phase that *needs* a logged-in persona end-to-end |
| Booking confirmation copy | `src/app/(public)/book/confirmation/[id]/page.tsx` | Headline + next-steps body are placeholder customer voice | Phase 9 (microcopy) — final copy pass |

---

## Role-aware delivery — follow-ups from the visibility audit

These came out of the "what is shown to who" audit. The view-bleed, access
guards, and on-behalf controls are **done**; the items below are deferred
because they're new features (not just visibility fixes).

| What | Where | Why deferred | Replace / build in |
| --- | --- | --- | --- |
| **Configuration → Bright.Studio "do it for me" upsell** | `src/app/events/[id]/configuration/page.tsx`, `GameConfigForm`, `ProductConfigForm` | Customers can fill in the game/prize config themselves today. The intended flow also lets them **click-to-select** "have Bright.Studio do this for me", with clear per-line pricing that totals up; on confirm it should create to-dos in the internal Bright.Studio queue. Needs a pricing/selection UI + task generation + (likely) a `studio_requests` line-item model — a feature build, not a visibility tweak. | Next feature sprint. Wire selections → `requestStudioFixForAsset`-style action that seeds Studio tasks. |
| **Expose Configuration (and Studio storefront) to customers** | `src/lib/event-access.ts` (`CUSTOMER_SECTIONS`) | Role→section visibility is now a single matrix (`event-access.ts`) that drives both the nav AND server guards. Configuration + Studio are currently scoped to internal roles; the customer-facing Configuration self-serve + Bright.Studio upsell isn't built yet, so customers are redirected from those pages rather than shown a half-finished form. | Add `"configuration"` / `"studio"` to `CUSTOMER_SECTIONS` once the upsell above lands and the storefront copy is signed off. The guards + nav update automatically. |
| **Granular deadline ownership labels** | `src/components/events/DeadlineTimeline.tsx` | Internal deadline rows show a coarse "Customer / Internal" tag rather than the specific team (`Bright.Blue creative`, `QA`, etc.) from `src/lib/ownership.ts`. | Map rows through `ownerForTask` + `OWNER_DISPLAY_LABEL` for team-level labels. |
| **QA / event_reports RLS hardening** | `supabase/migrations/*` | Page-level guards block customers from QA + draft reports today (and the print/export routes now check publish status). RLS still technically allows customer SELECT on `qa_items` / unpublished `event_reports` — defense-in-depth gap, not an active leak. | DB owners post-handoff: tighten SELECT policies to `is_internal_user()` / `is_published = true`. |

---

## How to use this file

1. Each phase appends a section like the one above when it ships.
2. Anything checked off (replaced with the real implementation) gets struck through but **stays in the file** for audit history.
3. Before launch we run a final pass and confirm zero un-struck rows remain.

---

## Convention for stub comments in code

Every stub is grep-able. Inside the file we use one of:

```ts
// STUB: <one-line explanation> — replace in Phase <N>
```

or for fenced data:

```sql
-- STUB: <one-line explanation>
```

Search for `STUB:` to find them all.
