# Monitoring, Security & Disaster Recovery

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform / Data
> protection · **Last verified:** 2026-07-25.
>
> Observability, security controls, and continuity. Items that depend on
> operator decisions or external accounts are labelled `Decision required` or
> `Not configured` — they are not claimed as live.

## Monitoring & logging

- **Error tracking:** Sentry (`sentry.{client,server,edge}.config.ts`,
  `src/instrumentation.ts`). Active in production when `NEXT_PUBLIC_SENTRY_DSN`
  is set. Source maps upload with `SENTRY_ORG`/`SENTRY_PROJECT`/
  `SENTRY_AUTH_TOKEN`. `Decision required:` alerting rules/thresholds are
  configured in the Sentry project, not the repo.
- **Server logs:** server actions return `{ success, error }` and log
  server-side with entity/user/action context (per `.cursor/rules`). Vercel
  captures stdout/stderr; route handlers log failures.
- **Cron observability:** each `/api/cron/*` run is visible in Vercel's Cron/
  Functions logs. `Decision required:` add an uptime/heartbeat monitor per cron
  if silent failures are a concern (a missing `CRON_SECRET` disables them
  silently — see below).
- **Live/telemetry:** ingestion health is observable via snapshot freshness on
  `/api/events/:id/live` and the `machine.stock_low` notification.

## Security controls (implemented)

- **Auth:** Supabase session cookies; `src/middleware.ts` redirects
  unauthenticated page requests to `/login`.
- **Authorisation:** app-layer via [`roles.ts`](../../src/lib/roles.ts) +
  [`event-access.ts`](../../src/lib/event-access.ts) (sections a role can't see
  are unreachable, not just hidden); database-layer via **RLS** on every
  sensitive table (24 pgTAP test files under `supabase/tests/`).
- **Webhooks fail closed:** HMAC verification on `/api/webhooks/*`; 503 when the
  secret is unset, 401 on bad signature.
- **Crons fail closed:** Bearer `CRON_SECRET`; 401 when unset/mismatched
  (`requireCron`).
- **Secrets hygiene:** `SUPABASE_SERVICE_ROLE_KEY` is server-only; never expose
  it as `NEXT_PUBLIC_*`. `poweredByHeader:false`.
- **Security headers** ([`next.config.ts`](../../next.config.ts)):
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`.
- **Rate limiting:** `quoteLimiter` / `decisionLimiter` on public quote and
  proposal-decision endpoints (`src/lib/rate-limit.ts`).
- **Upload scanning:** optional (`FILE_SCAN_URL`); **unscanned when unset**.

### ⚠ Unresolved: iframe vs. frame policy

`X-Frame-Options: DENY` is applied to **all** routes (`source: "/(.*)"`), but
the venue **`/venues/:slug/embed`** surface is explicitly an *embeddable iframe*.
DENY will block it in third-party sites. **Decision required:** scope the header
so `/embed` uses a `Content-Security-Policy: frame-ancestors <allowed hosts>`
(or `SAMEORIGIN`/allowlist) instead of a blanket `DENY`. Until resolved, the
embed works same-origin only. Tracked here and in
[`docs/13-dev-handover-priorities.md`](../13-dev-handover-priorities.md).

## PII & data protection

- **PII lives in:** `leads` (contact name/email/phone, custom fields,
  `consented_at`), `profiles`, `quotes` (contact details), messages/comments.
- **Consent:** `leads.consented_at` records GDPR consent captured at the
  machine; capture forms surface a consent checkbox (config-driven).
- **Retention:** per-event `retention_days` (default 60). The
  `/api/cron/purge-leads` job deletes leads past their window (two-sweep:
  configured events + default). **Purge is destructive and irreversible without
  a backup** — confirm retention config before enabling in a new environment.
- **Enforcement location:** business-email-only and duplicate blocking are
  **machine-side** (`Portal side only` in the portal — it authors and pushes the
  rules). See [`docs/17`](../17-feature-reference.md).
- **Decision required:** legal sign-off on the consent-checkbox template and the
  60-day default ([`OWNER-TODO.md`](../../OWNER-TODO.md)).

## Secret rotation

Rotate in the provider, then update Vercel env and redeploy:

| Secret | Provider | On rotation |
|--------|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` / anon | Supabase | Update Vercel; redeploy. Service key is server-only |
| `CRON_SECRET` | self-issued | Update Vercel + any manual callers; crons 401 until matched |
| `*_WEBHOOK_SECRET` | Cloud / Cal.com | Update the provider's webhook config **and** Vercel together (fails closed if mismatched) |
| `RESEND_API_KEY` | Resend | Update Vercel; verify a send |
| `PIPEDRIVE_API_TOKEN` | Pipedrive | Update Vercel; outbox resumes draining |
| `SENTRY_AUTH_TOKEN` | Sentry | CI/build only |

No secrets are committed; `.env.example` holds names + guidance only.

## Backup & disaster recovery

> `Decision required` throughout — these are operator choices made in the
> Supabase/Vercel dashboards, not in the repo. The repo cannot prove a backup
> exists; validate in the provider.

- **Database backups:** enable Supabase automated backups / Point-in-Time
  Recovery (PITR) at a tier that meets your RPO. **Not configured in-repo.**
- **RPO/RTO template:** decide and record — e.g. *RPO ≤ 24h (daily backups) or
  ≤ 5 min (PITR); RTO ≤ 2h*. Fill in the agreed targets here once set.
- **Restore drill:** on a schedule, restore the latest backup into a scratch
  project, run `npx supabase db push` parity check, and smoke-test
  (deployment-runbook §6). Record the last drill date.
- **App recovery:** stateless — redeploy the previous Vercel build. State lives
  entirely in Supabase, so DB recovery is the critical path.
- **Migrations are forward-only** in prod (no automated down-migrations) — a bad
  migration is recovered by forward-fix or PITR, not by "rolling back" the
  schema.

## Incident response (skeleton)

1. **Detect** — Sentry alert, failed cron, webhook 5xx, or user report.
2. **Triage** — identify blast radius (one event? one integration? all users?).
   Check Vercel function logs + Sentry for the stack.
3. **Contain** — disable the offending path (unset an integration secret to fail
   it closed; pause a cron by removing its schedule and redeploying).
4. **Recover** — forward-fix and redeploy; restore from backup only for data
   loss.
5. **Review** — record cause + follow-ups in `CHANGELOG.md` /
   [`docs/13`](../13-dev-handover-priorities.md).
