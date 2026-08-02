# SETUP.md — Getting a development environment running

> **Version:** 0.1.0 · **Status:** current · **Owner:** Platform ·
> **Last verified:** 2026-08-01.
>
> Three paths. Pick the one that matches what you need. **Path B (local
> Postgres) is the default for engineering work** — it is the only runtime that
> exercises RLS, PostgREST and real passwords. Path A is faster and needs no
> database, but it proves nothing about whether the real database will accept
> what you wrote; use it for UI work and walkthroughs.

## Prerequisites (all paths)

- **Node.js ≥ 20** (CI uses 22; `nvm use 22` is the recommended pin). Enforced
  via `engines` in [`package.json`](package.json).
- **npm** (ships with Node).
- **Git**.

Paths B and C additionally use the **Supabase CLI** and (for local Postgres and
RLS tests) **Docker**. The CLI is invoked via `npx supabase …`, so it does not
need a global install; Docker must be running for `supabase start` /
`npm run test:rls`.

```bash
git clone <repo-url>
cd Bright.Experience
npm install
```

---

## Path A — Mock-mode demo (no accounts, no database)

The whole frontend runs against an in-memory mock dataset
([`src/lib/supabase/mock/`](src/lib/supabase/mock/)). This is the **default
demo runtime** — ideal for UI work, offline development, and walkthroughs.

```bash
npm run dev   # NEXT_PUBLIC_MOCK_MODE=1 is already set in .env.development
```

Open <http://localhost:3000>.

- **Auth is faked** with a cookie (`bx_mock_uid`, see
  [`src/lib/supabase/mock/flag.ts`](src/lib/supabase/mock/flag.ts)) holding the
  seeded profile you "log in" as. Use the **Demo accounts** pills on `/login`
  to switch personas.
- **Dates are evergreen.** Mock rows are authored against a fixed anchor
  (2026-06-18) and shifted to "today" at load, so timelines always look live
  (see `HANDOFF.md` → "Mock dataset sync").
- No Supabase, Resend, Cloud, Pipedrive, or Cal.com credentials are needed;
  every integration degrades to a safe no-op.
- **No security is enforced.** Any password is accepted, no JWT is issued, and
  RLS never runs. A production build ignores the flag and logs an error rather
  than serving an unauthenticated app.

> Mock mode and real Supabase share one hand-maintained dataset. Any schema or
> seed change must be mirrored in `src/lib/supabase/mock/dataset.ts` **and**
> `supabase/seed.sql` / `supabase/run-seed.ts` or the two runtimes drift.

---

## Path B — Local Supabase (real auth, RLS, storage)

Runs a full Postgres + Auth + Storage stack locally via the Supabase CLI. This
is the default for engineering work, and mandatory for anything touching auth,
policies, storage or a new query shape.

### The short version

```bash
npm run db:local    # start the stack, apply migrations, seed users + data
npm run dev:local   # dev server pointed at it, mock mode off
```

Both scripts read the anon and service-role keys back out of the Supabase CLI,
so nothing needs pasting into `.env.local` and a restarted stack keeps working.
Then `npm run db:reset` to re-seed, `npm run db:stop` to shut down,
`npm run test:rls` and `npm run test:integration` to verify against it.

### The long version (what those scripts do)

1. **Start the local stack** (requires Docker running):

   ```bash
   npx supabase start
   ```

   Note the printed API URL (`http://127.0.0.1:54321`), anon key, and
   service-role key.

2. **Configure the environment** — copy and fill `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Set the four Required vars from the `supabase start` output:

   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service-role key>`
   - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

   Leave `NEXT_PUBLIC_MOCK_MODE` unset/false.

3. **Apply schema and seed.** Order matters: `seed.sql` references auth users
   created by the TS script (which is why `db.seed` is disabled in
   `supabase/config.toml`), and `run-seed.ts` builds on the catalogue and asset
   rows `seed.sql` creates.

   ```bash
   npx supabase db push                 # applies supabase/migrations/* in order
   npx tsx supabase/seed-users.ts       # creates auth users + profiles
   bash scripts/apply-seed-sql.sh       # catalogue, events, assets (skips if present)
   npx tsx supabase/run-seed.ts         # the lived-in demo layer on top
   # optional: npx tsx supabase/seed-creative-queue.ts  # creative review demo data
   ```

4. **Run it:**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. Seeded users share the password
   `demo-password-123` (personas listed in `HANDOFF.md`).

> `npx tsx` and `npx supabase` are fetched on demand — neither `tsx` nor the
> Supabase CLI is a declared dependency. If you hit version issues, install a
> pinned Supabase CLI globally.

---

## Path C — Hosted Supabase project (shared dev / staging)

Point the app at a hosted Supabase project instead of a local stack.

1. Create a project at <https://supabase.com>.
2. In `.env.local`, set the four Required vars to the hosted project's values
   (Project Settings → API): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
   `NEXT_PUBLIC_SITE_URL`.
3. Link and push migrations:

   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   npx tsx supabase/seed-users.ts
   npx tsx supabase/run-seed.ts
   ```

4. In the Supabase dashboard → **Authentication → URL Configuration**, add your
   site URL and redirect URLs (`<site>/auth/callback`) so magic links and
   password resets land correctly.
5. `npm run dev`.

For production promotion, storage buckets, and auth settings, see
[`docs/ops/deployment-runbook.md`](docs/ops/deployment-runbook.md) and
[`docs/11-cloud-handoff.md`](docs/11-cloud-handoff.md) Part A.

---

## Optional integrations (any path)

All degrade gracefully when unset. Enable per
[`docs/ops/integration-activation.md`](docs/ops/integration-activation.md):

| Service | Vars | Off behaviour |
|---------|------|---------------|
| Resend (email) | `RESEND_API_KEY`, `FROM_EMAIL` | Emails logged to console |
| Bright.Blue Cloud | `BRIGHTBLUE_API_URL/KEY`, `BRIGHTBLUE_WEBHOOK_SECRET` | Live data from local DB; inbound webhook 503s |
| Cal.com | `NEXT_PUBLIC_CALCOM_LINK`, `CALCOM_WEBHOOK_SECRET` | Built-in preset slot picker |
| Pipedrive | `PIPEDRIVE_API_TOKEN` | Outbox drains to no-op |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN` | Disabled |
| File scan | `FILE_SCAN_URL` | Uploads pass unscanned |
| Crons | `CRON_SECRET` | `/api/cron/*` return 401 |

---

## Verify your environment

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests, mocked Supabase
```

All three must pass. On Path B, also run the two suites that need a real
database — the unit suite mocks Supabase and so cannot catch a broken policy or
a query PostgREST rejects:

- `npm run test:rls` — pgTAP RLS tests, one file per policy.
- `npm run test:integration` — the hot read path, executed as real signed-in
  personas. Skips with a warning if the stack isn't up.
- `npm run test:e2e` — Playwright (builds a production server; first run needs
  `npx playwright install --with-deps chromium`).

## Mobile / LAN testing

To open the dev server from a phone on the same network, add your host's subnet
to `allowedDevOrigins` in [`next.config.ts`](next.config.ts) (Next.js 16 blocks
cross-origin dev resources otherwise, which leaves the page rendered but not
interactive). Then browse to `http://<your-lan-ip>:3000`.

## Common setup issues

See [`docs/ops/maintenance-and-troubleshooting.md`](docs/ops/maintenance-and-troubleshooting.md)
for the full list. The frequent ones:

- **Taps do nothing on a phone** → add the LAN subnet to `allowedDevOrigins`.
- **Seed fails with missing auth users** → run `seed-users.ts` before
  `run-seed.ts`.
- **RLS tests won't start** → Docker isn't running.
