# 16 — API & Server-Action Reference

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25 against `main`.
>
> The complete inventory of HTTP route handlers and the server-action domains.
> Route handlers live at `src/app/**/route.ts`; server actions at
> `src/app/actions/**`. Reads (queries) live at `src/lib/queries/*` and are not
> HTTP endpoints — they are imported directly by server components/actions.

## Authentication mechanisms

| Mechanism | Used by | Enforcement |
|-----------|---------|-------------|
| **Supabase session cookie** | All app routes + most API routes | `supabase.auth.getUser()` / `getUser()`; `middleware.ts` redirects unauthenticated page requests |
| **Bearer `CRON_SECRET`** | `/api/cron/*` | `requireCron()` — [`src/lib/cron-auth.ts`](../src/lib/cron-auth.ts). **Fails closed:** returns 401 if the secret is unset or the bearer mismatches |
| **HMAC signature** | `/api/webhooks/*` | Per-provider secret; **fails closed** with 503 (secret unset) or 401 (bad signature) |
| **Unguessable UUID** | `/api/quotes/:id/proposal-pdf` | Public by design — mirrors the public `/proposal/:id` page; validates UUID shape |
| **`TEST_MODE=1` gate** | `/api/test/*` | Handler refuses unless `TEST_MODE=1`, *and* a production build rewrites the path to a non-existent route so it 404s before the handler runs. The rewrite lives in `beforeFiles` — an array-form rewrite is `afterFiles`, which Next only consults once the filesystem has been checked and therefore cannot shadow a route that exists |

Role checks use [`src/lib/roles.ts`](../src/lib/roles.ts) (`isInternalRole`,
`isPartnerRole`, …); event-section access uses
[`src/lib/event-access.ts`](../src/lib/event-access.ts) (`canViewSection`).
Database access is additionally constrained by RLS.

## Route handlers (16)

### Live & metrics

| Route | Method | Auth | Caller | Behaviour |
|-------|--------|------|--------|-----------|
| `/api/events/[id]/live` | GET | Session + event access (403 if none) | `LiveDashboardClient` polling (20s) | Latest metrics snapshot, recent telemetry, machine status, hourly curve, live stock + reload ETA. Tries Cloud snapshot if configured, else local DB (webhook-fed). `force-dynamic`. Source: [`route.ts`](../src/app/api/events/[id]/live/route.ts) |
| `/api/aggregate-metrics` | GET | Session; customers scoped to own `accountId` (403), internal any | `DashboardTabs` | Cross-event aggregate KPIs for `accountId` + date range. Source: [`route.ts`](../src/app/api/aggregate-metrics/route.ts) |
| `/api/notifications/count` | GET | Session | Nav bell badge | Unread notification count for the current user. Source: [`route.ts`](../src/app/api/notifications/count/route.ts) |
| `/api/search` | GET | Session | Command palette / global search | Events, accounts, tasks (+ profiles for internal). Min 2 chars (400 otherwise). Source: [`route.ts`](../src/app/api/search/route.ts) |

### Exports & documents

| Route | Method | Auth | Behaviour |
|-------|--------|------|-----------|
| `/api/events/[id]/export` | GET | Session + `canViewSection` gate on the requested view | `?format=pdf\|csv\|excel&view=reports\|live\|leads`. Streams the export. `maxDuration=60`. Source: [`route.ts`](../src/app/api/events/[id]/export/route.ts) |
| `/api/quotes/[id]/proposal-pdf` | GET | Public (UUID-validated) | Renders `/proposal/:id` to a print-optimised PDF. `maxDuration=60`. Source: [`route.ts`](../src/app/api/quotes/[id]/proposal-pdf/route.ts) |
| `/api/partner-resources/[key]` | GET | Session (any) | Generated partner collateral (XLSX for data sheets, Markdown one-pagers). Source: [`route.ts`](../src/app/api/partner-resources/[key]/route.ts) |

### Webhooks (inbound; fail closed)

| Route | Method | Auth | Behaviour |
|-------|--------|------|-----------|
| `/api/webhooks/brightblue` | POST | HMAC via `BRIGHTBLUE_WEBHOOK_SECRET` | Cloud → portal ingest: `lead.captured` (with `consented_at`), telemetry, stock. Refreshes snapshot, computes `stock_remaining`/`stock_capacity`, dispatches `machine.stock_low`. 503 if secret unset. Source: [`route.ts`](../src/app/api/webhooks/brightblue/route.ts) |
| `/api/webhooks/calcom` | POST | HMAC-SHA256 `x-cal-signature-256` via `CALCOM_WEBHOOK_SECRET` | Walkthrough booking lifecycle: `BOOKING_CREATED/RESCHEDULED/CANCELLED`, `MEETING_ENDED`. Maps `quoteId` from metadata → updates `walkthrough_*` fields; dispatches notifications. Source: [`route.ts`](../src/app/api/webhooks/calcom/route.ts) |

### Cron jobs (Bearer `CRON_SECRET`; schedules in [`vercel.json`](../vercel.json))

| Route | Schedule (UTC) | Behaviour |
|-------|----------------|-----------|
| `/api/cron/reminders` | `0 9 * * *` (daily 09:00) | Deadline / overdue-task reminder notifications. Source: [`route.ts`](../src/app/api/cron/reminders/route.ts) |
| `/api/cron/digest` | `0 * * * *` (hourly) | Sends each opted-in user their digest **when the local hour matches their preference** — hourly tick, per-recipient local-time send. Source: [`route.ts`](../src/app/api/cron/digest/route.ts) |
| `/api/cron/pipedrive` | `0 * * * *` (hourly) | Drains the Pipedrive outbox (`custom_field_update` writes, deal sync). Source: [`route.ts`](../src/app/api/cron/pipedrive/route.ts) |
| `/api/cron/reports` | `0 8 * * *` (daily 08:00) | Auto-generates proof-of-performance reports for freshly completed events. Source: [`route.ts`](../src/app/api/cron/reports/route.ts) |
| `/api/cron/purge-leads` | `30 2 * * *` (daily 02:30) | Purges leads past their event's retention window (two-sweep: configured + default). Source: [`route.ts`](../src/app/api/cron/purge-leads/route.ts) |

### Test-only (gated behind `TEST_MODE=1`)

| Route | Method | Behaviour |
|-------|--------|-----------|
| `/api/test/login` | POST | Creates a session for a named Playwright persona. Source: [`route.ts`](../src/app/api/test/login/route.ts) |
| `/api/test/reset` | POST | Resets test state between E2E runs. Source: [`route.ts`](../src/app/api/test/reset/route.ts) |

## Server-action domains

Server actions are the mutation layer. Convention (per
[`.cursor/rules/`](../.cursor/rules/) and observed in code): each action
validates input with a Zod schema from `src/lib/validations/`, checks
permissions via `roles.ts`/`event-access.ts`, performs the write, and returns a
discriminated result `{ success: true, data } | { success: false, error }`.
Every action file ships a `*.test.ts` sibling.

| Domain file | Responsibility (representative actions) |
|-------------|------------------------------------------|
| [`quotes/`](../src/app/actions/quotes/) | Book-now + proposal intake, `prepareProposal`, `bookWalkthrough`, proposal admin, decisions, and `convertQuoteToEvent` (the manual "create the event workspace" step used whenever `BOOKING_AUTO_PROVISION` is off) |
| [`events.ts`](../src/app/actions/events.ts) | Event create/update, Pipedrive deal linking (`normalisePipedriveDealId`) |
| [`stages.ts`](../src/app/actions/stages.ts) | Stage advancement + `canAdvanceStage` gating, notifications, Pipedrive write-back |
| [`tasks.ts`](../src/app/actions/tasks.ts) | Task create/assign/complete |
| [`briefing.ts`](../src/app/actions/briefing.ts) | Customer + ops briefing capture, change requests |
| [`assets.ts`](../src/app/actions/assets.ts) / [`asset-review.ts`](../src/app/actions/asset-review.ts) / [`asset-annotations.ts`](../src/app/actions/asset-annotations.ts) / [`asset-detail.ts`](../src/app/actions/asset-detail.ts) | Asset upload, review decisions, annotations |
| [`approvals.ts`](../src/app/actions/approvals.ts) | Approval submit / decide |
| [`game-config.ts`](../src/app/actions/game-config.ts) | Game + product + capture-quality config; fires Cloud `pushEventConfig` on submit |
| [`provisioning.ts`](../src/app/actions/provisioning.ts) | Convert accepted quote → provisioned event |
| [`logistics/`](../src/app/actions/logistics/) + [`logistics-entries`](../src/app/actions/logistics-entries.test.ts) | Delivery windows, onsite contacts, logistics entries |
| [`qa.ts`](../src/app/actions/qa.ts) / [`compliance.ts`](../src/app/actions/compliance.ts) | QA checklist items, compliance capture |
| [`studio.ts`](../src/app/actions/studio.ts) | Bright.Studio creative service orders |
| [`reports.ts`](../src/app/actions/reports.ts) | Generate / publish / unpublish reports, benchmarks, capture-quality counters |
| [`telemetry.ts`](../src/app/actions/telemetry.ts) | Telemetry ingest helpers (demo/live) |
| [`messages.ts`](../src/app/actions/messages.ts) / [`comments.ts`](../src/app/actions/comments.ts) | Threaded messages + comments |
| [`notifications.ts`](../src/app/actions/notifications.ts) / [`notification-preferences.ts`](../src/app/actions/notification-preferences.ts) | Mark read, preference toggles |
| [`team.ts`](../src/app/actions/team.ts) / [`invites.ts`](../src/app/actions/invites.ts) / [`admin-users.ts`](../src/app/actions/admin-users.ts) | Team membership, invitations, user admin |
| [`partners.ts`](../src/app/actions/partners.ts) / [`venues.ts`](../src/app/actions/venues.ts) / [`venue-requirements.ts`](../src/app/actions/venue-requirements.ts) | Partner + venue portal mutations |
| [`organizers.ts`](../src/app/actions/organizers.ts) | Show-scoped sponsor inventory, pitch links (mint / rotate / revoke), slot creative, per-machine zone + mission |
| [`sponsor-pitch.ts`](../src/app/actions/sponsor-pitch.ts) | Public: a sponsor accepts the slot from their pitch link. Unauthenticated — token re-validated server-side, IP rate-limited, holds the slot and notifies the organizer |
| [`organizer-admin.ts`](../src/app/actions/organizer-admin.ts) | Internal organizer setup (`events_lead`/`admin` only): create an organizer, invite their team, link/unlink shows, register / deploy / release machines |
| [`campaigns.ts`](../src/app/actions/campaigns.ts) / [`catalog.ts`](../src/app/actions/catalog.ts) / [`catalog-content.ts`](../src/app/actions/catalog-content.ts) / [`templates.ts`](../src/app/actions/templates.ts) / [`expand-template.ts`](../src/app/actions/expand-template.ts) | Campaigns, catalog admin, event templates |
| [`invoices.ts`](../src/app/actions/invoices.ts) | Invoice display actions (tested, **unwired** by design) |
| [`auth.ts`](../src/app/actions/auth.ts) / [`profile.ts`](../src/app/actions/profile.ts) / [`onboarding.ts`](../src/app/actions/onboarding.ts) / [`streak.ts`](../src/app/actions/streak.ts) | Auth, profile, onboarding, engagement streak |
| [`api-management.ts`](../src/app/actions/api-management.ts) / [`pipedrive-config.ts`](../src/app/actions/pipedrive-config.ts) / [`scheduled-exports.ts`](../src/app/actions/scheduled-exports.ts) / [`handoff-notes.ts`](../src/app/actions/handoff-notes.ts) | API keys, Pipedrive config, scheduled exports, handoff notes |

See [`docs/17-feature-reference.md`](17-feature-reference.md) for how these map
to user-facing features, and [`docs/15-system-architecture.md`](15-system-architecture.md)
for request/data-flow diagrams.
