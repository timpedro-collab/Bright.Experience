-- =====================================================================
-- RLS: studio_requests
--
-- Verifies:
--   1. Customer sees customer-visible studio requests for own event
--   2. Customer cannot see another account's studio requests
--   3. Internal user sees all studio requests
--   4. Internal user can insert studio requests
--   5. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into studio_requests (id, event_id, service_type, title, status, customer_visible) values
  ('00000000-0000-4000-8000-000000000f01', '00000000-0000-4000-8000-0000000000e1', 'design',    'Acme wrap design',  'draft', true),
  ('00000000-0000-4000-8000-000000000f02', '00000000-0000-4000-8000-0000000000e1', 'animation', 'Acme game skin',    'draft', false),
  ('00000000-0000-4000-8000-000000000f03', '00000000-0000-4000-8000-0000000000e2', 'design',    'Other wrap design', 'draft', true)
on conflict (id) do nothing;

select plan(6);

-- (1) Acme customer sees their own customer-visible request
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from studio_requests where id = '00000000-0000-4000-8000-000000000f01'),
  1,
  'customer sees own-event customer-visible studio request'
);

-- (2) Acme customer cannot see non-visible request
select is(
  (select count(*)::int from studio_requests where id = '00000000-0000-4000-8000-000000000f02'),
  0,
  'customer cannot see non-customer-visible studio request'
);

-- (3) Acme customer cannot see OtherCo's request
select is(
  (select count(*)::int from studio_requests where id = '00000000-0000-4000-8000-000000000f03'),
  0,
  'customer cannot see other-account studio request'
);

-- (4) Internal user sees all studio requests
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from studio_requests),
  '>=', 3,
  'internal user sees all studio requests'
);

-- (5) Internal user can insert
insert into studio_requests (event_id, service_type, title, status)
values ('00000000-0000-4000-8000-0000000000e1', 'animation', 'New game skin', 'draft');
select cmp_ok(
  (select count(*)::int from studio_requests),
  '>=', 4,
  'internal user can insert studio requests'
);

-- (6) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from studio_requests),
  0,
  'anon sees no studio requests'
);

select * from finish();
rollback;
