-- Workstream 9: Data Delivery and Reporting Intelligence
-- Scheduled exports table for recurring data delivery.

create table if not exists scheduled_exports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  created_by uuid references profiles(id),
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'end_of_event', 'on_demand')),
  format text not null default 'csv' check (format in ('csv', 'excel', 'pdf')),
  include_fields text[] not null default '{leads}',
  recipients text[] not null default '{}',
  is_active boolean not null default true,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_exports_event on scheduled_exports(event_id);
create index if not exists idx_scheduled_exports_next_send on scheduled_exports(next_send_at) where is_active = true;

alter table scheduled_exports enable row level security;

create policy "Internal users can manage scheduled exports"
  on scheduled_exports for all using (true);
