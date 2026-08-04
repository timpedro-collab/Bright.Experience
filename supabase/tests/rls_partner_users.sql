-- =====================================================================
-- RLS: partner_users (post 20260804000001_fix_partner_users_rls_recursion)
--
-- Regression guard: the original "Partner admins manage own partner users"
-- policy selected from partner_users inside its own USING clause, so every
-- non-internal read of the table aborted with "infinite recursion detected"
-- and every partner portal bounced its users. These tests fail loudly if
-- that (or any equally-broken policy) ever comes back.
--
-- Verifies:
--   1. a partner member can read their own membership row (no recursion)
--   2. a partner admin sees every membership row of their own partner
--   3. a partner admin sees no membership rows of another partner
--   4. a partner admin can add a member to their own partner
--   5. a partner admin cannot add a member to another partner
--   6. a plain member cannot add members (admin-only management)
-- =====================================================================

begin;
\ir _fixtures.psql

select plan(6);

-- 1. Member reads own row — the exact query getPartnerForUser() runs.
select _rls_test_as('00000000-0000-4000-8000-000000000031');
select is(
  (select partner_id from partner_users where profile_id = '00000000-0000-4000-8000-000000000031'),
  '00000000-0000-4000-8000-0000000000b1'::uuid,
  'partner member can read their own membership row without recursion'
);

-- 2. Northern admin sees both Northern rows (own + member's).
select _rls_test_as('00000000-0000-4000-8000-000000000030');
select is(
  (select count(*)::int from partner_users
    where partner_id = '00000000-0000-4000-8000-0000000000b1'),
  2,
  'partner admin sees every membership row of their own partner'
);

-- 3. ...and none of Kings Cross's.
select is(
  (select count(*)::int from partner_users
    where partner_id = '00000000-0000-4000-8000-0000000000b2'),
  0,
  'partner admin sees no membership rows of another partner'
);

-- 4. Northern admin can add a member to Northern. (Casey already has a
--    profile; membership rows only need profile + partner to exist.)
select lives_ok(
  $$insert into partner_users (partner_id, profile_id, role)
    values ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000020', 'member')$$,
  'partner admin can add a member to their own partner'
);

-- 5. ...but not to Kings Cross.
select throws_ok(
  $$insert into partner_users (partner_id, profile_id, role)
    values ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-000000000021', 'member')$$,
  '42501',
  'new row violates row-level security policy for table "partner_users"',
  'partner admin cannot add a member to another partner'
);

-- 6. A plain member has no management rights.
select _rls_test_as('00000000-0000-4000-8000-000000000031');
select throws_ok(
  $$insert into partner_users (partner_id, profile_id, role)
    values ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-000000000021', 'member')$$,
  '42501',
  'new row violates row-level security policy for table "partner_users"',
  'plain partner member cannot add members'
);

select * from finish();
rollback;
