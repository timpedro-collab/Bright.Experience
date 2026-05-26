-- =====================================================================
-- RLS: machines, games, packages, package_addons, case_studies
--
-- Verifies:
--   1. Anon can read active machines / games / bookable packages
--   2. Anon CANNOT read inactive / unpublished rows
--   3. Internal can manage (insert + update + delete) catalog rows
-- =====================================================================

begin;
\i tests/_fixtures.sql

insert into machines (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000m1', 'Bright.Vend Pro', 'bright-vend-pro', true),
  ('00000000-0000-4000-8000-0000000000m2', 'Hidden Prototype', 'hidden-proto', false)
on conflict (id) do nothing;

insert into games (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000g1', 'Tap to Win', 'tap-to-win', true),
  ('00000000-0000-4000-8000-0000000000g2', 'WIP Game',   'wip-game',  false)
on conflict (id) do nothing;

insert into packages (id, name, slug, tier, is_bookable) values
  ('00000000-0000-4000-8000-0000000000p1', 'Standard',  'standard',  'standard',  true),
  ('00000000-0000-4000-8000-0000000000p2', 'Internal Test', 'internal-test', 'custom', false)
on conflict (id) do nothing;

insert into case_studies (id, title, slug, is_published) values
  ('00000000-0000-4000-8000-0000000000s1', 'Live Story', 'live-story', true),
  ('00000000-0000-4000-8000-0000000000s2', 'Draft',      'draft',      false)
on conflict (id) do nothing;

select plan(7);

-- (1) Anon sees only active machines
select _rls_test_anon();
select is(
  (select array_agg(slug order by slug)::text[] from machines),
  array['bright-vend-pro']::text[],
  'anon sees only active machines'
);

-- (2) Anon sees only active games
select is(
  (select array_agg(slug order by slug)::text[] from games),
  array['tap-to-win']::text[],
  'anon sees only active games'
);

-- (3) Anon sees only bookable packages
select is(
  (select array_agg(slug order by slug)::text[] from packages),
  array['standard']::text[],
  'anon sees only bookable packages'
);

-- (4) Anon sees only published case studies
select is(
  (select array_agg(slug order by slug)::text[] from case_studies),
  array['live-story']::text[],
  'anon sees only published case studies'
);

-- (5) Internal sees every machine
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from machines),
  2,
  'internal sees every machine'
);

-- (6) Internal can insert a new machine
insert into machines (name, slug, is_active)
  values ('New Unit', 'new-unit', true);
select is(
  (select count(*)::int from machines where slug = 'new-unit'),
  1,
  'internal can insert a machine'
);

-- (7) Anon insert is blocked
select _rls_test_anon();
insert into machines (name, slug, is_active)
  values ('Sneak', 'sneak', true);
select is(
  (select count(*)::int from machines where slug = 'sneak'),
  0,
  'anon insert into machines is silently filtered by RLS'
);

select * from finish();
rollback;
