-- =====================================================================
-- RLS: approvals
--
-- Verifies:
--   1. customers see customer_visible approvals on their own events
--   2. customers can update their own approvals (approve/reject)
--   3. internal users see and manage all approvals
--   4. only internal users can OPEN an approval (requestApproval)
-- =====================================================================

begin;
\ir _fixtures.psql

insert into approvals (id, event_id, title, approval_type, status, customer_visible)
values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000e1', 'Hero approval (visible)',  'creative', 'pending', true),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000e1', 'Internal-only approval',   'internal', 'pending', false),
  ('00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000e2', 'Other-account approval',   'creative', 'pending', true)
on conflict (id) do nothing;

select plan(6);

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

-- (4) Internal user sees all three approvals. Scoped to the fixture rows so the
-- assertion holds on a database that also carries demo seed data.
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from approvals where event_id in (
    '00000000-0000-4000-8000-0000000000e1',
    '00000000-0000-4000-8000-0000000000e2'
  )),
  3,
  'internal user sees every approval'
);

-- (5) Internal user can open an approval. This is the write behind
-- `requestApproval` — the only path that inserts into this table.
insert into approvals (id, event_id, title, approval_type, status, requested_by, customer_visible)
values (
  '00000000-0000-4000-8000-0000000000b4',
  '00000000-0000-4000-8000-0000000000e1',
  'Wrap proof',
  'wrap',
  'pending',
  '00000000-0000-4000-8000-000000000011',
  true
);
select is(
  (select title from approvals where id = '00000000-0000-4000-8000-0000000000b4'),
  'Wrap proof',
  'internal user can open an approval'
);

-- (6) A customer cannot open one against their own event. Sign-off is
-- requested BY the delivery team, never self-served.
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select throws_ok(
  $$insert into approvals (event_id, title, approval_type, status, customer_visible)
    values ('00000000-0000-4000-8000-0000000000e1', 'Self-served', 'wrap', 'pending', true)$$,
  '42501',
  null,
  'customer cannot open an approval'
);

select * from finish();
rollback;
