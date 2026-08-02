# Integration Activation

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25.
>
> Enable, verify, understand the failure mode, and roll back each external
> integration. Every integration degrades gracefully when unconfigured — the app
> runs without any of them (mock mode needs none). Contracts are documented in
> [`docs/10-integrations.md`](../10-integrations.md); endpoints in
> [`docs/16`](../16-api-and-actions-reference.md).

## Summary

| Service | Enable with | Off behaviour | Fails |
|---------|-------------|---------------|-------|
| Resend (email) | `RESEND_API_KEY`, `FROM_EMAIL` | Emails logged to console | open (no send) |
| Bright.Blue Cloud (out) | `BRIGHTBLUE_API_URL`, `BRIGHTBLUE_API_KEY` | Live data from local DB | open |
| Bright.Blue Cloud (in) | `BRIGHTBLUE_WEBHOOK_SECRET` | Inbound webhook 503 | **closed** |
| Cal.com | `NEXT_PUBLIC_CALCOM_LINK`, `CALCOM_WEBHOOK_SECRET` | Built-in preset slot picker | **closed** (webhook) |
| Pipedrive | `PIPEDRIVE_API_TOKEN` (+ base URLs) | Outbox drains to no-op | open |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` (+ org/project/token) | Disabled | open |
| File scan | `FILE_SCAN_URL`, `FILE_SCAN_TOKEN` | Uploads pass unscanned | open |
| Crons | `CRON_SECRET` | `/api/cron/*` return 401 | **closed** |

"Fails closed" = a missing/invalid secret blocks the path (safer). "Fails open"
= the feature quietly no-ops.

---

## Resend (transactional + digest email)

- **Enable:** set `RESEND_API_KEY` and a `FROM_EMAIL` on a **verified domain**.
- **Verify:** trigger `prepareProposal` (sends `sendProposalReadyEmail`) or run
  `/api/cron/digest` with the bearer; confirm delivery in the Resend dashboard.
- **Failure mode:** when unset, `src/lib/email.ts` logs the email instead of
  sending — safe for dev, silent in prod, so **verify the key in prod**.
- **Rollback:** unset the key; sends revert to console logs.
- **Follow-up:** register Resend bounce/delivery webhooks (cloud setup; see
  [`docs/11`](../11-cloud-handoff.md) D2).

## Bright.Blue Cloud (machines, telemetry, leads)

Two directions:

- **Outbound (poll + config push):** `BRIGHTBLUE_API_URL` + `BRIGHTBLUE_API_KEY`.
  `getLiveSnapshot` pulls fresh metrics for `/api/events/:id/live`;
  `pushEventConfig` PUTs event config on config submit.
  - *Off:* live data falls back to the local DB (webhook-fed); config push
    no-ops.
- **Inbound (webhook):** `BRIGHTBLUE_WEBHOOK_SECRET` authenticates
  `POST /api/webhooks/brightblue` (HMAC). Ingests `lead.captured`
  (with `consented_at`), telemetry, and stock; recomputes snapshot stock and
  fires `machine.stock_low`.
  - *Off:* returns **503** (fails closed).
- **Verify:** use [`scripts/simulate-cloud-webhook.ts`](../../scripts/simulate-cloud-webhook.ts)
  to POST a signed payload and confirm a snapshot/lead row appears.
- **Rollback:** unset the webhook secret (inbound 503s) and/or API vars (live
  falls back to local).

## Cal.com (walkthrough booking)

- **Enable:** `NEXT_PUBLIC_CALCOM_LINK` (embed) + `CALCOM_WEBHOOK_SECRET`
  (HMAC-SHA256 on `x-cal-signature-256`). In Cal.com → Settings → Developer →
  Webhooks, point at `<site>/api/webhooks/calcom` and set the event-type
  location to a video call.
- **Verify:** book a test slot; confirm `BOOKING_CREATED` updates the quote's
  `walkthrough_scheduled_at`/`_slot_label`, and `MEETING_ENDED` sets
  `walkthrough_completed_at` (which reveals proposal pricing).
- **Failure mode:** when `NEXT_PUBLIC_CALCOM_LINK` is unset, the UI shows the
  built-in preset slot picker (`WalkthroughBooker`). Webhook fails closed when
  the secret is unset/invalid.
- **Rollback:** unset the link → preset picker; unset the secret → webhook 401.

## Pipedrive (CRM write-back)

- **Enable:** `PIPEDRIVE_API_TOKEN` (+ `PIPEDRIVE_BASE_URL`,
  `NEXT_PUBLIC_PIPEDRIVE_WEB_BASE_URL` for deep links). Configure field mapping
  at `/admin/integrations/pipedrive`.
- **Flow:** actions enqueue `pipedrive_outbox` rows (`note`,
  `custom_field_update`); `/api/cron/pipedrive` drains hourly (max 3 attempts
  per row) and fires time-driven triggers.
- **Verify:** advance a stage on an event → confirm a note/field update on the
  linked deal after the next hourly drain (or trigger the cron manually).
- **Failure mode:** unset token → drain no-ops; rows remain queued.
- **Rollback:** unset the token; queued rows stay until re-enabled.

## Sentry (error monitoring)

- **Enable:** `NEXT_PUBLIC_SENTRY_DSN`; add `SENTRY_ORG`, `SENTRY_PROJECT`, and
  `SENTRY_AUTH_TOKEN` for source-map upload in CI/build. Active only in
  production.
- **Verify:** throw a test error in prod and confirm a readable stack in Sentry.
- **Note:** `SENTRY_DSN` (non-public) is **dead** — use `NEXT_PUBLIC_SENTRY_DSN`
  (see [`docs/11`](../11-cloud-handoff.md) E).
- **Rollback:** unset the DSN; reporting disables.

## File scanning (upload malware scan)

- **Enable:** `FILE_SCAN_URL` (+ `FILE_SCAN_TOKEN`) pointing at your scan
  endpoint (`src/lib/storage/scan.ts`).
- **Failure mode:** when unset, uploads **pass unscanned** — a launch-blocking
  stub for regulated deployments (`STUBS-TO-REPLACE.md`).
- **Verify:** upload a benign EICAR-style test file and confirm rejection.
- **Rollback:** unset the URL; scanning is skipped.

## Crons

- **Enable:** set `CRON_SECRET`; Vercel Cron sends it as a bearer.
- **Failure mode:** unset/mismatch → **401** (fails closed), so a missing secret
  silently disables all scheduled work — confirm it in prod.
- **Verify:** `curl -H "Authorization: Bearer $CRON_SECRET" <site>/api/cron/reminders`.
