-- =====================================================================
-- Constraint fixes from docs/11-cloud-handoff.md Part E.
--
-- 1. `machine_instances.current_placement_id` FK (E6). The column was a
--    loose uuid because `placements` is created three migrations later
--    (telemetry_tables 000005 vs venue_runway_tables 000008), so the FK
--    couldn't exist at table-creation time. Add it now, plus the index
--    the join needs.
--
-- 2. Widen the `telemetry_events.event_type` allow-list. The original
--    six-value check predates the richer machine vocabulary the app
--    already ingests (webhook `telemetry.batch` inserts the type string
--    verbatim) and renders (live feed labels): interaction, screen_touch,
--    survey_completed, linkedin_follow, qr_scan. Without this, a real
--    machine batch containing any of those types fails the whole insert.
-- =====================================================================

alter table machine_instances
  add constraint machine_instances_current_placement_id_fkey
  foreign key (current_placement_id) references placements(id)
  on delete set null;

create index if not exists idx_machine_instances_placement
  on machine_instances(current_placement_id);

alter table telemetry_events
  drop constraint if exists telemetry_events_event_type_check;

alter table telemetry_events
  add constraint telemetry_events_event_type_check
  check (event_type in (
    'play_started', 'play_completed', 'lead_captured',
    'prize_awarded', 'heartbeat', 'error',
    'interaction', 'screen_touch', 'survey_completed',
    'linkedin_follow', 'qr_scan'
  ));
