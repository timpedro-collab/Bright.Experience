-- =====================================================================
-- RLS: events
--
-- Verifies the four guarantees of the events policies:
--   1. customer sees their own account's events
--   2. customer does NOT see another account's events
--   3. internal users see every event
--   4. only internal users can insert/update events (write paths)
-- =====================================================================

begin;
\ir _fixtures.psql

select plan(6);

-- (1) Acme customer sees the Acme event
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from events where id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees own-account event'
);

-- (2) ...and only that one
select is(
  (select count(*)::int from events),
  1,
  'customer cannot see other-account events'
);

-- (3) Other customer cannot see Acme event
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from events where id = '00000000-0000-4000-8000-0000000000e1'),
  0,
  'customer from other account cannot see Acme event'
);

-- (4) Internal user sees both events
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from events),
  2,
  'internal user sees every event'
);

-- (5) Customer cannot update events
select _rls_test_as('00000000-0000-4000-8000-000000000020');
update events set name = 'Hacked' where id = '00000000-0000-4000-8000-0000000000e1';
select is(
  (select name from events where id = '00000000-0000-4000-8000-0000000000e1'),
  'Acme Spring',
  'customer update is silently filtered by RLS'
);

-- (6) Internal user can update events
select _rls_test_as('00000000-0000-4000-8000-000000000011');
update events set name = 'Acme Spring 2' where id = '00000000-0000-4000-8000-0000000000e1';
select is(
  (select name from events where id = '00000000-0000-4000-8000-0000000000e1'),
  'Acme Spring 2',
  'internal user update is allowed'
);

select * from finish();
rollback;
