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
| `lead.captured` | New lead captured at the machine | `event_id`, `machine_serial`, `contact{}` |
| `machine.heartbeat` | Periodic health ping | `machine_serial`, `firmware_version`, `status` |
| `report.ready` | Post-show report data available | `event_id`, `report{}` with totals + hourly breakdown |

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
| `validateMachineSerial(serial)` | `GET /machines/:serial` | Serial validation during event setup |

**Graceful degradation:** When `BRIGHTBLUE_API_URL` or `BRIGHTBLUE_API_KEY` is
not set, all outbound calls return `null` and the app falls back to local DB
data populated by webhooks. No errors are thrown.

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
1. Server actions enqueue rows in `pipedrive_outbox` (kind: `note`, `field_update`).
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
| **Env** | `RESEND_API_KEY`, `FROM_EMAIL`, `STUDIO_TEAM_EMAIL`, `SALES_TEAM_EMAIL` |

When `RESEND_API_KEY` is not set, emails are logged to the console instead of
being sent. This makes local development safe without an email service.

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

---

## 6. Sentry (Observability)

| Field | Value |
|---|---|
| **Package** | `@sentry/nextjs` |
| **Config** | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts` |
| **Env** | `NEXT_PUBLIC_SENTRY_DSN` (plus optional `SENTRY_ORG` / `SENTRY_PROJECT` for source maps in CI) |

Cron routes, webhooks, and `global-error` capture exceptions with tags
(e.g. `cron: digest`). When the DSN is unset, Sentry is effectively disabled.

---

## 7. File scan (upload antivirus)

| Field | Value |
|---|---|
| **Hook** | `src/lib/storage/scan.ts` (`scanUpload`) |
| **Env** | `FILE_SCAN_URL`, optional `FILE_SCAN_TOKEN` |

Wired into upload actions. When `FILE_SCAN_URL` is unset the scanner skips
(graceful no-op) so local/dev uploads still work. Point it at a ClamAV REST
shim or cloud AV API before production hardening — see `STUBS-TO-REPLACE.md`.

---

## 8. Environment Variable Checklist

Copy `.env.example` to `.env.local`. Required vars are unmarked; optional
vars are marked with ⊘.

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Never expose to browser |
| `NEXT_PUBLIC_SITE_URL` | ✓ | Used in email links & auth redirects |
| `CRON_SECRET` | ⊘ | Bearer auth on `/api/cron/*` |
| `RESEND_API_KEY` | ⊘ | Falls back to console logging |
| `FROM_EMAIL` | ⊘ | |
| `STUDIO_TEAM_EMAIL` | ⊘ | |
| `SALES_TEAM_EMAIL` | ⊘ | |
| `BRIGHTBLUE_API_URL` | ⊘ | Cloud outbound API |
| `BRIGHTBLUE_API_KEY` | ⊘ | Cloud outbound auth |
| `BRIGHTBLUE_WEBHOOK_SECRET` | ⊘ | Inbound webhook HMAC |
| `PIPEDRIVE_API_TOKEN` | ⊘ | Local-dev override |
| `PIPEDRIVE_BASE_URL` | ⊘ | Default: api.pipedrive.com |
| `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL` | ⊘ | Deal deep links |
| `NEXT_PUBLIC_SENTRY_DSN` | ⊘ | Error reporting |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ⊘ | Source-map upload in CI |
| `FILE_SCAN_URL` / `FILE_SCAN_TOKEN` | ⊘ | Upload AV; skip when unset |
| `BOOKING_AUTO_PROVISION` | ⊘ | `"true"` in production only — auto-creates account/event/invite on booking |
