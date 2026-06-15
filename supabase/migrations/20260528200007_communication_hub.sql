-- Workstream 10: Communication Hub
-- Extends messages with topic tags, adds handoff_notes table.

alter table messages
  add column if not exists topic text default 'general' check (topic in (
    'general', 'creative', 'logistics', 'compliance', 'configuration', 'finance'
  ));

create table if not exists handoff_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  from_stage text not null,
  to_stage text not null,
  author_id uuid not null references profiles(id),
  whats_done text,
  whats_pending text,
  client_notes text,
  created_at timestamptz not null default now()
);

create index idx_handoff_notes_event on handoff_notes(event_id);
