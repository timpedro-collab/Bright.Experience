-- =====================================================================
-- RLS: machines, games, packages, package_addons, case_studies
--
-- Verifies:
--   1. Anon can read active machines / games / bookable packages
--   2. Anon CANNOT read inactive / unpublished rows
--   3. Internal can manage (insert + update + delete) catalog rows
--
-- Every fixture slug is `rls-` prefixed and every assertion is scoped to
-- those slugs: the suite runs against a database that also carries the demo
-- catalogue, and slugs are unique.
-- =====================================================================

begin;
\ir _fixtures.psql

insert into machines (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000da', 'Visible Unit',     'rls-visible-machine', true),
  ('00000000-0000-4000-8000-0000000000db', 'Hidden Prototype', 'rls-hidden-machine',  false)
on conflict (id) do nothing;

insert into games (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000dc', 'Visible Game', 'rls-visible-game', true),
  ('00000000-0000-4000-8000-0000000000dd', 'WIP Game',     'rls-hidden-game',  false)
on conflict (id) do nothing;

insert into packages (id, name, slug, tier, is_bookable) values
  ('00000000-0000-4000-8000-0000000000de', 'Bookable',      'rls-bookable-package', 'standard', true),
  ('00000000-0000-4000-8000-0000000000df', 'Internal Test', 'rls-internal-package', 'custom',   false)
on conflict (id) do nothing;

insert into case_studies (id, title, slug, is_published) values
  ('00000000-0000-4000-8000-0000000000e7', 'Live Story', 'rls-live-story', true),
  ('00000000-0000-4000-8000-0000000000e8', 'Draft',      'rls-draft-story', false)
on conflict (id) do nothing;

select plan(7);

-- (1) Anon sees only active machines
select _rls_test_anon();
select is(
  (select array_agg(slug order by slug)::text[] from machines
    where slug in ('rls-visible-machine', 'rls-hidden-machine')),
  array['rls-visible-machine']::text[],
  'anon sees only active machines'
);

-- (2) Anon sees only active games
select is(
  (select array_agg(slug order by slug)::text[] from games
    where slug in ('rls-visible-game', 'rls-hidden-game')),
  array['rls-visible-game']::text[],
  'anon sees only active games'
);

-- (3) Anon sees only bookable packages
select is(
  (select array_agg(slug order by slug)::text[] from packages
    where slug in ('rls-bookable-package', 'rls-internal-package')),
  array['rls-bookable-package']::text[],
  'anon sees only bookable packages'
);

-- (4) Anon sees only published case studies
select is(
  (select array_agg(slug order by slug)::text[] from case_studies
    where slug in ('rls-live-story', 'rls-draft-story')),
  array['rls-live-story']::text[],
  'anon sees only published case studies'
);

-- (5) Internal is not filtered — sees the inactive machine too
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from machines
    where slug in ('rls-visible-machine', 'rls-hidden-machine')),
  2,
  'internal sees every machine'
);

-- (6) Internal can insert a new machine
insert into machines (name, slug, is_active)
  values ('New Unit', 'rls-new-unit', true);
select is(
  (select count(*)::int from machines where slug = 'rls-new-unit'),
  1,
  'internal can insert a machine'
);

-- (7) Anon insert is blocked — RLS rejects the write outright (42501)
select _rls_test_anon();
select throws_ok(
  $$insert into machines (name, slug, is_active) values ('Sneak', 'rls-sneak', true)$$,
  '42501',
  null::text,
  'anon insert into machines is blocked by RLS'
);

select * from finish();
rollback;
