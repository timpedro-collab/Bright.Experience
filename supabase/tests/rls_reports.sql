-- =====================================================================
-- RLS: event_reports, benchmarks
--
-- Verifies (post 20260713000000_rls_qa_reports_hardening):
--   1. Customer sees only PUBLISHED event_reports for their own events
--   2. Customer CANNOT see their own unpublished (draft) reports
--   3. Customer CANNOT see other accounts' reports
--   4. Public (anon) can see published reports via share_token
--   5. Internal sees every report (drafts included)
--   6. Benchmarks are world-readable (acquisition funnel uses them)
-- =====================================================================

begin;
\ir _fixtures.psql

insert into event_reports (id, event_id, report_type, title, is_published, share_token) values
  ('00000000-0000-4000-8000-0000000000da', '00000000-0000-4000-8000-0000000000e1', 'post_event', 'Acme report (private)', false, null),
  ('00000000-0000-4000-8000-0000000000db', '00000000-0000-4000-8000-0000000000e1', 'post_event', 'Acme report (public)',  true,  'share-acme'),
  ('00000000-0000-4000-8000-0000000000dc', '00000000-0000-4000-8000-0000000000e2', 'post_event', 'Other report',          false, null)
on conflict (id) do nothing;

insert into benchmarks (id, event_type, metric_name, avg_value, sample_size) values
  ('00000000-0000-4000-8000-0000000000dd', 'activation', 'plays_per_day', 250, 24)
on conflict (id) do nothing;

select plan(6);

-- (1) Acme customer sees only their published report
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from event_reports where event_id = '00000000-0000-4000-8000-0000000000e1'),
  array['00000000-0000-4000-8000-0000000000db'::uuid],
  'customer sees only their published event reports'
);

-- (2) Acme customer cannot see their own draft report
select is(
  (select count(*)::int from event_reports where id = '00000000-0000-4000-8000-0000000000da'),
  0,
  'customer cannot see their own unpublished report'
);

-- (3) Acme customer cannot see Other's reports
select is(
  (select count(*)::int from event_reports where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account reports'
);

-- (4) Anon can see the published shared report. Every assertion from here down
-- is scoped to the fixture rows so it holds alongside demo seed data.
select _rls_test_anon();
select is(
  (select array_agg(id order by id)::uuid[] from event_reports where event_id in (
    '00000000-0000-4000-8000-0000000000e1',
    '00000000-0000-4000-8000-0000000000e2'
  )),
  array['00000000-0000-4000-8000-0000000000db'::uuid],
  'anon sees only published shared reports'
);

-- (5) Internal sees all reports
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from event_reports where event_id in (
    '00000000-0000-4000-8000-0000000000e1',
    '00000000-0000-4000-8000-0000000000e2'
  )),
  3,
  'internal sees every report'
);

-- (6) Anon reads benchmarks
select _rls_test_anon();
select is(
  (select count(*)::int from benchmarks where id = '00000000-0000-4000-8000-0000000000dd'),
  1,
  'anon reads benchmarks for the acquisition funnel'
);

select * from finish();
rollback;
