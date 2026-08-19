# 13 — Dev Handover Priorities

> **Audience:** the dev team / incoming CTO receiving this codebase.
> **Purpose:** the single prioritized worklist for taking the portal from
> demo-complete to fully functional in production. Work top-to-bottom.
>
> This document is **kept current by rule** (`.cursor/rules/handover-documentation.mdc`):
> any change that adds an integration point, closes one of these items, or
> introduces a new security consideration must update this file in the same
> change.
>
> Companion references:
> - [`docs/10-integrations.md`](./10-integrations.md) — every external contract in detail
> - [`STUBS-TO-REPLACE.md`](../STUBS-TO-REPLACE.md) — grep-able stub registry
> - [`docs/11-cloud-handoff.md`](./11-cloud-handoff.md) — full schema + Cloud handoff
> - [`HANDOFF.md`](../HANDOFF.md) — day-1 orientation

---

## P0 — Activation wiring (config only, no new code)

The portal degrades gracefully when these are unset — which means production
silently runs in demo behaviour until each one is configured. All are
documented in `.env.example` and `docs/10-integrations.md` §8.

| # | Item | What to do | Proof it works |
|---|------|-----------|----------------|
| P0.1 | **Production Supabase** | Create project, `npx supabase db push`, run seeds, set `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`. Turn `NEXT_PUBLIC_MOCK_MODE` **off**. | Login + RLS behave; `npm run test:rls` green in CI |
| P0.2 | **`NEXT_PUBLIC_SITE_URL`** | Set to the production domain. Auth-callback redirects pin to this value (`src/lib/auth/safe-redirect.ts`); email links depend on it. | Password reset lands on the right domain |
| P0.3 | **Resend email** | Verify sending domain, set `RESEND_API_KEY`, `FROM_EMAIL`, `STUDIO_TEAM_EMAIL`, `SALES_TEAM_EMAIL`. Until set, every email (deadline reminders, digests, proposal-ready, invites) is console-logged, not sent. | `sendProposalReadyEmail` arrives in a real inbox |
| P0.4 | **Cron auth + schedules** | Set `CRON_SECRET`; confirm `vercel.json` schedules for `/api/cron/reminders`, `digest`, `pipedrive`, `reports`, `purge-leads`. | Cron routes 401 without bearer; reminders fire at 09:00 UTC; purge runs 02:30 UTC |
| P0.5 | **Cal.com scheduling** | Create the 15-min event type (location: Google Meet), set `NEXT_PUBLIC_CALCOM_LINK`, add the webhook with `CALCOM_WEBHOOK_SECRET` (4 triggers — see `docs/10-integrations.md` §3b). | A test booking writes `walkthrough_scheduled_at` on the quote |
| P0.6 | **Bright.Blue Cloud webhooks (inbound)** | Set `BRIGHTBLUE_WEBHOOK_SECRET` in both systems; point Cloud at `/api/webhooks/brightblue`. Verify first with `scripts/simulate-cloud-webhook.ts`. | Simulator payloads populate live dashboard + leads |
| P0.7 | **Cloud outbound API** | Set `BRIGHTBLUE_API_URL` + `BRIGHTBLUE_API_KEY` once Cloud exposes the three endpoints in `src/lib/brightblue/client.ts`. | Live snapshot polling falls back to Cloud, not just webhook data |
| P0.8 | **Sentry** | Set `NEXT_PUBLIC_SENTRY_DSN` (+ org/project/token in CI for source maps). | A thrown test error appears in Sentry with readable stack |
| P0.9 | **Booking auto-provision** | Set `BOOKING_AUTO_PROVISION=true` in production only — accepted proposals / book-now then auto-create the account, event workspace, and customer invite. | Book-now submission produces a live event + invite email |
| P0.10 | **Pipedrive** | Configure via `/admin/integrations/pipedrive` (token lives in `pipedrive_config`); `PIPEDRIVE_API_TOKEN` env is a local-dev override only. | Outbox rows drain to real deal notes on the hourly cron |

---

## P1 — Integration builds (new code; contracts already specified)

These require engineering, but the contract and integration point already
exist in the codebase — none is a green-field design problem.

### P1.1 Cloud event-ID assignment push (the first thing real machines need)

Three of four inbound webhook types carry a portal `event_id` that Cloud has
no native knowledge of. Before a physical machine can send usable data, Cloud
must learn which portal event it serves.

- **Decision needed:** push-on-assignment (recommended) vs resolve-on-ingest —
  trade-offs written up in `docs/10-integrations.md` §1c.
- **Work:** add `PUT /machines/:serial/assignment` to
  `src/lib/brightblue/client.ts`, call it when ops sets
  `machine_instances.current_event_id`, and implement the receiving side in Cloud.
- **Acceptance:** telemetry from a reassigned machine lands on the correct
  event, including offline batches replayed after reassignment.

### P1.2 Machine configuration sync (portal → machine) — **portal side shipped 2026-07-25**

The portal is the source of truth for event configuration (game/prize setup in
`GameConfigForm`, capture-form fields, and the P2 capture-quality settings
below). The portal side of the sync now exists:

- **Shipped (portal):** the versioned wire contract
  (`src/lib/brightblue/config-payload.ts`, `EventConfigPayload` v2 — game,
  prizes, capture form fields, capture-quality rules, consent copy, retention,
  branded-landing flag, `capture_method`, and a `machines[]` array carrying a
  fully-resolved config per deployed unit) and `pushEventConfig` in
  `src/lib/brightblue/client.ts` (`PUT /events/:id/config`). Submitting the
  configuration fires the push (fire-and-forget; skipped + logged until
  `BRIGHTBLUE_API_URL`/`KEY` are set). Contract doc:
  `docs/10-integrations.md` §1b.
- **Remaining (Cloud/machine):** implement the receiving endpoint and make the
  machine capture flow consume the payload. This is the contract every P2
  feature enforcement hangs off.
- **Acceptance:** editing config in the portal changes what the machine's
  capture flow enforces without a firmware redeploy.

### P1.3 Distributed rate-limit store

`src/lib/rate-limit.ts` is invoked on every public entry point but backs onto
an in-memory `Map` — serverless instances don't share buckets and limits reset
on cold start.

- **Work:** back `checkRateLimit` with Upstash/Vercel KV, same signature
  (`docs/11-cloud-handoff.md` D3).
- **Acceptance:** limits hold across concurrent serverless instances.

### P1.4 Upload antivirus endpoint

`scanUpload` (`src/lib/storage/scan.ts`) is wired into all upload actions but
no-ops until `FILE_SCAN_URL` is set.

- **Work:** choose the AV provider (ClamAV REST shim vs cloud API), stand it
  up, set `FILE_SCAN_URL` / `FILE_SCAN_TOKEN`.
- **Acceptance:** an EICAR test file upload is rejected and logged.

### P1.5 Badge-scan capture (registration-provider integration) — *trigger-gated*

Only start this when a booked show requires it; until then it stays bespoke
services work per event (see P3). What exists today is the configuration
surface: `game_configurations.capture_method` (`form` / `badge_scan` / `both`)
is authored in the portal and shipped in the config payload, but nothing scans
a badge yet. Bright.Blue doesn't own the badge data — the show's registration
provider does (Cvent, Swapcard, RainFocus, or the organizer's own stack).

- **Work:** pick the first provider, agree a per-show credential exchange, and
  have the machine resolve a scanned badge to a contact record. Send it back
  through the existing `lead.captured` webhook with `contact.badge_id` set so
  duplicate blocking can key on the badge rather than an email
  (`docs/10-integrations.md` §1b, badge-scan contract).
- **Why it matters:** organizers ask for it because scanned contacts are
  higher-quality than typed ones, and it removes the staff who currently
  police duplicate entries by hand.
- **Acceptance:** a scan at a `badge_scan` unit unlocks a play and produces a
  lead carrying `badge_id`; a second scan of the same badge is blocked.

---

## P2 — Feature requirements from client feedback (Adyen call, 23 Jul 2026)

Direct requests from our strongest reference client. Each splits into
**portal work** (this codebase: configuration + reporting) and **machine-stack
work** (enforcement at the point of capture — the on-machine web form / QR
landing page, owned by the dev team). The portal never sees the attendee, so
it cannot enforce these itself; it ships the config contract (P1.2) and the
proof in reporting.

### P2.1 Capture quality bundle — *highest value-to-effort in this list*

Three rules, one per-event config block, on by default for EU-market events:

1. **Business emails only** — reject free/personal domains (gmail.com,
   yahoo.co.uk, btinternet.com, comcast.net, …) at the capture form with a
   "please use your business email" error. The default list targets the UK/US
   core markets; regional lists (e.g. Central Europe) are added per event in
   the UI. Blocklist must be maintainable per region without redeploy.
2. **One entry per person** — dedupe by normalized email and (where badge
   scanning is used) badge ID; a repeat visitor gets a friendly "already
   played" screen, not a second prize.
3. **GDPR consent** — mandatory checkbox with templated processor/purpose
   copy ("data processed by Bright.Blue as a partner of {client}, used only
   for {event} follow-up") on every EU capture form.

- **Portal work — shipped 2026-07-25:** capture-quality section in
  `GameConfigForm` (`CaptureQualitySection`) with an editable regional
  blocklist (`src/lib/capture-rules.ts`, defaults on), consent copy templating
  (`{brand}` / `{event}` tokens), `leads.consented_at` storage (webhook
  ingests `contact.consented_at` / `consent`), and report proof — the
  post-event report counts `capture_rejected_domain` /
  `capture_duplicate_blocked` telemetry into a "Capture quality" card.
- **Machine-stack work — remaining:** enforce all three in the capture flow
  (rules arrive via the P1.2 config payload `capture_rules` block); log
  rejections as the two telemetry event types above so the portal can report
  them.
- **Acceptance:** an EU event created with defaults blocks a gmail.com entry,
  blocks a second play by the same email, and stores consent state per lead.

### P2.2 Live stock remaining + reload estimate

- **Requirement:** the live dashboard (`LiveDashboardClient`) shows prizes/stock
  remaining per machine and a burn-rate reload estimate ("~20 min at current
  pace"); optional notification to ops when a threshold is crossed.
- **Portal work — shipped 2026-07-25:** `event_metrics_snapshot` gained
  `stock_remaining` / `stock_capacity`; the webhook recomputes both on every
  `telemetry.batch` (capacity = `product_configurations.total_units`, minus
  prizes dispensed) and dispatches a `machine.stock_low` notification to the
  ops lead when the level first crosses 15%. The live dashboard shows a stock
  bar + "empty in ~X min at current pace" estimate.
- **Machine-stack work — remaining:** stream `prize_awarded` telemetry
  reliably (the depletion source); optionally send explicit stock counts for
  multi-lane accuracy.
- **Acceptance:** during a live event, stock decrements in near-real-time and
  a reload notification fires at the configured threshold.

### P2.3 Branded capture landing page (paid upsell)

- **Requirement:** one tick-box that applies the already-uploaded brand kit
  (logo, colours, fonts) to the QR data-capture landing page. Priced as an
  upsell line item. Auto-generated preview is a later flourish, not MVP.
- **Portal work — shipped 2026-07-25:** `branded_landing` toggle in the
  configuration form, the `branded-landing-page` capability (placeholder
  price — **owner to confirm**, see `OWNER-TODO.md`), and the flag on the
  config payload.
- **Machine-stack work — remaining:** landing-page renderer consumes the
  brand kit.
- **Acceptance:** ticking the box changes the rendered landing page branding
  with no extra asset uploads from the customer.

### P2.4 Lead retention window

- **Requirement:** per-event "leads auto-delete after N days" setting
  (default **60**, per Adyen's standard terms), enforced by a backend deletion
  job, with the policy stated in the post-event report footer.
- **Shipped 2026-07-25:** `game_configurations.retention_days` setting
  (bounded 1–730), the `/api/cron/purge-leads` daily cron (per-event windows +
  a default 60-day sweep, logged per purge), and the retention footer on both
  the portal report page and the public share view (`RetentionNotice`).
- **Remaining:** none in the portal — verify the cron runs in production
  (P0.4) and that exports never cache purged leads.
- **Acceptance:** leads older than the window disappear from the dashboard
  and exports; the purge is auditable.

---

## P2b — Informa Tampa pilot: tracking requirements per machine

The Tampa show deploys three units. This section specifies the two
**sponsor-sold** placements — the Registration machine and the Experiential
Media Lounge machine. (The third, the Rebooker on Informa's own booth, is an
organizer service with its own participation tracking; spec it when the
order is signed.) Everything the pitch promises a buyer
(`src/lib/informa/products.ts` `measures[]`, the sample report in
`src/lib/informa/sample-report.ts`) must trace back to a tracked datum here —
nothing in the report may be estimated.

Both units are **badge-gated**: a badge scan unlocks the game, so a booked
Tampa is the trigger that promotes badge-scan capture (P1.5) from services
work to platform work — pick the registration provider Informa uses for the
show as the first P1.5 target. Prerequisites for either machine sending usable data:
event-ID assignment (P1.1), config push (P1.2), and the capture-quality
rules (P2.1) enforced at the point of capture.

### Shared baseline — what every Tampa unit must emit

All through the existing inbound contract (`docs/10-integrations.md` §1a),
keyed by `machine_serial` so every datum attributes to one placement:

| Signal | Wire shape | Feeds |
|---|---|---|
| Play started / completed | `telemetry.batch` → `play_started`, `play_completed` (payload: session seconds, game score) | Plays by hour/day, avg session duration, completion rate |
| Opted-in lead | `lead.captured` — contact resolved from the badge provider, `contact.badge_id`, `contact.consented_at` | Lead counts, CPL vs benchmark, sponsor lead file |
| Prize / sample dispensed | `telemetry.batch` → `prize_awarded` (payload: SKU) | Fulfilment reconciled to stock, live stock bar + reload estimate (P2.2) |
| Capture guardrails | `capture_rejected_domain`, `capture_duplicate_blocked` | "Capture quality" report card; duplicate-scan blocking proof |
| Health | `machine.heartbeat` (status, firmware) | Uptime record for the show-day SLA |

Consent is stamped per lead (`consented_at`), retention runs on the
per-event window (P2.4), and **leads belong to the sponsor** — Informa
receives aggregate performance only, never contact data.

### Registration machine — "The Arrival" (Registration Takeover)

The sell is *own the first minutes of every attendee's show*, so tracking
must prove reach against the whole attendee population:

- **Scan-to-play funnel** — every badge scan resolves to an unlock, a
  duplicate block, or a failed scan. One play per badge by default
  (`capture_duplicate_blocked` on rescan, never a reset); the funnel is the
  proof that gating worked.
- **Population penetration** — plays and opted-in leads as a share of
  registered attendance (report divides by the registration count Informa
  provides; the machine only needs accurate uniques by `badge_id`).
- **Engagement by hour from doors-open** — hourly play series with the
  arrival peak visible; this is the headline chart in the sponsor report.
- **Cost per opted-in lead** — computed against placement price and the
  industry benchmark (`INDUSTRY_CPL`, `src/lib/informa/kit-math.ts`).
- **Prize/sample fulfilment** — every win-dispense logged and reconciled to
  loaded stock.

### Experiential Media Lounge machine — "The Draw" (Floor & Lounge Activation)

Same baseline, but this unit is also the **category showcase** — the proof
Informa uses to fill next year's prospectus — so it carries extra
obligations:

- **Dwell** — session seconds on every `play_completed`; avg hands-on dwell
  is the number that differentiates the format from signage, so it must be
  measured, not sampled.
- **Sampling per SKU** — `prize_awarded` carries the SKU so multi-product
  sampling reconciles per product line, with the live stock/reload signal
  (P2.2) active during show hours.
- **Repeat-demand signal** — blocked rescans counted and reported as demand
  ("N attendees came back for a second play"), not discarded.
- **Organizer aggregate cut** — alongside the sponsor's report, an
  anonymized format-performance summary for Informa: plays, dwell, opt-in
  rate, hourly shape. No contact data — this is the dataset their reps
  resell from.

### Acceptance

- Every `measures[]` line on the two product cards maps to a query over
  `telemetry_events` / `leads` rows — demonstrated end-to-end with
  `scripts/simulate-cloud-webhook.ts` before the show.
- A rescan of the same badge produces `capture_duplicate_blocked`, not a
  second lead or prize.
- The 24-hour proof-of-performance report renders every section of the
  sample report (`/pitch/informa/report`) from live rows, and the Informa
  aggregate contains no personally identifiable data.

---

## P3 — Deferred by design (do not build without a trigger)

- **Badge-scan integration (NRF/Merit etc.)** — per-event licence and
  integration; deliver as bespoke services work per event, not a platform
  feature, until a repeatable pattern emerges across 2–3 events. The portal
  already authors `capture_method` and the wire contract is specified, so
  promoting this to platform work is **P1.5** once the trigger fires — a
  booked Informa Tampa fires it (see P2b).
- **CRM sync (Salesforce, Marketo)** — requested as a future step; heavy
  per-tenant work. CSV/Excel/PDF export covers the need today. Revisit when a
  signed global partnership makes it contractual.
- Everything under "Deferred / gated features" in
  [`HANDOFF.md`](../HANDOFF.md) — venue runway depth, white-label theming,
  partner commission depth, in-portal invoicing, extra personas.

---

## Security review — full-system checklist

Run this as a structured pass before launch. **Status** reflects the codebase
at handover: ✅ done, ◑ partial (action listed), ☐ not started.

### Authentication & session

| Status | Item | Detail / action |
|---|---|---|
| ✅ | Session middleware on all app routes | `src/middleware.ts`; `/api/webhooks/*` + `/api/cron/*` are deliberately exempt and enforce their own auth. The public allow-list is exact/segment matching in `src/lib/auth/public-routes.ts` — details below |
| ✅ | Auth-callback redirect pinning | Pins to `NEXT_PUBLIC_SITE_URL`; `next` restricted to same-site paths (`src/lib/auth/safe-redirect.ts`, tested). **Requires P0.2 set in prod** |
| ☐ | Purge demo credentials | Seeded users share `demo-password-123` — production seeding must use invite flow only, never the demo seed users |
| ☐ | Session/cookie settings review | Confirm Supabase auth cookie flags (secure, sameSite) on the production domain |
| ☐ | Two-factor auth | **Not implemented, and no longer claimed.** `/settings` used to advertise "two-factor authentication"; that line is gone. `[auth.mfa]` in `supabase/config.toml` is off with a comment explaining the rest of the work: enrolment screen (QR + TOTP secret), a challenge step on sign-in, and an AAL2 check in the auth gate. Needed before internal admins handle real customer PII at scale |

### Authorization

| Status | Item | Detail / action |
|---|---|---|
| ✅ | RLS on all tables + pgTAP suite | `supabase/tests/rls_*.sql`; QA/reports hardening shipped 2026-07-13. Keep `npm run test:rls` green in CI |
| ✅ | Role→section matrix drives nav AND server guards | `src/lib/event-access.ts` — single source of truth |
| ✅ | Zod validation on every server action | `src/lib/validations/` |
| ◑ | Service-role key audit | `src/lib/supabase/service-role.ts` is server-only; before launch, grep every import and confirm none is reachable from client bundles or driven by unvalidated user input. Note the deliberate exception: `getSlotByPitchToken` / `getSlotPerformance` use it to resolve anonymous sponsor pitch tokens, guarded by token length + expiry checks and a counters-only select |

### Inbound attack surface

| Status | Item | Detail / action |
|---|---|---|
| ✅ | Webhook HMAC verification, fail-closed | Both `/api/webhooks/brightblue` (`x-bb-signature`) and `/api/webhooks/calcom` (`X-Cal-Signature-256`) reject when the secret is unset (503) or the signature is invalid (401) |
| ✅ | Cron bearer auth, no header bypass | `src/lib/cron-auth.ts`; the spoofable `x-vercel-cron` bypass was removed |
| ✅ | Webhook redelivery is idempotent | `telemetry.batch` upserts on `telemetry_events.external_event_id` (keys from `src/lib/webhooks/telemetry-idempotency.ts`), so a Cloud retry can no longer inflate play/prize counts. Unknown machine serials return 200 + a Sentry warning instead of a 500 that would retry forever — see `docs/10-integrations.md` §1a |
| ◑ | Rate limiting | Wired on every public entry point but in-memory — **P1.3** makes it real in serverless |
| ◑ | Upload scanning | Hook wired everywhere, no-op until **P1.4**. Also confirm MIME/size validation on every upload action |

### Data protection & GDPR

| Status | Item | Detail / action |
|---|---|---|
| ✅ | Private storage with signed URLs | `event-assets` bucket, `src/lib/storage/signed-url.ts` |
| ✅ | Lead retention + deletion | **P2.4 shipped** — `/api/cron/purge-leads` hard-deletes on the per-event window (default 60d) and logs each purge. Verify the schedule runs in production (P0.4) |
| ◑ | Consent capture per lead | **P2.1(3)** — `leads.consented_at` is stored and the webhook ingests it; remaining: the machine capture flow must actually require + send it (config payload `consent_required`) |
| ◑ | Camera / sentiment claims vs reality | The sales claim is "never stores imagery; anonymized + aggregated only." That processing lives in the Cloud/firmware stack — the dev team must verify the pipeline matches the claim before any EU event, and document it for DPIA requests |
| ◑ | Shareable report links | Confirm share tokens are unguessable and consider expiry — they expose event metrics without login |
| ◑ | Sponsor pitch links (`/sponsor/:token`) | Capability URL: the token is the credential. Server-side it is 24 bytes of `randomUUID` entropy, expiry-checked, revocable/rotatable, `noindex` via metadata + `X-Robots-Tag`, and the query selects counters only — never lead PII (`src/lib/queries/organizers.ts`, tested). Before launch confirm the page never appears in referrer logs shared with third parties |
| ☐ | Data-processing agreement surface | Privacy/terms pages exist with real copy; legal should re-review once retention + consent land |

### Secrets & configuration

| Status | Item | Detail / action |
|---|---|---|
| ✅ | `.env.example` documents every var with purpose | Never commit `.env.local` |
| ☐ | Production secret storage | All secrets in Vercel/CI env settings; rotate anything ever pasted into a chat, doc, or screen share during the build phase |
| ☐ | Sentry PII scrubbing | Confirm `beforeSend` scrubs emails/names from error payloads before enabling the DSN in production |

### Application hardening

| Status | Item | Detail / action |
|---|---|---|
| ✅ | Security headers / CSP | CSP, HSTS and per-route `frame-ancestors` ship from `lib/security/headers.ts`. Details below |
| ◑ | Dependency audit | `npm audit` + lockfile review as a recurring CI step. Current state below |
| ✅ | Error-detail hygiene | Server actions return `{ success, error }` without internal detail; Sentry captures the full context server-side |
| ◑ | Keyboard access | The two hand-rolled overlays (catalogue lightbox, product tour) and the unlabelled filter selects are fixed — see below. A full WCAG pass across every screen has not been run |
| ☐ | Backup & restore | Confirm Supabase PITR/backup tier and run one restore drill before real customer data lands |

### Security headers

Every response carries a Content-Security-Policy built by
[`src/lib/security/headers.ts`](../src/lib/security/headers.ts) and applied from
`next.config.ts`. The policy is derived rather than hard-coded, because Supabase
and Sentry live on a different host in every environment and the local stack is
plain HTTP.

- **Framing.** `frame-ancestors 'none'` plus `X-Frame-Options: DENY` everywhere
  except `/venues/[slug]/advertise`, which is the page venues iframe into their
  own site (`/venues/[slug]/embed` is the authenticated generator that produces
  that snippet and previews it). That one route gets `frame-ancestors *` and no
  `X-Frame-Options`, since the header has no "any site" value. Next merges
  matching `headers()` entries and can't remove one, so the broad rule excludes
  the path by regex instead.
- **HSTS.** Two years, `includeSubDomains; preload`, production only — pinning
  `localhost` to HTTPS would break every other project on a developer's machine.
- **`script-src` keeps `'unsafe-inline'`.** The app ships an inline theme script
  (`app/layout.tsx`) to avoid a flash of the wrong palette, and Next inlines the
  RSC payload on every response. The alternative is a per-request nonce, which
  per Next's own guidance forces *every* page to render dynamically — including
  the static marketing pages. The upgrade path is a nonce in `proxy.ts`; do it
  when the static pages no longer matter, or when SRI leaves experimental.
- **Adding an origin.** Add it in `headers.ts` next to the feature that needs it
  and extend `headers.test.ts`. Currently allowed beyond `'self'`: the Supabase
  project (REST, realtime websocket, storage), the Sentry DSN host, Cal.com
  (booker script + iframe), the image hosts in `images.remotePatterns`, plus
  `data:`/`blob:` for inline marks, upload previews and the pdf.js worker.

> If Vercel's preview toolbar is enabled on a deployment it injects a script
> from `vercel.live`, which this policy blocks. Add that origin for preview
> environments only — never production.

### Uploaded SVGs

SVG is an accepted upload type (customers send vector logos for the wrap) and
also a document that can carry `<script>`, inline event handlers, remote
references and XML entities. Supabase Storage serves it from the project host,
which is the same origin as the REST and auth APIs. Two layers now stand in the
way:

1. **On upload** — every upload path runs `screenUpload`
   ([`lib/storage/scan.ts`](../src/lib/storage/scan.ts)), which screens SVG
   markup ([`lib/storage/svg-safety.ts`](../src/lib/storage/svg-safety.ts))
   before the malware scan and refuses anything active with a reason the
   customer can act on ("re-export it without scripting, or send a PNG"). It is
   a detector, not a sanitiser — a half-working sanitiser that reports "cleaned"
   is worse than a refusal.
2. **On read** — `createSignedReadUrl` signs `.svg`, `.html` and `.xml` objects
   with `download`, so the browser saves them instead of rendering them. `<img>`
   previews still work; `Content-Disposition` only governs navigations.

### Public routes are matched exactly, not by prefix

The middleware's allow-list used to be a `startsWith` scan, which is one careless
route name away from a leak: a new `/reportsheet` page would have been public
because `/report` was, and `/eventsadmin` because `/events` was not on the list
but `/e` might have been. The list now lives in
[`lib/auth/public-routes.ts`](../src/lib/auth/public-routes.ts) and matches on a
whole path or a whole path segment (`/catalog` and `/catalog/machines` are
public, `/catalog-admin` is not), with explicit regexes for the parameterised
capability URLs. `isPublicPath` is a pure function with its own test file, so a
new public route is a one-line change plus a test rather than a prefix tweak
nobody can safely review.

### Keyboard access in overlays

Radix `Dialog` handles focus and Escape for us everywhere it is used. Two
overlays cannot use it — the catalogue lightbox and the product-tour coachmark
both position themselves outside a normal dialog flow — and they had none of the
behaviour: Escape did nothing, focus stayed on the page behind the scrim, and
nothing returned focus to the trigger on close. `useModalOverlay`
([`src/hooks/useModalOverlay.ts`](../src/hooks/useModalOverlay.ts)) supplies it:
Escape closes, arrow keys step where stepping makes sense, focus moves in on
open and back to the trigger on close, and Tab cycles inside the overlay.

Two details worth keeping if this is refactored:

- **Action steps in the tour do not trap focus.** Those steps ask the user to
  click a real control on the page behind the scrim, so trapping focus would
  make the step impossible to complete by keyboard. They are also not announced
  as `aria-modal`.
- **Keyboard handling lives with the overlay, not in `TourProvider`.** The
  provider used to hold a global listener as well; with both attached, one arrow
  press advanced two steps and Enter on the Back button both clicked it and
  moved forward.

Native `<select>` filters on the pipeline board, event filter bar and admin user
list now carry `aria-label`s — they sit next to a search box with no visible
label of their own, so a screen reader previously announced them only as
"combo box".

### Dependency advisories

`next` is on 16.2.12 and `npm audit fix` has been applied. Three advisories
needed `overrides` in `package.json` because the package that pulls them in pins
an old version:

| Package | Forced to | Why the override |
|---|---|---|
| `sharp` | `^0.35.3` | Next pins `^0.34.5`; anything below 0.35.0 is vulnerable. Used only by the image optimiser — verified by a clean `npm run build` |
| `postcss` | `^8.5.25` | Next pins `8.4.31` exactly. Every other consumer was already on 8.5.25, so this dedupes rather than adds a copy |
| `uuid` | `^11.1.1` | `exceljs` pins `^8.3.0`. It only imports `{ v4 }`, which is unchanged in v11 |

One advisory is knowingly left open: **`brace-expansion` (ReDoS, high, 16
transitive reports)**. It reaches us twice — `eslint → minimatch@3` and
`exceljs → archiver → readdir-glob → minimatch@5`. The fix only exists in
`brace-expansion@5.0.8+`, which changed its CommonJS export from a function to
an object (`{ expand }`). Both `minimatch` versions call the default export as a
function, so an override crashes linting and spreadsheet export. It clears when
`eslint` reaches 10.x and `archiver` bumps `readdir-glob`. The exposure is a
regex slowdown on glob patterns that only ever come from our own config, never
from user input.

---

## Query performance: indexes and counts

`20260731000001_hot_path_indexes.sql` added sixteen indexes and dropped
thirteen. The pattern the schema was missing is the composite: nearly every
list in this product filters by a parent (event, user, account) and then
orders by a date or a sort column, and a single-column index on the parent
gets the planner to the right rows but still makes it sort all of them.

Measured on the local stack with 200k telemetry rows spread over seven events,
running the exact count the live dashboard and the Cloud webhook each fire
four times per refresh (`event_id` + `event_type` + a day window):

| Plan | Time |
|---|---|
| Bitmap index scan on `idx_telemetry_event_type_time` | 1.9 ms |
| Parallel seq scan (indexes disabled) | 10.9 ms |

The gap is linear in table size, and telemetry is the one table that grows
without bound — a busy multi-day show writes millions of rows.

Where a new composite starts with the same column as an existing single-column
index, the single was dropped. Postgres uses any leftmost prefix, so keeping
both cost write throughput and buffer cache for nothing. `idx_profiles_account`
and `idx_profiles_account_id` were also literally the same index under two
names, added by two different migrations.

**Adding an index later.** These are plain `create index` statements because
the tables were small when the migration landed and Supabase runs migrations
inside a transaction. Against a production database with real row counts, run
`create index concurrently` from a session outside the migration runner —
a plain `create index` takes an `ACCESS EXCLUSIVE` lock and will stall writes
for the duration.

**Counts.** `getLeadsByEventPaginated` asks PostgREST for `count=estimated`:
exact up to the `db-max-rows` threshold, planner estimate above it. That count
only sizes the pager, and a busy event shouldn't pay for a full count scan on
every page turn. Everything else stayed `exact` on purpose — the telemetry and
lead counts in the Cloud webhook and `src/server/reports.ts`
are not pagination hints, they are the numbers written into
`event_metrics_snapshot` and quoted back to the customer in the post-show
report. Those are now index-backed instead of estimated. If a single event ever
gets big enough that even the indexed counts hurt, the fix is to read the
rollup in `event_metrics_snapshot` rather than to make the reported numbers
approximate.

## CI

`.github/workflows/test.yml` runs two jobs:

1. **Lint, typecheck, unit tests** — `npm run lint`, `npm run typecheck`,
   `npm run test:coverage`, `npm run build`.
2. **RLS policies + Postgres integration** — the policy-coverage check, then
   `supabase start`, `npm run test:rls` (pgTAP) and `npm run test:integration`
   (the hot query functions against real Postgres, which is the only thing in
   CI that catches a query the mock Supabase client tolerates but PostgREST
   rejects).

Three things were wrong before and are worth knowing about, because each one
made CI look like it was protecting the codebase when it wasn't:

- **It only ran on `main`.** All the work happens on `frontend-mock-data`, so
  the suite had never run on a single commit of the branch it was guarding.
  Both branches are now in the trigger list.
- **It ran `npm test`, not `npm run test:coverage`.** Vitest only enforces
  coverage thresholds when the coverage reporter is on, so the thresholds in
  `vitest.config.ts` were decorative. They claimed 85% on `src/lib` and 65%
  globally; the real numbers were 50% and 30%.
- **The pgTAP job was `if: github.event_name == 'pull_request'`**, so a direct
  push never ran it.

The thresholds now sit just under measured coverage and are ratchets: raise
them as tests land, never lower one to make a build pass.

### The pgTAP-per-policy check

`scripts/check-policy-tests.mjs` parses every `create policy` in
`supabase/migrations/` and fails if the table it targets isn't mentioned by any
file under `supabase/tests/`. It exists because an RLS policy is an
access-control decision that no unit test can see: the previous 22 uncovered
tables included `api_keys` and `webhook_subscriptions` (credential hashes and
signing secrets) and `account_payment_preferences` (finance contacts).

Matching is by table name rather than filename, because one file usually covers
a domain — `rls_telemetry.sql` covers four tables. `supabase/tests/.policy-coverage-baseline`
is the escape hatch for accepted debt; it is currently empty and a line added to
it should be argued for in review.

---

## Definition of "fully functional"

The handover is complete when:

1. Every P0 row has its proof demonstrated in production.
2. P1.1–P1.4 are shipped (machines talking to real events, config sync live,
   rate limits distributed, uploads scanned).
3. P2.1–P2.4 are shipped — these are commitments made to a reference client,
   not nice-to-haves.
4. Every ☐ / ◑ in the security checklist is ✅ or has a written, dated
   risk acceptance from the business.
