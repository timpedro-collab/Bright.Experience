-- =====================================================================
-- RLS helper hardening (post 20260728000002_rls_helper_search_path)
--
-- is_internal_user(), user_account_id() and user_partner_id() are
-- SECURITY DEFINER and are the basis of nearly every policy in the schema.
-- Without a pinned search_path they resolved `profiles` against the caller's
-- search_path, so a caller who could create a schema could shadow the table
-- and make is_internal_user() return true.
--
-- These tests shadow the real tables in a decoy schema, put it first on the
-- search_path, and assert the helpers still answer from `public`.
--
-- Verifies:
--   1. is_internal_user() ignores a shadowed profiles table
--   2. is_internal_user() still answers correctly for a real internal user
--   3. user_account_id() ignores a shadowed profiles table
--   4. user_partner_id() ignores a shadowed partner_users table
--   5. All three functions carry an explicit search_path setting
-- =====================================================================

begin;
\ir _fixtures.psql

create schema if not exists decoy;

-- A customer user who claims to be internal, in a table that shadows public.
create table decoy.profiles as
  select
    '00000000-0000-4000-8000-000000000020'::uuid as id,
    'admin'::text as role,
    '00000000-0000-4000-8000-0000000000a2'::uuid as account_id,
    true as is_active;

create table decoy.partner_users as
  select
    '00000000-0000-4000-8000-000000000020'::uuid as profile_id,
    '00000000-0000-4000-8000-0000000000b1'::uuid as partner_id;

select plan(5);

-- Casey is a customer_admin at Acme, not internal staff.
select _rls_test_as('00000000-0000-4000-8000-000000000020');
-- `extensions` stays on the path because pgTAP itself lives there.
set local search_path = decoy, public, extensions;

select is(
  is_internal_user(),
  false,
  'is_internal_user() ignores a shadowed profiles table'
);

select is(
  user_account_id(),
  '00000000-0000-4000-8000-0000000000a1'::uuid,
  'user_account_id() ignores a shadowed profiles table'
);

select is(
  user_partner_id(),
  null,
  'user_partner_id() ignores a shadowed partner_users table'
);

-- The helpers must still say yes to genuine internal staff.
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select is(
  is_internal_user(),
  true,
  'is_internal_user() still recognises real internal staff'
);

reset search_path;

select is(
  (select count(*)::int
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('is_internal_user', 'user_account_id', 'user_partner_id')
      and exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) as c
        where c like 'search_path=%'
      )),
  3,
  'all three RLS helpers pin an explicit search_path'
);

select * from finish();
rollback;
