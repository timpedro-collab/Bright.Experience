-- ============================================================
-- Phase 4: Live Event Mode & Telemetry
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table machine_instances (
  id uuid primary key default gen_random_uuid(),
  machine_type_id uuid not null references machines(id),
  serial_number text not null unique,
  nickname text,
  current_event_id uuid references events(id),
  current_placement_id uuid,
  status text not null default 'available'
    check (status in ('available', 'deployed', 'maintenance', 'retired')),
  last_heartbeat timestamptz,
  firmware_version text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table telemetry_events (
  id uuid primary key default gen_random_uuid(),
  machine_instance_id uuid not null references machine_instances(id),
  event_id uuid not null references events(id),
  event_type text not null
    check (event_type in (
      'play_started', 'play_completed', 'lead_captured',
      'prize_awarded', 'heartbeat', 'error'
    )),
  payload_json jsonb default '{}',
  timestamp timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  machine_instance_id uuid references machine_instances(id),
  contact_name text,
  contact_email text,
  contact_phone text,
  custom_fields_json jsonb default '{}',
  source text not null default 'game',
  captured_at timestamptz default now()
);

create table event_metrics_snapshot (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id),
  snapshot_date date not null,
  total_plays integer not null default 0,
  total_interactions integer not null default 0,
  total_leads integer not null default 0,
  total_prizes integer not null default 0,
  avg_dwell_time numeric,
  peak_hour integer,
  custom_json jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (event_id, snapshot_date)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- machine_instances
create index idx_machine_instances_serial on machine_instances(serial_number);
create index idx_machine_instances_event on machine_instances(current_event_id);
create index idx_machine_instances_status on machine_instances(status);

-- telemetry_events
create index idx_telemetry_machine on telemetry_events(machine_instance_id);
create index idx_telemetry_event on telemetry_events(event_id);
create index idx_telemetry_type on telemetry_events(event_type);
create index idx_telemetry_timestamp on telemetry_events(timestamp);

-- leads
create index idx_leads_event on leads(event_id);
create index idx_leads_email on leads(contact_email);
create index idx_leads_captured on leads(captured_at);

-- event_metrics_snapshot
create index idx_metrics_event on event_metrics_snapshot(event_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table machine_instances enable row level security;
alter table telemetry_events enable row level security;
alter table leads enable row level security;
alter table event_metrics_snapshot enable row level security;

-- machine_instances: internal full access
create policy "Internal see all machine instances"
  on machine_instances for select using (is_internal_user());

create policy "Internal manage machine instances"
  on machine_instances for all using (is_internal_user());

-- machine_instances: customers see machines deployed to their events
create policy "Customers see event machine instances"
  on machine_instances for select using (
    current_event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- telemetry_events: internal full access
create policy "Internal see all telemetry"
  on telemetry_events for select using (is_internal_user());

create policy "Internal manage telemetry"
  on telemetry_events for all using (is_internal_user());

-- telemetry_events: customers see telemetry for their events
create policy "Customers see event telemetry"
  on telemetry_events for select using (
    event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- leads: internal full access
create policy "Internal see all leads"
  on leads for select using (is_internal_user());

create policy "Internal manage leads"
  on leads for all using (is_internal_user());

-- leads: customers see leads for their events
create policy "Customers see event leads"
  on leads for select using (
    event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- event_metrics_snapshot: internal full access
create policy "Internal see all metrics"
  on event_metrics_snapshot for select using (is_internal_user());

create policy "Internal manage metrics"
  on event_metrics_snapshot for all using (is_internal_user());

-- event_metrics_snapshot: customers see metrics for their events
create policy "Customers see event metrics"
  on event_metrics_snapshot for select using (
    event_id in (
      select id from events where account_id = user_account_id()
    )
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on machine_instances
  for each row execute function update_updated_at();

create trigger set_updated_at before update on event_metrics_snapshot
  for each row execute function update_updated_at();
