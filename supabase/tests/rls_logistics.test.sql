-- =====================================================================
-- RLS: logistics_entries
--
-- Verifies:
--   1. Customer sees logistics entries for their own event
--   2. Customer cannot see another account's logistics entries
--   3. Internal user sees all logistics entries
--   4. Internal user can insert logistics entries
--   5. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into logistics_entries (id, event_id, entry_type, title, status, sort_order) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-0000000000e1', 'delivery', 'Machine delivery to ExCeL', 'pending', 1),
  ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-0000000000e2', 'delivery', 'Machine delivery to O2',    'pending', 1)
on conflict (id) do nothing;

select plan(5);

-- (1) Acme customer sees only their logistics entry
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from logistics_entries where event_id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees own-event logistics entry'
);

-- (2) Acme customer cannot see OtherCo logistics
select is(
  (select count(*)::int from logistics_entries where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account logistics'
);

-- (3) Internal user sees all logistics entries
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from logistics_entries),
  '>=', 2,
  'internal user sees all logistics entries'
);

-- (4) Internal user can insert
insert into logistics_entries (event_id, entry_type, title, status, sort_order)
values ('00000000-0000-4000-8000-0000000000e1', 'collection', 'Machine collection from ExCeL', 'pending', 2);
select cmp_ok(
  (select count(*)::int from logistics_entries),
  '>=', 3,
  'internal user can insert logistics entries'
);

-- (5) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from logistics_entries),
  0,
  'anon sees no logistics entries'
);

select * from finish();
rollback;
