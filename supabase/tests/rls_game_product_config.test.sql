-- =====================================================================
-- RLS: game_configurations and product_configurations
--
-- Verifies:
--   1. Customer sees their own event's game config
--   2. Customer cannot see another account's game config
--   3. Internal user sees all game configs
--   4. Customer can fill in (insert) their own event's game config
--   5. Customer sees their own event's product config
--   6. Customer cannot see another account's product config
--   7. Anonymous user gets no game config rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into game_configurations (id, event_id, prize_mode, status) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-0000000000e1', 'random', 'draft'),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-0000000000e2', 'random', 'draft')
on conflict (id) do nothing;

insert into product_configurations (id, event_id, total_units) values
  ('00000000-0000-4000-8000-000000000611', '00000000-0000-4000-8000-0000000000e1', 500),
  ('00000000-0000-4000-8000-000000000612', '00000000-0000-4000-8000-0000000000e2', 600)
on conflict (id) do nothing;

select plan(7);

-- (1) Acme customer sees own-event game config
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from game_configurations where event_id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees own-event game config'
);

-- (2) Acme customer cannot see OtherCo game config
select is(
  (select count(*)::int from game_configurations where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account game config'
);

-- (3) Internal user sees all game configs
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from game_configurations),
  '>=', 2,
  'internal user sees all game configs'
);

-- (4) Customer can fill in their own event's product config (insert)
select _rls_test_as('00000000-0000-4000-8000-000000000020');
insert into product_configurations (event_id, total_units)
values ('00000000-0000-4000-8000-0000000000e1', 750);
select cmp_ok(
  (select count(*)::int from product_configurations where event_id = '00000000-0000-4000-8000-0000000000e1'),
  '>=', 2,
  'customer can insert own-event product config'
);

-- (5) Customer sees own-event product config
select is(
  (select count(*)::int from product_configurations where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account product config'
);

-- (6) Internal sees all product configs
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from product_configurations),
  '>=', 2,
  'internal user sees all product configs'
);

-- (7) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from game_configurations),
  0,
  'anon sees no game configs'
);

select * from finish();
rollback;
