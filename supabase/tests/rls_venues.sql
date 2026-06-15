-- =====================================================================
-- RLS: venues, placements, sponsorship_slots, venue_packages
--
-- Verifies:
--   1. Internal sees all venues
--   2. Partner users see only venues belonging to their partner
--   3. Placements + slots inherit the same scoping
--   4. Partner admins can create new venues under their partner
-- =====================================================================

begin;
\ir _fixtures.psql

insert into placements (id, venue_id, start_date, status) values
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000c1', '2026-08-01', 'planned'),
  ('00000000-0000-4000-8000-0000000000c4', '00000000-0000-4000-8000-0000000000c2', '2026-09-01', 'planned')
on conflict (id) do nothing;

insert into sponsorship_slots (id, placement_id, start_date, end_date, status) values
  ('00000000-0000-4000-8000-0000000000c5', '00000000-0000-4000-8000-0000000000c3', '2026-08-01', '2026-08-02', 'available'),
  ('00000000-0000-4000-8000-0000000000c6', '00000000-0000-4000-8000-0000000000c4', '2026-09-01', '2026-09-02', 'available')
on conflict (id) do nothing;

select plan(5);

-- (1) Internal sees both venues
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from venues),
  2,
  'internal sees every venue'
);

-- (2) Northern admin sees only their venue
select _rls_test_as('00000000-0000-4000-8000-000000000030');
select is(
  (select array_agg(slug order by slug)::text[] from venues),
  array['northern-hub']::text[],
  'partner sees only their own venues'
);

-- (3) Northern admin sees only their placements
select is(
  (select array_agg(id order by id)::uuid[] from placements),
  array['00000000-0000-4000-8000-0000000000c3'::uuid],
  'partner sees only their own placements'
);

-- (4) Northern admin sees only their sponsorship slots
select is(
  (select array_agg(id order by id)::uuid[] from sponsorship_slots),
  array['00000000-0000-4000-8000-0000000000c5'::uuid],
  'partner sees only their own sponsorship slots'
);

-- (5) Northern admin can create a new venue under their partner
insert into venues (partner_id, name, slug)
  values ('00000000-0000-4000-8000-0000000000b1', 'Pop-up North', 'pop-up-north');
select is(
  (select count(*)::int from venues where slug = 'pop-up-north'),
  1,
  'partner admin can insert a venue under their partner'
);

select * from finish();
rollback;
