# Maintenance & Troubleshooting

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25.
>
> Routine upkeep and a diagnosis guide for the known failure modes. For setup
> issues see [`SETUP.md`](../../SETUP.md); for deploy/rollback see the
> [deployment runbook](deployment-runbook.md).

## Routine maintenance

| Cadence | Task |
|---------|------|
| Per PR | `npm run lint`, `npm run typecheck`, `npm test` green; ship tests with new `src/lib` helpers and server actions |
| Weekly | Review Sentry issues; check cron run history in Vercel |
| Monthly | `npm run test:coverage` to confirm thresholds; dependency review (`npm outdated`) |
| Per schema change | Add a migration; mirror into `src/lib/supabase/mock/dataset.ts`, `supabase/seed.sql`/`run-seed.ts`; update [`docs/04`](../04-data-model.md)/[`docs/11`](../11-cloud-handoff.md) |
| Per integration change | Update [`docs/10`](../10-integrations.md) + [integration-activation](integration-activation.md) |
| Per retention/legal change | Confirm `retention_days` default + consent copy with the data-protection owner |

## Dependency updates

Node is pinned via `engines` (`>=20`; CI 22). Update deliberately: bump, run the
full local gate (`lint`/`typecheck`/`test`/`build`), then `test:e2e` for
framework/UI bumps. Next.js is a **modified/pinned** version — read the guides
in `node_modules/next/dist/docs/` before changing Next-related code (see
`AGENTS.md`).

## Troubleshooting

### Taps do nothing on a phone / LAN device
The page renders but never hydrates. Next.js 16 blocks cross-origin dev
resources. **Fix:** add your host's subnet to `allowedDevOrigins` in
[`next.config.ts`](../../next.config.ts) and restart the dev server. Currently
allows `192.168.1.*`, `192.168.86.*`, `localhost`.

### Seed fails: missing auth users
`run-seed.ts` references auth users. **Fix:** run `seed-users.ts` **before**
`run-seed.ts`. (This is why `db.seed` is disabled in `config.toml`.)

### Mock mode and real Supabase show different data
The mock dataset, `seed.sql`, and `run-seed.ts` are a manual three-way sync.
**Fix:** apply the same change to all relevant paths; there is no generator.

### RLS tests won't start
`npm run test:rls` needs Docker + the Supabase CLI. **Fix:** start Docker, then
`npx supabase start`, then rerun.

### Webhook returns 503 or 401
- **503** = the provider's `*_WEBHOOK_SECRET` is unset (fails closed). Set it.
- **401** = signature mismatch. Confirm the **same** secret is set in the
  provider's webhook config and in Vercel, and that the provider signs the exact
  header (`x-cal-signature-256` for Cal.com; HMAC body for Cloud). Rotate both
  sides together.

### Cron never runs / returns 401
`CRON_SECRET` unset or mismatched → 401 (fails closed), so scheduled work
silently stops. **Fix:** set `CRON_SECRET` in Vercel; verify with
`curl -H "Authorization: Bearer $CRON_SECRET" <site>/api/cron/reminders`.

### Proposal pricing not showing to the customer
By design, pricing is hidden until `walkthrough_completed_at` is set or the
quote is accepted. **Check:** did the Cal.com `MEETING_ENDED` webhook fire and
map the `quoteId`? Without Cal.com configured, completion is set through the
built-in flow.

### Auth redirect loops / magic links land on localhost
Supabase Auth redirect URLs don't match the deployed domain, or
`NEXT_PUBLIC_SITE_URL` is wrong. **Fix:** set `NEXT_PUBLIC_SITE_URL` to the prod
domain and add `<site>/auth/callback` in Supabase Auth → URL Configuration.

### Images fail to load / optimise
Host not in `next/image` `remotePatterns`. **Fix:** add the storage/CDN host to
[`next.config.ts`](../../next.config.ts) `images.remotePatterns`.

### PDF/export times out
PDF and export routes set `maxDuration=60` for serverless limits. Large exports
may still hit platform limits. **Mitigate:** narrow the view/date range, or move
heavy generation to a background/queued path (future work).

### Venue embed blocked in an iframe
`X-Frame-Options: DENY` applies to all routes, including `/venues/:slug/embed`.
See the unresolved header-scoping item in
[`monitoring-security-and-dr.md`](monitoring-security-and-dr.md#-unresolved-iframe-vs-frame-policy).

### Rate-limited quote/decision submissions
`quoteLimiter`/`decisionLimiter` (`src/lib/rate-limit.ts`) throttle public
endpoints. The limiter is in-memory per instance — under multi-instance scale it
does not share state. **Follow-up:** move to a shared store (e.g. Upstash) for
horizontal scaling. `Decision required`.

### Tests time out locally but pass in CI
Historically caused by host CPU contention, not code. **Fix:** rerun the
affected tests in isolation or when the machine is idle. If persistent in CI,
investigate the specific test.

## Escalation

Persistent production issues → capture the Sentry link + Vercel function logs,
note the blast radius, and follow the incident skeleton in
[`monitoring-security-and-dr.md`](monitoring-security-and-dr.md#incident-response-skeleton).
Track root cause + follow-ups in `CHANGELOG.md` and
[`docs/13-dev-handover-priorities.md`](../13-dev-handover-priorities.md).
