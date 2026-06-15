-- =====================================================================
-- RLS: scheduled_exports (internal-only)
--
-- Verifies:
--   1. Internal user sees scheduled exports
--   2. Internal user can insert a scheduled export
--   3. Customer sees no scheduled exports (internal-only)
--   4. Customer cannot insert a scheduled export
--   5. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into scheduled_exports (id, event_id, frequency, format, include_fields, recipients) values
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-0000000000e1', 'daily', 'csv', '{leads}', '{}'),
  ('00000000-0000-4000-8000-000000000902', '00000000-0000-4000-8000-0000000000e2', 'daily', 'csv', '{leads}', '{}')
on conflict (id) do nothing;

select plan(5);

-- (1) Internal user sees scheduled exports
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from scheduled_exports),
  '>=', 2,
  'internal user sees scheduled exports'
);

-- (2) Internal user can insert
insert into scheduled_exports (event_id, frequency, format, include_fields, recipients)
values ('00000000-0000-4000-8000-0000000000e1', 'weekly', 'excel', '{leads,metrics}', '{}');
select cmp_ok(
  (select count(*)::int from scheduled_exports),
  '>=', 3,
  'internal user can insert scheduled export'
);

-- (3) Customer sees no scheduled exports
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from scheduled_exports),
  0,
  'customer sees no scheduled exports'
);

-- (4) Customer cannot insert a scheduled export
select throws_ok(
  $$insert into scheduled_exports (event_id, frequency, format, include_fields, recipients)
    values ('00000000-0000-4000-8000-0000000000e1', 'daily', 'csv', '{leads}', '{}')$$,
  '42501',
  null,
  'customer cannot insert a scheduled export'
);

-- (5) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from scheduled_exports),
  0,
  'anon sees no scheduled exports'
);

select * from finish();
rollback;
