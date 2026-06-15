-- =====================================================================
-- RLS: compliance_documents (shared document exchange)
--
-- Verifies:
--   1. Customer sees their own event's compliance documents
--   2. Customer cannot see another account's compliance documents
--   3. Internal user sees all compliance documents
--   4. Customer can add a document to their own event (shared exchange)
--   5. Anonymous user gets no rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into compliance_documents (id, event_id, document_type, title, status) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-0000000000e1', 'insurance_pl', 'Acme PL Insurance',   'required'),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-0000000000e2', 'insurance_pl', 'OtherCo PL Insurance', 'required')
on conflict (id) do nothing;

select plan(5);

-- (1) Acme customer sees their own event's document
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from compliance_documents where event_id = '00000000-0000-4000-8000-0000000000e1'),
  1,
  'customer sees own-event compliance document'
);

-- (2) Acme customer cannot see OtherCo's document
select is(
  (select count(*)::int from compliance_documents where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account compliance document'
);

-- (3) Internal user sees all
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from compliance_documents),
  '>=', 2,
  'internal user sees all compliance documents'
);

-- (4) Customer can add a document to their own event
select _rls_test_as('00000000-0000-4000-8000-000000000020');
insert into compliance_documents (event_id, document_type, title, status)
values ('00000000-0000-4000-8000-0000000000e1', 'dpa', 'Acme DPA upload', 'uploaded');
select cmp_ok(
  (select count(*)::int from compliance_documents where event_id = '00000000-0000-4000-8000-0000000000e1'),
  '>=', 2,
  'customer can add a document to own event'
);

-- (5) Anon gets no rows
select _rls_test_anon();
select is(
  (select count(*)::int from compliance_documents),
  0,
  'anon sees no compliance documents'
);

select * from finish();
rollback;
