-- =====================================================================
-- RLS: messages
--
-- Verifies:
--   1. Customer sees non-internal messages for their own event
--   2. Customer cannot see another account's messages
--   3. Customer cannot see internal-only messages
--   4. Internal user sees all messages (including internal)
--   5. Internal user can insert messages
--   6. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into messages (id, event_id, sender_id, body, is_internal) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000011', 'Public message for Acme', false),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000011', 'Internal note about Acme', true),
  ('00000000-0000-4000-8000-000000000d03', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000011', 'Public message for OtherCo', false)
on conflict (id) do nothing;

select plan(7);

-- (1) Acme customer sees their own public message
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from messages where id = '00000000-0000-4000-8000-000000000d01'),
  1,
  'customer sees own-event public message'
);

-- (2) Acme customer cannot see internal messages
select is(
  (select count(*)::int from messages where id = '00000000-0000-4000-8000-000000000d02'),
  0,
  'customer cannot see internal messages'
);

-- (3) Acme customer cannot see OtherCo messages
select is(
  (select count(*)::int from messages where id = '00000000-0000-4000-8000-000000000d03'),
  0,
  'customer cannot see other-account messages'
);

-- (4) Total visible to Acme customer is 1
select is(
  (select count(*)::int from messages),
  1,
  'customer sees exactly 1 message total'
);

-- (5) Internal user sees all messages including internal
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from messages),
  '>=', 3,
  'internal user sees all messages'
);

-- (6) Internal user can insert a message
insert into messages (event_id, sender_id, body, is_internal)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000011', 'New internal msg', true);
select cmp_ok(
  (select count(*)::int from messages),
  '>=', 4,
  'internal user can insert messages'
);

-- (7) Anonymous user gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from messages),
  0,
  'anon sees no messages'
);

select * from finish();
rollback;
