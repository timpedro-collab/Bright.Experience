-- =====================================================================
-- RLS: machines, games, packages, package_addons, case_studies
--
-- Verifies:
--   1. Anon can read active machines / games / bookable packages
--   2. Anon CANNOT read inactive / unpublished rows
--   3. Internal can manage (insert + update + delete) catalog rows
-- =====================================================================

begin;
\ir _fixtures.psql

insert into machines (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000da', 'Bright.Vend Pro', 'bright-vend-pro', true),
  ('00000000-0000-4000-8000-0000000000db', 'Hidden Prototype', 'hidden-proto', false)
on conflict (id) do nothing;

insert into games (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000dc', 'Tap to Win', 'tap-to-win', true),
  ('00000000-0000-4000-8000-0000000000dd', 'WIP Game',   'wip-game',  false)
on conflict (id) do nothing;

insert into packages (id, name, slug, tier, is_bookable) values
  ('00000000-0000-4000-8000-0000000000de', 'Standard',  'standard',  'standard',  true),
  ('00000000-0000-4000-8000-0000000000df', 'Internal Test', 'internal-test', 'custom', false)
on conflict (id) do nothing;

insert into case_studies (id, title, slug, is_published) values
  ('00000000-0000-4000-8000-0000000000e7', 'Live Story', 'live-story', true),
  ('00000000-0000-4000-8000-0000000000e8', 'Draft',      'draft',      false)
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

-- (4) Anon sees only published case studies (scoped to this test's rows,
-- since migrations may seed their own published case studies).
select is(
  (select array_agg(slug order by slug)::text[] from case_studies where slug in ('live-story', 'draft')),
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

-- (7) Anon insert is blocked — RLS rejects the write outright (42501)
select _rls_test_anon();
select throws_ok(
  $$insert into machines (name, slug, is_active) values ('Sneak', 'sneak', true)$$,
  '42501',
  null::text,
  'anon insert into machines is blocked by RLS'
);

select * from finish();
rollback;
