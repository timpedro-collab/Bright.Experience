-- =====================================================================
-- RLS: tasks
--
-- Verifies:
--   1. customers see only customer_visible tasks on their own events
--   2. internal users see every task (including hidden ones)
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into tasks (id, event_id, title, task_type, category, customer_visible)
values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e1', 'Upload hero',     'customer_action', 'creative',  true),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000e1', 'Internal-only',   'internal_action', 'operations', false),
  ('00000000-0000-4000-8000-0000000000f3', '00000000-0000-4000-8000-0000000000e2', 'Other-account',   'customer_action', 'creative',  true)
on conflict (id) do nothing;

select plan(3);

-- Acme customer sees their own visible task only
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from tasks),
  array['00000000-0000-4000-8000-0000000000f1'::uuid],
  'customer sees only their own customer_visible task'
);

-- Other customer cannot see Acme tasks
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from tasks where event_id = '00000000-0000-4000-8000-0000000000e1'),
  0,
  'cross-account customer cannot see Acme tasks'
);

-- Internal user sees all three
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from tasks),
  3,
  'internal user sees every task'
);

select * from finish();
rollback;
