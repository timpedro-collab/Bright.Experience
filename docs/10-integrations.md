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
   - Marks rows as sent or records errors (max 5 retries).
3. Time-driven triggers also fire in the same cron (stage reminders, etc.).

---

## 3. Resend (Transactional Email)

| Field | Value |
|---|---|
| **Dispatch** | `src/lib/notifications/dispatch.ts` |
| **Templates** | `src/lib/notifications/templates/` |
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

All cron routes live under `/api/cron/` and are protected by `CRON_SECRET`
(Vercel sends `Authorization: Bearer ${CRON_SECRET}` or `x-vercel-cron`).

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/reminders` | Every 15 min | Send pending notification reminders |
| `/api/cron/digest` | Daily 08:00 UTC | Send daily notification digests |
| `/api/cron/pipedrive` | Every 60 min | Drain Pipedrive outbox + time triggers |

---

## 6. Environment Variable Checklist

Copy `.env.example` to `.env.local`. Required vars are unmarked; optional
vars are marked with ⊘.

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Never expose to browser |
| `NEXT_PUBLIC_BASE_URL` | ✓ | Used in email links |
| `CRON_SECRET` | ⊘ | Vercel cron auth |
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
