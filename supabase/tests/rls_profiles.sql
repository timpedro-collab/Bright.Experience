-- =====================================================================
-- RLS: profiles, accounts
--
-- Verifies the bootstrap + persona-routing guarantees:
--   1. Users see their own profile
--   2. Users can insert their own profile (defence-in-depth for the
--      trigger-based bootstrap)
--   3. Users can update their own profile (display name change)
--   4. Users CANNOT update someone else's profile
--   5. Internal users see every profile and account
--   6. Customers see only their own account
-- =====================================================================

begin;
\i tests/_fixtures.sql

select plan(6);

-- (1) User sees own profile
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(id order by id)::uuid[] from profiles where id = auth.uid()),
  array['00000000-0000-4000-8000-000000000020'::uuid],
  'user can see own profile'
);

-- (2) New user can insert own profile (test by simulating a brand-new auth user)
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values ('00000000-0000-4000-8000-000000000099', 'fresh@x.test', '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
on conflict (id) do nothing;
select _rls_test_as('00000000-0000-4000-8000-000000000099');
insert into profiles (id, name, email, role, is_active)
  values ('00000000-0000-4000-8000-000000000099', 'Fresh', 'fresh@x.test', 'customer_user', true);
select is(
  (select count(*)::int from profiles where id = '00000000-0000-4000-8000-000000000099'),
  1,
  'user can insert own profile'
);

-- (3) User can update own profile
select _rls_test_as('00000000-0000-4000-8000-000000000020');
update profiles set name = 'Casey Renamed' where id = auth.uid();
select is(
  (select name from profiles where id = auth.uid()),
  'Casey Renamed',
  'user can update own display name'
);

-- (4) User CANNOT update someone else's profile (silent RLS filter)
update profiles set name = 'Hacked' where id = '00000000-0000-4000-8000-000000000021';
select isnt(
  (select name from profiles where id = '00000000-0000-4000-8000-000000000021'),
  'Hacked',
  'user cannot update someone else profile'
);

-- (5) Internal sees every profile + account
select _rls_test_as('00000000-0000-4000-8000-000000000011');
select cmp_ok(
  (select count(*)::int from profiles),
  '>=', 8,
  'internal sees every profile'
);

-- (6) Customer sees only their own account
select _rls_test_as('00000000-0000-4000-8000-000000000020');
select is(
  (select array_agg(slug order by slug)::text[] from accounts),
  array['acme']::text[],
  'customer sees only own account'
);

select * from finish();
rollback;
