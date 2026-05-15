-- ============================================================
-- Phase 5: Proof of Performance & Reporting
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  report_type text not null default 'post_event'
    check (report_type in ('post_event', 'mid_event', 'custom')),
  title text not null,
  metrics_json jsonb default '{}',
  predictions_json jsonb default '{}',
  comparison_json jsonb default '{}',
  highlights_json jsonb default '[]',
  share_token text unique,
  generated_at timestamptz default now(),
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table benchmarks (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  location_tier text,
  machine_type text,
  game_type text,
  metric_name text not null,
  avg_value numeric,
  median_value numeric,
  p25_value numeric,
  p75_value numeric,
  sample_size integer default 0,
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_event_reports_event_id on event_reports(event_id);
create index idx_event_reports_share_token on event_reports(share_token);
create index idx_event_reports_is_published on event_reports(is_published);

create index idx_benchmarks_composite
  on benchmarks(event_type, machine_type, metric_name);
create index idx_benchmarks_updated_at on benchmarks(updated_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table event_reports enable row level security;
alter table benchmarks enable row level security;

-- event_reports: internal sees all
create policy "Internal see all event reports"
  on event_reports for select using (is_internal_user());

-- event_reports: internal manage all
create policy "Internal manage event reports"
  on event_reports for all using (is_internal_user());

-- event_reports: customers see reports for their events
create policy "Customers see own event reports"
  on event_reports for select using (
    event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- event_reports: public can view published reports with a share_token
create policy "Public can view shared reports"
  on event_reports for select using (
    is_published = true and share_token is not null
  );

-- benchmarks: internal can manage
create policy "Internal manage benchmarks"
  on benchmarks for all using (is_internal_user());

-- benchmarks: customers can read
create policy "Customers read benchmarks"
  on benchmarks for select using (true);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on event_reports
  for each row execute function update_updated_at();

create trigger set_updated_at before update on benchmarks
  for each row execute function update_updated_at();
