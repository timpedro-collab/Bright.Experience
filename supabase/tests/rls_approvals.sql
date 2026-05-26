-- =====================================================================
-- RLS: approvals
--
-- Verifies:
--   1. customers see customer_visible approvals on their own events
--   2. customers can update their own approvals (approve/reject)
--   3. internal users see and manage all approvals
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into approvals (id, event_id, title, approval_type, status, customer_visible)
values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000e1', 'Hero approval (visible)',  'creative', 'pending', true),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000e1', 'Internal-only approval',   'internal', 'pending', false),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000e2', 'Other-account approval',   'creative', 'pending', true)
on conflict (id) do nothing;

select plan(4);

-- (1) Acme customer sees only their own visible approval
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from approvals),
  array['00000000-0000-4000-8000-0000000000b1'::uuid],
  'customer sees only their own visible approval'
);

-- (2) Customer can update their approval
update approvals
  set status = 'approved'
  where id = '00000000-0000-4000-8000-0000000000b1';
select is(
  (select status::text from approvals where id = '00000000-0000-4000-8000-0000000000b1'),
  'approved',
  'customer can update their own approval'
);

-- (3) Customer from other account cannot see Acme approval
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from approvals where id = '00000000-0000-4000-8000-0000000000b1'),
  0,
  'cross-account customer cannot see foreign approval'
);

-- (4) Internal user sees all three approvals
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from approvals),
  3,
  'internal user sees every approval'
);

select * from finish();
rollback;
