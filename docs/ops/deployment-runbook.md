# Deployment Runbook

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-07-25.
>
> How to deploy Bright.Experience (Next.js on Vercel + Supabase). Steps that
> require an external account or a real backup are flagged — they cannot be
> validated from the repo alone.

## Target topology

- **App:** Next.js 16 on Vercel (RSC-first). `poweredByHeader:false`,
  security headers set in [`next.config.ts`](../../next.config.ts).
- **Data/Auth/Storage:** Supabase (Postgres 17).
- **Scheduler:** Vercel Cron (UTC) — 5 jobs in
  [`vercel.json`](../../vercel.json). Hobby plan caps crons at daily; Pro
  unlocks the hourly digest/pipedrive schedules.
- **Email:** Resend. **Errors:** Sentry. **CRM:** Pipedrive.
  **Machines/telemetry:** Bright.Blue Cloud. **Booking:** Cal.com.

## 1. Pre-deploy checklist

Work the production checklist in [`README.md`](../../README.md) and the Cloud
handoff Part A ([`docs/11`](../11-cloud-handoff.md)). Minimum:

- [ ] All **Required** env vars set in Vercel project settings.
- [ ] `NEXT_PUBLIC_SITE_URL` = production domain (not localhost).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` server-side only (never `NEXT_PUBLIC_*`).
- [ ] `CRON_SECRET` set (else all `/api/cron/*` return 401).
- [ ] Webhook secrets set for any enabled inbound integration (fail closed).
- [ ] `next/image` `remotePatterns` include your real storage/CDN hosts.
- [ ] `STUBS-TO-REPLACE.md` reviewed — launch-blocking stubs replaced.
- [ ] `/privacy` and `/terms` contain reviewed legal copy.

## 2. Database: migrate and seed

Migrations are the executable truth (59 files, filename order).

```bash
npx supabase link --project-ref <prod-ref>   # once per environment
npx supabase db push                         # applies supabase/migrations/*
```

**Seeding is for non-prod only.** For a fresh dev/staging environment:

```bash
npx tsx supabase/seed-users.ts   # auth users + profiles — MUST run first
bash scripts/apply-seed-sql.sh   # seed.sql: catalogue, events, assets
npx tsx supabase/run-seed.ts     # the demo layer built on top
```

> Order matters. `db.seed` is disabled in `supabase/config.toml` because the SQL
> seed depends on auth users created by `seed-users.ts`, and `run-seed.ts`
> depends on rows `seed.sql` creates. Never run the demo seed against a real
> customer database. The mock dataset, `seed.sql`, and `run-seed.ts` are a
> manual three-way sync (see [`docs/14`](../14-codebase-map.md)).

## 3. Storage & auth configuration (Supabase dashboard)

- **Storage:** private buckets; the app serves signed URLs. Confirm bucket
  names match the code in `src/lib/storage/`.
- **Auth → URL configuration:** add the production site URL and redirect URLs
  (`<site>/auth/callback`) so magic links / password resets resolve.
- **Auth policy:** raise from permissive local defaults — enable email
  confirmations, sensible password length, and a realistic email rate limit
  (see [`docs/11`](../11-cloud-handoff.md) A3).
- **Auth → Providers → Email must stay ENABLED.** It is the provider switch, not
  a signup switch, and turning it off takes every login offline. Self-signup is
  blocked separately by **Auth → Sign In / Providers → Allow new users to sign
  up = off**, mirroring `[auth] enable_signup = false` in `config.toml`. Every
  account arrives by admin invite.

## 4. Deploy the app

Push to `main` (or promote a preview) in Vercel. The build runs `next build`
with Sentry source-map upload when `SENTRY_ORG`/`SENTRY_PROJECT`/
`SENTRY_AUTH_TOKEN` are set. Confirm the build compiles (CI already runs
`npm run build` on every push).

## 5. Activate crons

Vercel reads [`vercel.json`](../../vercel.json) on deploy. Confirm all five jobs
appear under the project's Cron tab and that `CRON_SECRET` is set — each job
authenticates with `Authorization: Bearer $CRON_SECRET` (fails closed).

| Job | Schedule (UTC) |
|-----|----------------|
| `/api/cron/reminders` | `0 9 * * *` |
| `/api/cron/digest` | `0 10 * * *` |
| `/api/cron/pipedrive` | `0 7 * * *` |
| `/api/cron/reports` | `0 8 * * *` |
| `/api/cron/purge-leads` | `30 2 * * *` |

> **Hobby-plan note:** Vercel's Hobby tier only allows daily crons, so `digest`
> and `pipedrive` currently run once a day. On a Pro plan, restore both to
> `0 * * * *` in `vercel.json` for hourly digests and CRM sync.

## 6. Smoke test after deploy

- [ ] `GET /` (homepage) renders.
- [ ] Sign in as a seeded/internal user; `/` dashboard loads.
- [ ] Open an event; `/events/:id` overview and one lane page load.
- [ ] `GET /api/notifications/count` returns JSON for a signed-in user.
- [ ] `GET /api/events/:id/live` returns metrics (401 when logged out).
- [ ] Trigger one cron manually with the bearer to confirm auth:
      `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/reminders`
      (expect 200; without the header expect 401).
- [ ] If Sentry is on, confirm a test event appears with a readable stack.

## 7. Environment promotion

Promote **dev → staging → prod** by pointing each Vercel environment at its own
Supabase project and env set. Run `db push` per environment. Never share a
service-role key across tiers. Seed only non-prod tiers.

## 8. Rollback boundaries

- **App:** roll back by redeploying the previous Vercel build (instant).
- **Migrations:** there is **no automated down-migration path**. A schema
  rollback is a manual, forward-fix or point-in-time-restore decision — see
  [`monitoring-security-and-dr.md`](monitoring-security-and-dr.md). Treat every
  migration as forward-only in production.
- **Data:** destructive changes (e.g. the purge cron) are not reversible without
  a backup/PITR restore. Verify retention config before enabling
  `purge-leads` in a new environment.
