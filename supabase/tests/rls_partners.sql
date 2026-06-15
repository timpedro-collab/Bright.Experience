-- =====================================================================
-- RLS: partners, partner_users, partner_attributions
--
-- Verifies:
--   1. Internal users see every partner
--   2. Partner members see only their own partner row
--   3. Partner members do NOT see other partners' rows
--   4. Partner attributions are scoped by user_partner_id()
--   5. Public can apply (insert) as a partner
-- =====================================================================

begin;
\ir _fixtures.psql

insert into partner_attributions (id, partner_id, commission_status) values
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-4000-8000-0000000000b1', 'pending'),
  ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-0000000000b2', 'pending')
on conflict (id) do nothing;

-- The "Public read active partners" policy intentionally exposes every
-- ACTIVE partner to all roles. Mark the foreign partner inactive so the
-- partner-scoping assertions below test the own-partner guarantee rather
-- than the public directory.
update partners set status = 'inactive' where id = '00000000-0000-4000-8000-0000000000b2';

select plan(5);

-- (1) Internal sees all partners
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from partners),
  2,
  'internal user sees every partner'
);

-- (2) Northern admin sees only Northern
select _rls_test_as('00000000-0000-4000-8000-000000000030');
select is(
  (select array_agg(id order by id)::uuid[] from partners),
  array['00000000-0000-4000-8000-0000000000b1'::uuid],
  'partner_admin sees only their own partner'
);

-- (3) Northern member sees only Northern
select _rls_test_as('00000000-0000-4000-8000-000000000031');
select is(
  (select array_agg(id order by id)::uuid[] from partners),
  array['00000000-0000-4000-8000-0000000000b1'::uuid],
  'partner_member sees only their own partner'
);

-- (4) Partner sees only own attribution
select is(
  (select array_agg(id order by id)::uuid[] from partner_attributions),
  array['00000000-0000-4000-8000-0000000000a3'::uuid],
  'partner sees only own attributions'
);

-- (5) Anon can insert a new partner (application). The row is 'pending',
-- so anon cannot read it back (public read is active-only); verify as
-- internal that the application persisted.
select _rls_test_anon();
insert into partners (name, slug, type, partner_code, status)
  values ('Walk-in', 'walkin', 'reseller', 'BB-WALK001', 'pending');
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  (select count(*)::int from partners where slug = 'walkin'),
  1,
  'anon can insert a partner application'
);

select * from finish();
rollback;
