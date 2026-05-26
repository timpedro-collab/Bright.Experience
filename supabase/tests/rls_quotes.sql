-- =====================================================================
-- RLS: quotes, quote_line_items
--
-- Verifies:
--   1. Public can submit a quote (anon insert)
--   2. Customer sees only quotes scoped to their account_id
--   3. Customer cannot see another account's quotes
--   4. Internal sees every quote
--   5. Line items inherit the same scoping
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into quotes (id, account_id, track, status, contact_name, contact_email) values
  ('00000000-0000-4000-8000-0000000000q1', '00000000-0000-4000-8000-0000000000a1', 'book_now', 'submitted', 'Casey', 'casey@acme.test'),
  ('00000000-0000-4000-8000-0000000000q2', '00000000-0000-4000-8000-0000000000a2', 'proposal', 'submitted', 'Sam',   'sam@other.test')
on conflict (id) do nothing;

insert into quote_line_items (id, quote_id, label, amount, sort_order) values
  ('00000000-0000-4000-8000-0000000000q3', '00000000-0000-4000-8000-0000000000q1', 'Hardware',  100000, 0),
  ('00000000-0000-4000-8000-0000000000q4', '00000000-0000-4000-8000-0000000000q2', 'Bespoke',   250000, 0)
on conflict (id) do nothing;

select plan(5);

-- (1) Anon can submit a new quote
select _rls_test_anon();
insert into quotes (track, status, contact_name, contact_email)
  values ('proposal', 'submitted', 'Anon', 'anon@example.com');
select is(
  (select count(*)::int from quotes where contact_email = 'anon@example.com'),
  1,
  'anon can submit a quote'
);

-- (2) Acme customer sees only their quote
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from quotes where account_id is not null),
  array['00000000-0000-4000-8000-0000000000q1'::uuid],
  'customer sees only own account quotes'
);

-- (3) Other customer cannot see Acme quote
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from quotes where id = '00000000-0000-4000-8000-0000000000q1'),
  0,
  'other-account customer cannot see Acme quote'
);

-- (4) Internal sees every quote
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from quotes),
  '>=', 2,
  'internal sees every quote'
);

-- (5) Customer sees only their own line items
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from quote_line_items),
  array['00000000-0000-4000-8000-0000000000q3'::uuid],
  'customer sees only their own line items'
);

select * from finish();
rollback;
