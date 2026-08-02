-- ============================================================
-- Cron heartbeat
-- ============================================================
--
-- Five scheduled jobs carry real obligations: the reminder sweep, the FYI
-- digest, the Pipedrive outbox drain, report generation and the lead-retention
-- purge. Until now a silently-dead scheduler was invisible — nothing recorded
-- that a job had run, so "no reminders went out this week" looked exactly like
-- "nothing needed reminding". The retention purge is the sharpest case: if it
-- stops, we hold personal data past the window we promised.
--
-- One row per job, upserted on every invocation. /api/health reads it and
-- reports a job stale when it has missed its expected interval.

create table if not exists cron_runs (
  job text primary key,
  last_run_at timestamptz not null default now(),
  last_status text not null default 'ok' check (last_status in ('ok', 'error')),
  -- Whatever the job wants to leave behind: counts sent, rows purged, the
  -- error message. Kept as jsonb so a job can change its shape without a
  -- migration.
  last_detail jsonb not null default '{}',
  -- Total invocations and consecutive failures, so a flapping job is visible
  -- without keeping a full history.
  run_count bigint not null default 0,
  consecutive_failures integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table cron_runs is
  'Heartbeat: one row per scheduled job, upserted on every run. Read by /api/health.';

alter table cron_runs enable row level security;

-- Writers are cron routes using the service-role client, which bypasses RLS.
-- Only internal staff can read it; there is nothing here for a customer.
drop policy if exists "Internal read cron runs" on cron_runs;
create policy "Internal read cron runs"
  on cron_runs for select using (is_internal_user());

-- ============================================================
-- Migration version, for the health endpoint
-- ============================================================
-- `supabase_migrations` is not exposed over PostgREST, so the health check
-- reads the applied version through this function instead. Version strings are
-- timestamps, not secrets, but the function is still internal/service-role only
-- by virtue of being called with the service-role client.

create or replace function public.schema_migration_version()
returns text
language sql
stable
security definer
set search_path = public, supabase_migrations
as $$
  select max(version) from supabase_migrations.schema_migrations;
$$;

comment on function public.schema_migration_version() is
  'Latest applied migration version; used by /api/health to detect a stale deploy.';

revoke all on function public.schema_migration_version() from anon, authenticated;
