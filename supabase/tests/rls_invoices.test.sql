-- =====================================================================
-- RLS: invoices
--
-- Verifies:
--   1. Customer sees their own account's invoices (read-only)
--   2. Customer cannot see another account's invoices
--   3. Internal user sees all invoices
--   4. Customer cannot insert an invoice (finance is internal-only)
--   5. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into invoices (id, event_id, account_id, invoice_number, amount, status) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', 'BB-00001', 1000.00, 'issued'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a2', 'BB-00002', 2000.00, 'issued')
on conflict (id) do nothing;

select plan(5);

-- (1) Acme customer sees their own invoice
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from invoices where account_id = '00000000-0000-4000-8000-0000000000a1'),
  1,
  'customer sees own-account invoice'
);

-- (2) Acme customer cannot see OtherCo invoice
select is(
  (select count(*)::int from invoices where account_id = '00000000-0000-4000-8000-0000000000a2'),
  0,
  'customer cannot see other-account invoice'
);

-- (3) Internal user sees all invoices
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from invoices),
  '>=', 2,
  'internal user sees all invoices'
);

-- (4) Customer cannot insert an invoice
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select throws_ok(
  $$insert into invoices (event_id, account_id, invoice_number, amount, status)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a1', 'BB-09999', 50.00, 'draft')$$,
  '42501',
  null,
  'customer cannot insert an invoice'
);

-- (5) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from invoices),
  0,
  'anon sees no invoices'
);

select * from finish();
rollback;
