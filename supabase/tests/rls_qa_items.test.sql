-- =====================================================================
-- RLS: qa_items
--
-- The QA checklist is an internal readiness tool — customers never see
-- the QA section in-app, and after 20260713000000_rls_qa_reports_hardening
-- they cannot SELECT the rows at the DB level either.
--
-- Verifies:
--   1. Internal user sees all QA items
--   2. Customer sees NO QA items (even for their own event)
--   3. Anon sees no QA items
--   4. Internal can insert QA items
-- =====================================================================

begin;
\ir _fixtures.psql

insert into qa_items (id, event_id, category, title, status) values
  ('00000000-0000-4000-8000-0000000000aa', '00000000-0000-4000-8000-0000000000e1', 'machine', 'Screen calibration', 'pending'),
  ('00000000-0000-4000-8000-0000000000ab', '00000000-0000-4000-8000-0000000000e2', 'game',    'Prize map loaded',   'passed')
on conflict (id) do nothing;

select plan(4);

-- (1) Internal sees every QA item. Scoped to the fixture rows because
-- `supabase test db` runs against a seeded database.
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from qa_items where id in (
    '00000000-0000-4000-8000-0000000000aa',
    '00000000-0000-4000-8000-0000000000ab')),
  2,
  'internal sees every QA item'
);

-- (2) Customer sees none — not even for their own event
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from qa_items),
  0,
  'customer cannot select QA items, even for their own event'
);

-- (3) Anon sees none
select _rls_test_anon();
select is(
  (select count(*)::int from qa_items),
  0,
  'anon cannot select QA items'
);

-- (4) Internal can insert
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select lives_ok(
  $$insert into qa_items (event_id, category, title)
    values ('00000000-0000-4000-8000-0000000000e1', 'setup', 'Power check')$$,
  'internal can insert QA items'
);

select * from finish();
rollback;
