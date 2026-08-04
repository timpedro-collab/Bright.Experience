-- =====================================================================
-- RLS: deal_registrations
--
-- Verifies:
--   1. partner users see only their own registrations
--   2. partner users can register a deal for their own partner
--   3. partner users cannot register a deal for another partner
--   4. partner users cannot change status (approval is internal-only)
--   5. internal users see every registration
-- =====================================================================

begin;
\ir _fixtures.psql

insert into deal_registrations (id, partner_id, sponsor_company, status)
values
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000b1', 'Registered by Northern', 'pending'),
  ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000b2', 'Registered by Kings',    'pending')
on conflict (id) do nothing;

select plan(5);

-- Northern partner admin sees only Northern's registrations
select _rls_test_as('00000000-0000-4000-8000-000000000030');
select is(
  (select array_agg(id order by id)::uuid[] from deal_registrations where id in (
    '00000000-0000-4000-8000-0000000000d4',
    '00000000-0000-4000-8000-0000000000d5')),
  array['00000000-0000-4000-8000-0000000000d4'::uuid],
  'partner user sees only their own registrations'
);

-- Northern partner admin can register for Northern
select lives_ok(
  $$insert into deal_registrations (partner_id, sponsor_company)
    values ('00000000-0000-4000-8000-0000000000b1', 'Own-partner insert')$$,
  'partner user can register a deal for their own partner'
);

-- ...but not for Kings Cross
select throws_ok(
  $$insert into deal_registrations (partner_id, sponsor_company)
    values ('00000000-0000-4000-8000-0000000000b2', 'Cross-partner insert')$$,
  '42501',
  'new row violates row-level security policy for table "deal_registrations"',
  'partner user cannot register a deal for another partner'
);

-- Partner users have no update policy: a status change touches 0 rows
update deal_registrations
  set status = 'approved'
  where id = '00000000-0000-4000-8000-0000000000d4';
select is(
  (select status from deal_registrations
    where id = '00000000-0000-4000-8000-0000000000d4'),
  'pending',
  'partner user cannot change registration status'
);

-- Internal user sees all fixture rows
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from deal_registrations where id in (
    '00000000-0000-4000-8000-0000000000d4',
    '00000000-0000-4000-8000-0000000000d5')),
  2,
  'internal user sees every registration'
);

select * from finish();
rollback;
