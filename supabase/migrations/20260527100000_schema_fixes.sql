-- Schema fixes: hourly_metrics table, is_final column, studio_pricing RLS
-- Resolves 3 schema/code mismatches found in audit.

-- 1. hourly_metrics — used by report.ready webhook handler
create table if not exists hourly_metrics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  snapshot_date date not null,
  hour integer not null check (hour >= 0 and hour <= 23),
  plays integer not null default 0,
  leads integer not null default 0,
  created_at timestamptz default now(),
  unique (event_id, snapshot_date, hour)
);

create index idx_hourly_metrics_event on hourly_metrics(event_id);

alter table hourly_metrics enable row level security;

create policy "Internal full access on hourly_metrics"
  on hourly_metrics for all using (is_internal_user());

create policy "Customers see own event hourly_metrics"
  on hourly_metrics for select using (
    event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- 2. is_final column on event_metrics_snapshot
alter table event_metrics_snapshot
  add column if not exists is_final boolean not null default false;

-- 3. Fix studio_pricing RLS to use project-standard is_internal_user()
drop policy if exists "studio_pricing_internal_insert" on studio_pricing;
drop policy if exists "studio_pricing_internal_update" on studio_pricing;

create policy "studio_pricing_internal_insert"
  on studio_pricing for insert
  with check (is_internal_user());

create policy "studio_pricing_internal_update"
  on studio_pricing for update
  using (is_internal_user());
