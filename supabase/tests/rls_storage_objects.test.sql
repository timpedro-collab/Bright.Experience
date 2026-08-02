-- =====================================================================
-- RLS: storage.objects (post 20260728000001_storage_tenant_scoping)
--
-- The four private buckets used to grant SELECT to any authenticated user,
-- so one brand could download another brand's briefings, creative, reports
-- and lead exports. Reads are now scoped by the owning event, derived from
-- the first segment of the object path.
--
-- Verifies:
--   1. Customer reads their own event's asset
--   2. Customer cannot read another account's asset
--   3. Internal staff read every asset
--   4. Organizer reads assets for a show they run
--   5. Organizer cannot read an unrelated account's asset
--   6. Anonymous callers read nothing
--   7. A path with no event id resolves to no event (fail closed)
--   8. Customer cannot upload into another account's event path
--   9. The same scoping applies to briefings, reports and studio-deliverables
-- =====================================================================

begin;
\ir _fixtures.psql

-- Give the Kings Cross partner a show so the organizer branch is exercised.
insert into events (id, account_id, name, event_type, event_date_start, created_by, organizer_partner_id)
values (
  '00000000-0000-4000-8000-0000000000e3',
  '00000000-0000-4000-8000-0000000000a1',
  'Kings Cross Expo',
  'activation',
  '2026-09-01',
  '00000000-0000-4000-8000-000000000011',
  '00000000-0000-4000-8000-0000000000b2'
)
on conflict (id) do update set organizer_partner_id = excluded.organizer_partner_id;

-- Objects are inserted as the table owner (RLS does not apply yet), then read
-- back under each persona once the role is switched to `authenticated`.
insert into storage.objects (id, bucket_id, name) values
  ('00000000-0000-4000-8000-000000000701', 'event-assets',
   '00000000-0000-4000-8000-0000000000e1/asset/a1/1-acme-hero.png'),
  ('00000000-0000-4000-8000-000000000702', 'event-assets',
   '00000000-0000-4000-8000-0000000000e2/asset/a2/1-other-hero.png'),
  ('00000000-0000-4000-8000-000000000703', 'event-assets',
   '00000000-0000-4000-8000-0000000000e3/asset/a3/1-expo-hero.png'),
  ('00000000-0000-4000-8000-000000000704', 'event-assets',
   'legacy/no-event-prefix.png'),
  ('00000000-0000-4000-8000-000000000705', 'briefings',
   '00000000-0000-4000-8000-0000000000e2/briefing/b2/1-other-brief.pdf'),
  ('00000000-0000-4000-8000-000000000706', 'reports',
   '00000000-0000-4000-8000-0000000000e2/exports/leads.csv'),
  ('00000000-0000-4000-8000-000000000707', 'studio-deliverables',
   '00000000-0000-4000-8000-0000000000e2/deliverable/d2/1-cutdown.mp4')
on conflict (id) do nothing;

select plan(9);

-- (1) Acme customer reads their own event's asset
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from storage.objects
    where id = '00000000-0000-4000-8000-000000000701'),
  1,
  'customer reads their own event asset'
);

-- (2) ...and not OtherCo's
select is(
  (select count(*)::int from storage.objects
    where id = '00000000-0000-4000-8000-000000000702'),
  0,
  'customer cannot read another account object'
);

-- (3) Internal staff read everything in scope
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from storage.objects where id in (
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000000703'
  )),
  3,
  'internal staff read every event object'
);

-- (4) Kings Cross organizer reads the show they run
select _rls_test_as('00000000-0000-4000-8000-000000000032');
select is(
  (select count(*)::int from storage.objects
    where id = '00000000-0000-4000-8000-000000000703'),
  1,
  'organizer reads objects for their own show'
);

-- (5) ...but not an unrelated account's files
select is(
  (select count(*)::int from storage.objects
    where id = '00000000-0000-4000-8000-000000000702'),
  0,
  'organizer cannot read an unrelated account object'
);

-- (6) Anon reads nothing from the private buckets
select _rls_test_anon();
select is(
  (select count(*)::int from storage.objects
    where bucket_id in ('event-assets', 'briefings', 'reports', 'studio-deliverables')),
  0,
  'anon reads nothing from the private buckets'
);

-- (7) A legacy path with no leading event id fails closed for everyone
select _rls_test_as('00000000-0000-4000-8000-000000000010');
select is(
  (select count(*)::int from storage.objects
    where id = '00000000-0000-4000-8000-000000000704'),
  0,
  'a path without an event id is unreadable'
);

-- (8) Writes are scoped the same way as reads
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('event-assets', '00000000-0000-4000-8000-0000000000e2/asset/x/1-stolen.png')$$,
  '42501',
  null,
  'customer cannot upload into another account event path'
);

-- (9) briefings / reports / studio-deliverables share the predicate
select is(
  (select count(*)::int from storage.objects where id in (
    '00000000-0000-4000-8000-000000000705',
    '00000000-0000-4000-8000-000000000706',
    '00000000-0000-4000-8000-000000000707'
  )),
  0,
  'briefings, reports and deliverables are scoped by owning event too'
);

select * from finish();
rollback;
