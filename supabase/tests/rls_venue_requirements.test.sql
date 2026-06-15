-- =====================================================================
-- RLS: venue_requirements
--
-- Verifies:
--   1. Customer sees their own event's venue requirements
--   2. Customer cannot see another account's venue requirements
--   3. Internal user sees all venue requirements
--   4. Internal user can insert a venue requirement
--   5. Customer cannot insert a venue requirement (internal-managed)
--   6. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into venue_requirements (id, event_id, requirement_type, description) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-0000000000e1', 'power_spec', 'Acme power spec'),
  ('00000000-0000-4000-8000-000000000702', '00000000-0000-4000-8000-0000000000e2', 'power_spec', 'OtherCo power spec')
on conflict (id) do nothing;

select plan(6);

-- (1) Acme customer sees own-event requirement
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from venue_requirements where event_id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees own-event venue requirement'
);

-- (2) Acme customer cannot see OtherCo requirement
select is(
  (select count(*)::int from venue_requirements where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account venue requirement'
);

-- (3) Internal user sees all
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from venue_requirements),
  '>=', 2,
  'internal user sees all venue requirements'
);

-- (4) Internal user can insert
insert into venue_requirements (event_id, requirement_type, description)
values ('00000000-0000-4000-8000-0000000000e1', 'wifi', 'Wifi requirement');
select cmp_ok(
  (select count(*)::int from venue_requirements),
  '>=', 3,
  'internal user can insert venue requirement'
);

-- (5) Customer cannot insert a venue requirement
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select throws_ok(
  $$insert into venue_requirements (event_id, requirement_type, description)
    values ('00000000-0000-4000-8000-0000000000e1', 'parking', 'Customer parking')$$,
  '42501',
  null,
  'customer cannot insert a venue requirement'
);

-- (6) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from venue_requirements),
  0,
  'anon sees no venue requirements'
);

select * from finish();
rollback;
