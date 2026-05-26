-- =====================================================================
-- RLS: event_reports, benchmarks
--
-- Verifies:
--   1. Customer sees only event_reports for their own events
--   2. Customer CANNOT see other accounts' reports
--   3. Public (anon) can see published reports via share_token
--   4. Internal sees every report
--   5. Benchmarks are world-readable (acquisition funnel uses them)
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into event_reports (id, event_id, report_type, title, is_published, share_token) values
  ('00000000-0000-4000-8000-0000000000r1', '00000000-0000-4000-8000-0000000000e1', 'post_event', 'Acme report (private)', false, null),
  ('00000000-0000-4000-8000-0000000000r2', '00000000-0000-4000-8000-0000000000e1', 'post_event', 'Acme report (public)',  true,  'share-acme'),
  ('00000000-0000-4000-8000-0000000000r3', '00000000-0000-4000-8000-0000000000e2', 'post_event', 'Other report',          false, null)
on conflict (id) do nothing;

insert into benchmarks (id, event_type, metric_name, avg_value, sample_size) values
  ('00000000-0000-4000-8000-0000000000bm', 'activation', 'plays_per_day', 250, 24)
on conflict (id) do nothing;

select plan(5);

-- (1) Acme customer sees own reports (both)
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from event_reports where event_id = '00000000-0000-4000-8000-0000000000e1'),
  2,
  'customer sees own event reports'
);

-- (2) Acme customer cannot see Other's reports
select is(
  (select count(*)::int from event_reports where event_id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'customer cannot see other-account reports'
);

-- (3) Anon can see the published shared report
select _rls_test_anon();
select is(
  (select array_agg(id order by id)::uuid[] from event_reports),
  array['00000000-0000-4000-8000-0000000000r2'::uuid],
  'anon sees only published shared reports'
);

-- (4) Internal sees all reports
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from event_reports),
  3,
  'internal sees every report'
);

-- (5) Anon reads benchmarks
select _rls_test_anon();
select is(
  (select count(*)::int from benchmarks),
  1,
  'anon reads benchmarks for the acquisition funnel'
);

select * from finish();
rollback;
