# 10 — External Integrations

> CTO reference: every external system the platform touches, how it's wired,
> and the env vars you need to set to activate it.

---

## 1. Bright.Blue Cloud (Telemetry + Reports)

The Bright.Blue Cloud platform is the source of truth for machine telemetry,
live event data, and post-show reports. Data flows both ways:

### 1a. Inbound Webhooks (Cloud → Experience)

| Field | Value |
|---|---|
| **Route** | `POST /api/webhooks/brightblue` |
| **Auth** | HMAC-SHA256 via `x-bb-signature` header |
| **Secret env** | `BRIGHTBLUE_WEBHOOK_SECRET` |
| **Handler** | `src/app/api/webhooks/brightblue/route.ts` |
| **Verifier** | `src/lib/webhooks/verify.ts` |

**Supported event types:**

| `event_type` | Description | Key fields |
|---|---|---|
| `telemetry.batch` | Bulk telemetry events from machines | `machine_serial`, `event_id`, `events[]` |
| `lead.captured` | New lead captured at the machine | `event_id`, `machine_serial`, `contact{}` — `contact.consented_at` (ISO) or `contact.consent: true` stamps GDPR consent on the lead |
| `machine.heartbeat` | Periodic health ping | `machine_serial`, `firmware_version`, `status` |
| `report.ready` | Post-show report data available | `event_id`, `report{}` with totals + hourly breakdown |

**Telemetry event types with portal semantics** (inside `telemetry.batch
events[]`): the standard play/lead/prize types, plus two capture-quality
guardrail types the machine should emit so reports can prove the rules worked —
`capture_rejected_domain` (a personal-email entry was refused) and
`capture_duplicate_blocked` (a repeat entry was refused). Both are counted
into the post-event report's "Capture quality" card and shown in the live
feed. `prize_awarded` events also drive the live stock computation: on every
ingest the webhook recomputes `event_metrics_snapshot.stock_remaining`
(capacity from `product_configurations.total_units` minus prizes dispensed)
and fires a `machine.stock_low` ops notification when the level first crosses
15% of capacity.

**Redelivery is safe (idempotency).** Cloud retries on any non-2xx and on a
timeout, and a plain insert would have counted the same play two or three
times — those counts drive the live dashboard, the post-show report, the
benchmark table and every "expected performance" range quoted to an organizer.
Each row in a `telemetry.batch` is therefore written with an
`external_event_id` (`telemetry_events.external_event_id`, unique index from
`20260731000000_telemetry_external_event_id.sql`) and upserted with
`ignoreDuplicates`. The key comes from `src/lib/webhooks/telemetry-idempotency.ts`:

- If the item carries Cloud's own `id`/`event_id`, the key is `bb:<id>` — the
  preferred path, because it survives a payload that Cloud re-serialises.
- Otherwise the key is `batch:<sha256 of the raw request body>:<index>`, so a
  byte-identical redelivery lands on the same rows, and two identical events
  inside one batch stay distinct.

Rows written by anything else (seed data, the mock dataset) leave the column
NULL, and NULLs stay distinct so they never collide. If you add a new
first-party telemetry producer, give it its own key prefix.

**Unknown machine serials are acknowledged, not retried.** A
`telemetry.batch` or `machine.heartbeat` for a serial this environment doesn't
hold returns 200 with `{ skipped: "unknown_machine_serial" }` and logs a
warning to Sentry. Returning 500 there just guaranteed an infinite retry loop
for a payload that can never succeed. `lead.captured` is different: the lead is
still written, unattributed, because losing a real person's contact details is
worse than losing the machine attribution.

**Setup steps:**
1. Set `BRIGHTBLUE_WEBHOOK_SECRET` in your env (same value in Cloud settings).
2. In Bright.Blue Cloud → Settings → Webhooks, set the URL to
   `https://<your-domain>/api/webhooks/brightblue`.
3. Enable the event types you want to receive.

**Prove the pipe without a machine:** `scripts/simulate-cloud-webhook.ts`
HMAC-signs and POSTs realistic sample payloads for all four event types —
executable documentation of this contract.

```bash
# All four event types against local dev (reads BRIGHTBLUE_WEBHOOK_SECRET from .env.local)
npx tsx scripts/simulate-cloud-webhook.ts

# One type, custom target/serial/secret
npx tsx scripts/simulate-cloud-webhook.ts machine.heartbeat \
  --url https://portal.example.com/api/webhooks/brightblue \
  --serial BP-2110 --secret <shared-secret>
```

Note: `/api/webhooks/*` and `/api/cron/*` are exempt from the session
middleware (`src/middleware.ts`) — they enforce their own auth (HMAC
signature / `CRON_SECRET` bearer respectively).

### 1b. Outbound API (Experience → Cloud)

| Field | Value |
|---|---|
| **Client** | `src/lib/brightblue/client.ts` |
| **Base URL env** | `BRIGHTBLUE_API_URL` (e.g. `https://cloud.bright.blue/api/v1`) |
| **Auth env** | `BRIGHTBLUE_API_KEY` (Bearer token) |

**Endpoints consumed:**

| Function | Cloud Endpoint | Purpose |
|---|---|---|
| `getLiveSnapshot(eventId)` | `GET /events/:id/live` | Live telemetry for dashboard polling fallback |
| `getPostShowReport(eventId)` | `GET /events/:id/report` | Final post-show report |
| `pushEventConfig(payload)` | `PUT /events/:id/config` | **Machine config sync** — pushes the submitted event configuration to the machine stack |

The client also used to carry a `validateMachineSerial(serial)` stub against
`GET /machines/:serial` that nothing ever called; it was removed in the
cleanup pass rather than left to rot. The natural home for it is
`registerMachineInstance` (`src/app/actions/organizer-admin.ts`), which today
accepts any serial an admin types — add it back there when the Cloud endpoint
is live.

**Machine config sync contract:** the portal is the source of truth for how a
machine behaves at an event. When a customer submits the configuration
(`saveGameConfiguration` with `submit: true`), the portal fire-and-forgets a
versioned `EventConfigPayload` (v2, snake_case — assembled in
`src/lib/brightblue/config-payload.ts`) containing:

- `game` — prize mode, prizes + quantities, capture form fields, leaderboard,
  game parameters, idle-screen copy
- `capture_rules` — `business_emails_only`, `blocked_domains[]`,
  `block_duplicates`, `consent_required`, `consent_text` (with `{brand}` /
  `{event}` tokens the landing page fills at render time)
- `retention_days`, `branded_landing`, `capture_method`
- `machines[]` — one entry per deployed unit (see below)

The machine capture flow must enforce `capture_rules` at the point of capture
and emit the two guardrail telemetry types above when rules fire. A failed or
skipped push (Cloud unconfigured) is logged and never blocks the customer's
submit; the config persists in the portal DB and re-pushes on next submit.

**v2 — per-machine configuration.** A conference organizer runs several units
at one show doing different jobs (registration welcome gift, sponsor
activation on the floor, rebooking desk). Each `machines[]` entry is *fully
resolved* — the unit's own configuration if it has one, otherwise the show
default — so the machine stack never implements inheritance:

| Field | Meaning |
|---|---|
| `machine_instance_id`, `serial_number` | Which unit this block is for |
| `zone` | Free-text location the organizer named, e.g. `Hall 3` |
| `mission` | `lead_capture` / `sponsor_activation` / `welcome_gift` / `rebook_reward` / `sampling` |
| `capture_method` | `form` / `badge_scan` / `both` |
| `is_override` | True when the unit diverges from the show default |
| `game`, `capture_rules`, `retention_days`, `branded_landing` | Same shapes as the top level, resolved for this unit |

The top-level `game` / `capture_rules` blocks are unchanged from v1 and remain
the show-wide default, so a v1 consumer keeps working during rollout.
`machines[]` is empty for a single-machine activation with no fleet assigned.

**Badge-scan contract (`capture_method`).** How a play is unlocked:

| Value | Machine behaviour |
|---|---|
| `form` | Attendee fills the on-screen capture form. Today's default. |
| `badge_scan` | The scanner unlocks the game; contact details come from the event's badge/registration provider, not the screen. |
| `both` | Either unlocks a play — scan preferred, form as fallback when a scan fails or the attendee has no badge. |

What the machine must send back is unchanged in shape: a `lead.captured`
webhook per contact. For a scan-sourced lead, populate `contact{}` from the
registration record and include `contact.badge_id` so the portal can
de-duplicate against a badge rather than an email. `block_duplicates` applies
to whichever identifier is present (badge id first, then email).

Bright.Blue does not own the badge data — the registration provider (Cvent,
Swapcard, RainFocus, Informa's own stack) does. Wiring a scanner therefore
needs a per-show credential exchange with that provider, which is why
`capture_method` is portal-configurable rather than assumed: the organizer
tells us which units will have a scanner, and units without one stay on
`form`.

**Graceful degradation:** When `BRIGHTBLUE_API_URL` or `BRIGHTBLUE_API_KEY` is
not set, all outbound calls return `null` (the config push returns `false` and
logs a warning) and the app falls back to local DB data populated by webhooks.
No errors are thrown.

### 1c. Event-ID mapping contract (the first question you'll ask)

Three of the four inbound webhook types carry a portal `event_id` — a UUID
that **the portal generates** when an event is provisioned. Cloud has no
native knowledge of it, so before real machines can send data, Cloud must
learn which portal event each machine is currently serving.

**Join keys available today:**

| Key | Owner | Where it lives |
|---|---|---|
| `machine_instances.serial_number` | Physical machine (known to both sides) | Portal DB + Cloud device registry |
| Portal `event_id` (UUID) | Portal | `events.id`; the machine's current assignment is `machine_instances.current_event_id` |

**Recommended flow (push-on-assignment):**

1. Ops assigns a machine to an event in the portal (sets
   `machine_instances.current_event_id`).
2. The portal pushes `{ serial_number, event_id, starts_at, ends_at }` to a
   Cloud endpoint (to be added to `src/lib/brightblue/client.ts`, e.g.
   `PUT /machines/:serial/assignment`).
3. Cloud stamps that `event_id` on every payload the machine emits until the
   assignment changes.

**Alternative (resolve-on-ingest):** keep Cloud dumb — machines send only
`machine_serial`, and the webhook handler resolves the event via
`machine_instances.serial_number → current_event_id`. Less moving parts, but
telemetry received after a reassignment (queued/offline batches) lands on the
wrong event, and `report.ready` for a past event can no longer be resolved.

**Open decision for the CTO:** which side owns the mapping. Push-on-assignment
is the recommendation because it survives reassignment and offline replays;
it costs one new outbound endpoint. Until this is decided, the webhook
simulator (`scripts/simulate-cloud-webhook.ts`) stamps the seeded demo event
UUID explicitly — exactly what a Cloud implementation would do after step 2.

---

## 2. Pipedrive (CRM Write-Back)

Bright.Experience pushes event progress updates to Pipedrive deals as notes
and custom field updates.

| Field | Value |
|---|---|
| **Client** | `src/lib/pipedrive/client.ts` |
| **Outbox drain** | `src/lib/pipedrive/drain.ts` |
| **Cron route** | `POST /api/cron/pipedrive` |
| **Config table** | `pipedrive_config` (row id=1) |
| **Outbox table** | `pipedrive_outbox` |

**Env vars:**

| Variable | Purpose |
|---|---|
| `PIPEDRIVE_API_TOKEN` | Local-dev override (production uses DB row) |
| `PIPEDRIVE_BASE_URL` | API base (default: `https://api.pipedrive.com`) |
| `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL` | For "Open in Pipedrive" deep links |

**Flow:**
1. Server actions enqueue rows in `pipedrive_outbox` (kind: `note`, `custom_field_update`).
2. The `/api/cron/pipedrive` cron drains the outbox every hour:
   - Calls `addNoteToDeal` or `updateDealCustomFields` via the Pipedrive API.
   - Marks rows as sent or records errors (**max 3 attempts** per row).
3. Time-driven triggers also fire in the same cron (stage reminders, etc.).

---

## 3. Resend (Transactional Email)

| Field | Value |
|---|---|
| **Dispatch** | `src/lib/notifications/dispatch.ts` |
| **Templates** | `src/lib/notifications/archetypes/` (per-notification copy) + `src/lib/notifications/email-shell.ts` (shared HTML wrapper) |
| **Direct transactional sends** | `src/lib/email.ts` — team + customer emails addressed by known email (not a portal user), bypassing the dispatch fan-out |
| **Env** | `RESEND_API_KEY`, `FROM_EMAIL`, `STUDIO_TEAM_EMAIL`, `SALES_TEAM_EMAIL` |

Two lanes use Resend:

- **Dispatch fan-out** (`dispatch.ts`) — for registered portal users, honouring
  their per-kind notification preferences.
- **Direct transactional** (`src/lib/email.ts`) — for recipients identified by a
  raw email address rather than a user account:
  - `sendStudioOrderNotification` → studio team
  - `sendProposalIntakeNotification` → sales team, when a proposal intake lands
  - `sendProposalReadyEmail` → **the customer**, fired from `prepareProposal`
    ("Send Proposal") with a link to `/proposal/[id]`. The closing block adapts:
    if a walkthrough is already booked it confirms that call (with a reschedule
    link); otherwise it invites them to book. Pricing stays hidden on the page
    until the walkthrough is marked complete, so the email never quotes a figure.
  - `sendBookingConfirmationEmail` → **the buyer**, fired from
    `submitBookNowQuote`. A Book Now buyer has no portal account, so this is
    their only record of what they submitted: package, dates, total, and a link
    back to the receipt. It is explicitly not an invoice — the quote stays
    `submitted` until the team confirms availability.

Every value interpolated into these HTML bodies goes through `escapeHtml`
(exported from `notifications/email-shell.ts`). Contact names, company names and
free-text descriptions are attacker-controlled on the public intake forms, so
un-escaped interpolation would put arbitrary markup in a colleague's inbox.
Subject lines are plain text and are **not** escaped — entities would be
visible there.

When `RESEND_API_KEY` is not set, emails are logged to the console instead of
being sent. This makes local development safe without an email service.

### Inbound-demand notifications

Three public, unauthenticated write paths used to land a row that nobody was
told about. Each now fans out through `dispatchNotification` after the write
succeeds, inside a `try/catch` so a notification failure never rolls back the
thing the customer just did:

| Trigger | Kind | Who is told |
|---|---|---|
| Sponsor pitch conversion (`expressSponsorInterest`) | `sponsor.interest_received` | The show's organizer, falling back to the internal events team |
| Advertiser slot enquiry (`requestVenueSlot`) | `sponsor.slot_requested` | The venue's operator, falling back to the internal events team |
| Partner application (`applyAsPartner`) | `partner.application_received` | Internal admins / events leads |

---

## 3b. Cal.com (Walkthrough Scheduling)

| Field | Value |
|---|---|
| **Embed** | `src/components/quotes/WalkthroughScheduler.tsx` (`@calcom/embed-react` inline booker) |
| **Fallback** | `src/components/quotes/WalkthroughBooker.tsx` (preset slot picker, used when Cal.com is unconfigured) |
| **Inbound webhook** | `POST /api/webhooks/calcom` (`src/app/api/webhooks/calcom/route.ts`) |
| **Helpers** | `src/lib/calcom.ts` (link resolution + slot-label formatting) |
| **Env** | `NEXT_PUBLIC_CALCOM_LINK` (event-type path, e.g. `brightblue/15min`), `CALCOM_WEBHOOK_SECRET` |

The 15-minute proposal walkthrough call is booked through Cal.com. Each AE
connects their own Google Calendar inside Cal.com (Settings → Apps → Google
Calendar), so real availability and booked calls sync natively — the portal
never touches the Google API.

**Flow:**

1. The confirmation screen (`PostIntakeCard`) renders the inline Cal.com embed
   with the customer's name/email prefilled and the quote id passed as booking
   metadata (`metadata[quoteId]`).
2. Cal.com POSTs signed webhooks (HMAC-SHA256 hex digest of the raw body in
   `X-Cal-Signature-256`) to `/api/webhooks/calcom`:
   - `BOOKING_CREATED` / `BOOKING_RESCHEDULED` → writes
     `walkthrough_scheduled_at` + `walkthrough_slot_label` onto the quote and
     fires the `proposal.walkthrough_booked` in-portal notification.
   - `BOOKING_CANCELLED` → clears the scheduled slot.
   - `MEETING_ENDED` → sets `walkthrough_completed_at`, which automatically
     reveals pricing + accept/decline on `/proposal/[id]` (no manual AE toggle
     needed — though `setProposalWalkthrough` still works as a manual override).
3. Bookings without a `quoteId` in metadata (made directly on the Cal.com
   page) are acknowledged with `{ ignored: true }` so Cal.com doesn't retry.

**Setup:** create the event type in Cal.com, set its **location to Google
Meet** (so every booking auto-generates a Meet link in the calendar invite —
customer copy says "video call" and stays provider-agnostic), set
`NEXT_PUBLIC_CALCOM_LINK` to the event-type path, then add a webhook in
Cal.com → Settings → Developer → Webhooks pointing at
`https://<your-domain>/api/webhooks/calcom` with the four triggers above and
the same secret as `CALCOM_WEBHOOK_SECRET`. The Meet link also arrives in the
webhook as `payload.metadata.videoCallUrl` if we ever want to surface it
in-portal.

When `NEXT_PUBLIC_CALCOM_LINK` is unset, the self-contained preset slot picker
renders instead — demos and offline work never break.

---

## 4. Supabase (Database + Auth + Storage)

| Field | Value |
|---|---|
| **Client (server)** | `src/lib/supabase/server.ts` |
| **Client (browser)** | `src/lib/supabase/client.ts` |
| **Service-role** | `src/lib/supabase/service-role.ts` |
| **Middleware** | `src/middleware.ts` |

**Env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`.

**Storage:** Private `event-assets` bucket with signed URLs
(`src/lib/storage/signed-url.ts`).

---

## 5. Cron Jobs

All cron routes live under `/api/cron/` and are protected by `CRON_SECRET`.
Auth is **Bearer-only**: `Authorization: Bearer ${CRON_SECRET}` must match
(`src/lib/cron-auth.ts`). There is no `x-vercel-cron` header bypass.

| Route | Schedule (`vercel.json`) | Purpose |
|---|---|---|
| `/api/cron/reminders` | `0 9 * * *` (daily 09:00 UTC) | Send pending notification reminders |
| `/api/cron/digest` | `0 * * * *` (hourly) | Bundle FYI digests for recipients whose local digest hour has arrived |
| `/api/cron/pipedrive` | `0 * * * *` (hourly) | Drain Pipedrive outbox + time triggers |
| `/api/cron/reports` | `0 8 * * *` (daily 08:00 UTC) | Auto-draft post-event reports for events ended 24h+ ago; process scheduled exports |
| `/api/cron/purge-leads` | `30 2 * * *` (daily 02:30 UTC) | GDPR lead retention: hard-delete leads older than each event's `retention_days` (default 60); default sweep for unconfigured events. Each purge is logged |

### 5a. Heartbeat

Every cron calls `recordCronRun()` (`src/lib/cron/heartbeat.ts`) on the way out,
upserting one row per job into `cron_runs` with the last run time, status,
a job-specific detail blob and a consecutive-failure counter. A run that
skipped its work (no Resend key, nothing due) still writes an `ok` heartbeat —
the row means "the scheduler reached me", not "I did something".

`CRON_JOBS` in the same module holds each job's tolerated silence. Change a
schedule in `vercel.json` and you must change `staleAfterMinutes` with it, or
the health endpoint will either cry wolf or stay quiet through an outage.

---

## 6. Health check (`/api/health`)

| Field | Value |
|---|---|
| **Route** | `src/app/api/health/route.ts` |
| **Expected caller** | Uptime monitor, deploy smoke test, on-call engineer |
| **Auth** | None for the summary; `Authorization: Bearer ${CRON_SECRET}` for the detail |

```bash
curl https://<host>/api/health
# {"status":"ok","checks":{"database":"ok","cron":"ok"}}

curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/health
# adds { migrationVersion, databaseMs, totalMs, jobs[], commit, environment }
```

Status codes: **200** when serving (including `degraded`), **503** only when
the database is unreachable. A stale cron does not fail the check — the app is
still up — so alert on `status` in the body, not on the code alone.

The detail split is deliberate: naming the applied migration and listing every
scheduled job is reconnaissance for an attacker, while a monitor only needs the
summary.

---

## 7. Sentry (Observability)

| Field | Value |
|---|---|
| **Package** | `@sentry/nextjs` |
| **Config** | `src/instrumentation-client.ts` (browser), `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts` |
| **Env** | `NEXT_PUBLIC_SENTRY_DSN` (plus optional `SENTRY_ORG` / `SENTRY_PROJECT` for source maps in CI) |

Browser init lives in `src/instrumentation-client.ts`, which is the only client
entry point Next loads. The older `sentry.client.config.ts` was silently ignored
under Turbopack, so no browser error was ever reported until this moved.

Cron routes, webhooks and every `error.tsx` / `global-error.tsx` boundary
capture exceptions with tags (e.g. `cron: digest`, `surface: proposal`).
Read helpers that degrade to empty data on failure call `logQueryError()`
(`src/lib/observability/log-query-error.ts`) so a broken query is reported even
though the request returns 200. When the DSN is unset, Sentry is a no-op.

---

## 8. File scan (upload antivirus)

| Field | Value |
|---|---|
| **Hook** | `src/lib/storage/scan.ts` (`screenUpload`) |
| **Env** | `FILE_SCAN_URL`, optional `FILE_SCAN_TOKEN` |

Every upload action calls `screenUpload`, which runs two checks in order:

1. **SVG content screen** (`src/lib/storage/svg-safety.ts`) — refuses markup
   carrying `<script>`, inline event handlers, `<foreignObject>`, `javascript:`
   links, remote references or XML entities, with a reason the customer can act
   on. No configuration; always on. See "Uploaded SVGs" in
   [13-dev-handover-priorities.md](13-dev-handover-priorities.md).
2. **Malware scan** (`scanUpload`) — when `FILE_SCAN_URL` is unset the scanner
   skips (graceful no-op) so local/dev uploads still work. Point it at a ClamAV
   REST shim or cloud AV API before production hardening — see
   `STUBS-TO-REPLACE.md`.

---

## 8b. Public API + outbound webhooks (not live)

| Field | Value |
|---|---|
| **Surface** | `/admin/api`; `src/app/actions/api-management.ts` |
| **Flag** | `NEXT_PUBLIC_PUBLIC_API_ENABLED` — **off by default** |

The admin surface mints `bb_…` API keys (stored as a SHA-256 hash, raw value
shown once) and `whsec_…` webhook subscription secrets. Both are generated with
`crypto.randomBytes`.

**Nothing consumes either yet.** No route authenticates a request against
`api_keys.key_hash`, and no dispatcher delivers to `webhook_subscriptions.url`.
Issuing a key would hand a partner a credential for an API that never answers,
so the page 404s, the nav item and command-palette entry are hidden, and the
mint actions refuse while the flag is unset. Revoking an existing key always
works, so anything issued before the flag can still be killed.

To bring it live: build the authenticating API route and the delivery job, then
set `NEXT_PUBLIC_PUBLIC_API_ENABLED=1`. The inbound webhooks that *are* live
(Cal.com, Bright.Blue Cloud — both HMAC-verified) are unaffected by this flag.

---

## 8c. Rate limiting

| Field | Value |
|---|---|
| **Module** | `src/lib/rate-limit.ts` |
| **Env** | `TRUSTED_PROXY_HOPS` (default `0`) |

Token buckets guard every unauthenticated write: sign-in, quote intake, partner
applications, advertiser enquiries, sponsor interest and proposal decisions.

Two things to know before touching it:

- **The key must not be caller-chosen.** `resolveClientIp` prefers headers the
  platform's own edge sets and overwrites (`x-vercel-forwarded-for`,
  `cf-connecting-ip`, `true-client-ip`, `fly-client-ip`, `x-real-ip`). Only if
  none are present does it fall back to `X-Forwarded-For`, and then it reads the
  **right-most** entry — the address our edge observed — because everything to
  the left of it was supplied by the caller. Add a proxy in front of the app and
  raise `TRUSTED_PROXY_HOPS` by one; set it too high and you start trusting the
  caller again. With nothing usable, callers share one `"unknown"` bucket, which
  throttles harder than intended rather than not at all.
- **The store is per-process.** The default `createMemoryStore()` resets on cold
  start and isn't shared between instances, so the real ceiling on serverless is
  roughly `limit × instances`. Implement `RateLimitStore` against Upstash Redis
  or Vercel KV and call `setRateLimitStore(...)` from `instrumentation.ts` — no
  call site changes, since every limiter is already awaited.

---

## 9. Environment Variable Checklist

Copy `.env.example` to `.env.local`. ✓ is required everywhere, ✓ᴾ is
additionally required in production (`checkRequiredEnv()` in `src/lib/env.ts`
throws at boot when one is missing, so a misconfigured deploy fails loudly
instead of half-working), ⊘ is optional.

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Never expose to browser |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Used in email links & auth redirects |
| `CRON_SECRET` | ✓ᴾ | Bearer auth on `/api/cron/*`; also unlocks `/api/health` detail. Without it every cron 401s |
| `RESEND_API_KEY` | ✓ᴾ | Falls back to console logging — i.e. no email leaves the building |
| `FROM_EMAIL` | ✓ᴾ | |
| `STUDIO_TEAM_EMAIL` | ⊘ | |
| `SALES_TEAM_EMAIL` | ⊘ | |
| `BRIGHTBLUE_API_URL` | ⊘ | Cloud outbound API |
| `BRIGHTBLUE_API_KEY` | ⊘ | Cloud outbound auth |
| `BRIGHTBLUE_WEBHOOK_SECRET` | ✓ᴾ | Inbound webhook HMAC — without it telemetry cannot be authenticated |
| `NEXT_PUBLIC_CALCOM_LINK` | ✓ᴾ | Cal.com event-type path; preset picker when unset |
| `CALCOM_WEBHOOK_SECRET` | ✓ᴾ | Cal.com inbound webhook HMAC |
| `PIPEDRIVE_API_TOKEN` | ⊘ | Local-dev override |
| `PIPEDRIVE_BASE_URL` | ⊘ | Default: api.pipedrive.com |
| `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL` | ⊘ | Deal deep links |
| `NEXT_PUBLIC_SENTRY_DSN` | ⊘ | Error reporting |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ⊘ | Source-map upload in CI |
| `FILE_SCAN_URL` / `FILE_SCAN_TOKEN` | ⊘ | Upload AV; skip when unset |
| `BOOKING_AUTO_PROVISION` | ⊘ | `"true"` in production only — auto-creates account/event/invite on booking |
| `NEXT_PUBLIC_PUBLIC_API_ENABLED` | ⊘ | Off by default. Unhides `/admin/api` — only once the API and webhook dispatcher exist (§8b) |
| `TRUSTED_PROXY_HOPS` | ⊘ | Extra proxies in front of the app, for rate-limit IP resolution (§8c) |
