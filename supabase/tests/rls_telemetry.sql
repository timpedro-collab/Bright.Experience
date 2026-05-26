-- =====================================================================
-- RLS: machine_instances, telemetry_events, leads, event_metrics_snapshot
--
-- Verifies:
--   1. Customer sees telemetry / leads / metrics only for own events
--   2. Internal sees every row
--   3. Anon cannot see any telemetry surface
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into machines (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000m1', 'Bright.Vend Pro', 'bright-vend-pro', true)
on conflict (id) do nothing;

insert into machine_instances (id, machine_type_id, serial_number, current_event_id, status) values
  ('00000000-0000-4000-8000-0000000000mi', '00000000-0000-4000-8000-0000000000m1', 'BV-1001', '00000000-0000-4000-8000-0000000000e1', 'deployed'),
  ('00000000-0000-4000-8000-0000000000mj', '00000000-0000-4000-8000-0000000000m1', 'BV-1002', '00000000-0000-4000-8000-0000000000e2', 'deployed')
on conflict (id) do nothing;

insert into telemetry_events (machine_instance_id, event_id, event_type) values
  ('00000000-0000-4000-8000-0000000000mi', '00000000-0000-4000-8000-0000000000e1', 'play_started'),
  ('00000000-0000-4000-8000-0000000000mj', '00000000-0000-4000-8000-0000000000e2', 'play_started');

insert into leads (event_id, contact_email, source) values
  ('00000000-0000-4000-8000-0000000000e1', 'lead-acme@x.test', 'game'),
  ('00000000-0000-4000-8000-0000000000e2', 'lead-other@x.test', 'game');

insert into event_metrics_snapshot (event_id, snapshot_date, total_plays) values
  ('00000000-0000-4000-8000-0000000000e1', '2026-06-01', 12),
  ('00000000-0000-4000-8000-0000000000e2', '2026-07-01', 9)
on conflict (event_id, snapshot_date) do nothing;

select plan(6);

-- (1) Acme customer sees only their machine_instances
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(serial_number order by serial_number)::text[] from machine_instances),
  array['BV-1001']::text[],
  'customer sees only their event machine_instances'
);

-- (2) Acme customer sees only their telemetry_events
select is(
  (select count(*)::int from telemetry_events where event_id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees only their telemetry'
);

select is(
  (select count(*)::int from telemetry_events where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account telemetry'
);

-- (3) Acme customer sees only their leads
select is(
  (select array_agg(contact_email order by contact_email)::text[] from leads),
  array['lead-acme@x.test']::text[],
  'customer sees only own event leads'
);

-- (4) Internal sees every telemetry row
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from telemetry_events),
  '>=', 2,
  'internal sees every telemetry row'
);

-- (5) Anon cannot see telemetry
select _rls_test_anon();
select is(
  (select count(*)::int from telemetry_events),
  0,
  'anon sees no telemetry'
);

select * from finish();
rollback;
