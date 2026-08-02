-- =====================================================================
-- RLS: assets
--
-- Verifies:
--   1. customers only see assets on their own events
--   2. customers only see assets marked customer_visible
--   3. internal users see every asset
-- =====================================================================

begin;
\ir _fixtures.psql

insert into assets (id, event_id, name, asset_type, status, customer_visible)
values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000e1', 'Hero (visible)',   'image', 'uploaded',  true),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000e1', 'Internal-only',    'image', 'uploaded',  false),
  ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000e2', 'Other-account',    'image', 'uploaded',  true)
on conflict (id) do nothing;

select plan(3);

-- Acme customer
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from assets where id in (
    '00000000-0000-4000-8000-0000000000d1',
    '00000000-0000-4000-8000-0000000000d2',
    '00000000-0000-4000-8000-0000000000d3')),
  array['00000000-0000-4000-8000-0000000000d1'::uuid],
  'customer sees only their own visible asset'
);

-- Other customer cannot see Acme assets
select _rls_test_as('00000000-0000-4000-8000-000000000021');
select is(
  (select count(*)::int from assets where event_id = '00000000-0000-4000-8000-0000000000e1'),
  0,
  'other-account customer cannot see Acme assets'
);

-- Internal user sees all. Scoped to the fixture rows: `supabase test db`
-- runs against a seeded database, so an unqualified count is not stable.
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from assets where id in (
    '00000000-0000-4000-8000-0000000000d1',
    '00000000-0000-4000-8000-0000000000d2',
    '00000000-0000-4000-8000-0000000000d3')),
  3,
  'internal user sees every asset'
);

select * from finish();
rollback;
