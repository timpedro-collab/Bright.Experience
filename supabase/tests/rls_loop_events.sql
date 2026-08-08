-- =====================================================================
-- RLS: loop_events
--
-- Loop-pulse telemetry is internal-only: customers must not see the
-- rows, and nobody writes through RLS (service role only).
-- =====================================================================

begin;
\ir _fixtures.psql

-- Seed a row as the table owner (bypasses RLS, like the service role does).
insert into loop_events (id, kind, artifact, metadata) values
  ('00000000-0000-4000-8000-0000000000b1', 'invitation_landing', 'report', '{}'::jsonb)
on conflict (id) do nothing;

select plan(3);

-- (1) Customer cannot see loop events
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from loop_events),
  0,
  'customer cannot see any loop_events rows'
);

-- (2) Customer cannot insert loop events
select throws_ok(
  $$insert into loop_events (kind, artifact) values ('spoof', 'report')$$,
  '42501',
  'new row violates row-level security policy for table "loop_events"',
  'customer cannot insert loop_events rows'
);

-- (3) Internal user can read loop events
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from loop_events),
  1,
  'internal user can read loop_events'
);

select * from finish();
rollback;
