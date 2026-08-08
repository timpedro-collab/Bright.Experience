-- Loop-pulse telemetry (experience audit Tier 3 / Phase 5).
--
-- One row per loop touch: an invitation-footer landing, a pitch detail
-- unlock, a player-card view. Written by the server (service role) only;
-- read by internal users on the loop-pulse dashboard. Deliberately schema-
-- light: `kind` + `artifact` cover grouping, `metadata` carries the rest.

create table if not exists public.loop_events (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  artifact text,
  event_id uuid references public.events(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.loop_events is
  'Self-promotion loop telemetry: invitation landings, pitch unlocks, share-card views. Service-role writes only.';

create index if not exists idx_loop_events_kind_created
  on public.loop_events (kind, created_at desc);
create index if not exists idx_loop_events_event_id
  on public.loop_events (event_id);

alter table public.loop_events enable row level security;

-- Internal staff read the loop-pulse dashboard; nobody writes through RLS
-- (inserts come from the service role, which bypasses policies).
drop policy if exists loop_events_internal_read on public.loop_events;
create policy loop_events_internal_read on public.loop_events
  for select using (public.is_internal_user());
