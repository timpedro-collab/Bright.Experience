-- Workstream 7: External Vendor Coordination
-- Extends logistics_entries with vendor details and adds venue requirements table.

alter table logistics_entries
  add column if not exists vendor_name text,
  add column if not exists vendor_contact_email text,
  add column if not exists vendor_responsibility text,
  add column if not exists insurance_coverage text;

create table if not exists venue_requirements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  requirement_type text not null check (requirement_type in (
    'exhibitor_manual', 'power_spec', 'loading_access', 'insurance_minimum',
    'h_and_s', 'wifi', 'parking', 'floor_plan', 'build_schedule', 'other'
  )),
  description text not null,
  document_url text,
  is_met boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_venue_requirements_event on venue_requirements(event_id);
