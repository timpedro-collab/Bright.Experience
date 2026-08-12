-- =====================================================================
-- RLS: partner_pricing_pages
--
-- Partner pricing pages are internal-only: customers must not see or
-- insert rows. Public reads go through the service role keyed by slug.
-- =====================================================================

begin;
\ir _fixtures.psql

-- Seed a row as the table owner (bypasses RLS, like the service role does).
insert into partner_pricing_pages (slug, partner_name, show_label, status, template) values
  ('00000000-0000-4000-8000-0000000000c1', 'Test Partner', 'Test Show', 'live', 'generic')
on conflict (slug) do nothing;

select plan(3);

-- (1) Customer cannot see partner pricing pages
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select count(*)::int from partner_pricing_pages),
  0,
  'customer cannot see any partner_pricing_pages rows'
);

-- (2) Customer cannot insert partner pricing pages
select throws_ok(
  $$insert into partner_pricing_pages (slug, partner_name, show_label) values ('spoof-slug', 'Spoof', 'Spoof Show')$$,
  '42501',
  'new row violates row-level security policy for table "partner_pricing_pages"',
  'customer cannot insert partner_pricing_pages rows'
);

-- (3) Internal user can read partner pricing pages
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from partner_pricing_pages),
  1,
  'internal user can read partner_pricing_pages'
);

select * from finish();
rollback;
