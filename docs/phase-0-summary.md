# Phase 0 — Foundations: build summary

**Goal**: lock in the bedrock — schema, RLS, profile bootstrap, signed URLs, notification spine sanity, realistic seed data — so every downstream phase has honest data and honest access control.

**Status**: ✅ Complete. All sub-tasks shipped, full test suite green.

---

## What we built

### 0.1 Schema drift reconcile

- New migration `supabase/migrations/20260403000010_schema_reconcile.sql` aligning the DB with what the application code actually reads/writes.
- `quotes` table broadened: `track` allows `'book_now'`; `status` allows `'proposal_sent'` and `'declined'`. New columns `postcode`, `event_date_start`, `event_date_end`, `machine_preference`, `game_preference`, `footfall_estimate_text`, `expires_at`, `declined_at`, `estimated_interactions`, `estimated_leads`, `estimated_impressions`. Legacy columns back-filled into the new ones; indexes added.
- Mis-pointed foreign keys corrected: `campaigns.account_id`, `api_keys.account_id`, `webhook_subscriptions.account_id`, `sponsorship_slots.account_id` now reference `accounts(id)` (were `profiles(id)`).
- New private storage buckets provisioned: `briefings`, `reports`, `studio-deliverables`. RLS: internal users full access; authenticated users get signed-URL read; uploads constrained by `signed-url.ts` validator.
- Application code updated to use the new column names (`footfall_estimate_text`, `expires_at`) — `src/app/actions/quotes.ts`, `src/app/admin/quotes/[id]/ProposalBuilder.tsx`.

### 0.2 Profile bootstrap + persona routing

- Migration `supabase/migrations/20260403000011_profile_bootstrap.sql` installs `handle_new_auth_user()` trigger on `auth.users` insert. Every new sign-in gets a `profiles` row with default role `customer_user`. Back-fill for existing users in the same migration.
- New module `src/lib/auth/bootstrap.ts` adds `ensureProfile()` (app-level safety net, idempotent) and `resolveLandingPath()` (persona-aware redirect: customer → `/`, partner_admin/partner_member → `/partners/[slug]/dashboard`, venue → `/venues/[slug]/dashboard`, internal → `/admin/customer-queue`).
- `src/app/auth/callback/route.ts` wired to both functions.
- `src/lib/auth.ts` `getUser()` lazily calls `ensureProfile()` to cover the password-login path that bypasses the OAuth callback.
- 5 new unit tests in `src/lib/auth/bootstrap.test.ts` covering each persona and the edge cases (existing profile, name fallback, partner.type branching, `/login` redirect prevention).

### 0.3 RLS audit pass + pgTAP coverage

- Migration `supabase/migrations/20260403000012_rls_hardening.sql` tightens policies:
  - `profiles`: users insert/update their own row, internal users manage all.
  - `accounts`: internal users manage.
  - `locations`: world-readable.
  - `partners` / `partner_users`: partner admins manage their own partner; partner admins manage their own partner users.
  - `venues`: partner users can create venues for their partner.
  - `sponsorship_slots`: partner users manage their own slots.
  - `studio_requests`: customers can only update while in `draft/submitted/quoted/approved`.
  - `assets`: customers can only update while in `required/uploaded/under_review/rejected`.
- New pgTAP suites: `rls_partners.sql`, `rls_venues.sql`, `rls_quotes.sql`, `rls_catalog.sql`, `rls_reports.sql`, `rls_telemetry.sql`, `rls_profiles.sql`. Shared fixtures in `supabase/tests/_fixtures.sql`.
- Documentation updated: `supabase/tests/README.md` lists the new suites.

### 0.4 Signed URL pipeline

- New module `src/lib/storage/signed-url.ts`:
  - `BucketConstraints` per bucket: MIME allow-list + max bytes.
  - `validateUpload(bucket, mime, sizeBytes)` returns `{ ok: true }` or `{ ok: false, reason }`.
  - `storagePathFor(bucket, scopeId, filename)` deterministic, sanitised path with timestamp prefix.
  - `createSignedReadUrl()` and `createSignedUploadUrl()` wrap the service-role client.
- `src/app/actions/assets.ts` refactored: stores the storage **path** in `assets.file_url`, not a public URL. Validates uploads before write.
- `src/lib/queries/assets.ts` exposes `attachSignedUrls(assets)` which mints short-lived signed URLs on read and tolerates legacy (already-URL) values.
- `src/types/index.ts` `Asset` carries both `filePath` and optional `fileUrl` so the UI never accidentally exposes a path it can't open.
- Test coverage: `src/lib/storage/signed-url.test.ts` exercises every bucket × accept/reject MIME, oversized payloads, and path sanitisation.

### 0.5 Notification spine sanity

- New archetype `booking.received` added to `src/lib/notifications/archetypes.ts` so the booking flow has a real template + trigger waiting for Phase 1.
- `submitBookNowQuote` now dispatches `booking.received` on success, wrapped in `try/catch` so a notification failure does not abort the booking.
- New test suite `src/lib/notifications/spine-sanity.test.ts`:
  - every archetype renders without throw,
  - every archetype's owner resolver returns a known persona,
  - reminder cadences are plausible (≥ 1 hour, ≤ 30 days),
  - class-A archetypes are never silent (must have at least an in-app channel).
- Existing test files fixed where TypeScript tightened up (`dispatch.test.ts` cast, `triggers.test.ts` valid `Stage` value).

### 0.6 Seed data

- `supabase/seed.sql` rebuilt from scratch with `on conflict (id) do nothing` so it's safe to re-run.
- Coverage: 3 personas (customer / internal / partner), full catalog (machines, games, packages, package add-ons, case studies), locations, 2 partners with partner users, venues + placements + sponsorship slots, machine instances + telemetry events, benchmarks, leads, quotes + line items, partner attributions, event reports, briefing responses, QA items, logistics entries, studio requests.
- Every persona has at least one event in every meaningful lifecycle stage, so every UI surface has something real to render.

### 0.7 Test suite

- `npm test` → **580 passed / 580 total** across 54 test files.
- `npm run typecheck` → clean (0 errors).
- `npm run lint` → 0 errors, 11 pre-existing warnings (unused imports / variables — out of scope, tracked).
- `npm run build` → green production build. As part of fixing this, the pure helper `normalisePipedriveDealId` was moved out of `src/app/actions/events.ts` (Next 16 rejects non-async exports from `"use server"` files) into `src/lib/pipedrive/normalise.ts`.
- pgTAP suite: cannot run locally (Docker not running on dev box). Wired into CI in `.github/workflows/test.yml` so every PR runs it via `supabase start` + `npm run test:rls`.
- CI workflow also now runs `npm run build` so we never merge a broken build again.

---

## Stubs added this phase

See [`STUBS-TO-REPLACE.md`](../STUBS-TO-REPLACE.md). Headline items:

- Stripe keys (Phase 1)
- Virus scan on uploads (Phase 8)
- Customer/partner logos (Phase 1 / 5)
- Legal copy (Phase 1)
- Pinned auth callback origin (Phase 8)

---

## Demo locally

```bash
# from project root
docker start  # if docker desktop is closed
supabase start
npm run db:seed
npm run dev
# → http://localhost:3000
```

Sign in with any seeded persona to verify the persona-routing lands you on the right portal.

---

## What's next

**Phase 1 — Public funnel.** Catalog filters wired to DB, quiz end-to-end with `QuizResultAddons`, proposal/booking flows that actually write rows, fire the `booking.received` archetype we just installed, redirect to the customer portal. Stripe stays stubbed but the rest is real.

> Approval gate: type "proceed to phase 1" once you've walked the demo and you're happy with what's here.
