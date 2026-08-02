-- =====================================================================
-- handle_new_auth_user() (post 20260728000000_profile_bootstrap_app_metadata)
--
-- The trigger used to read `role` and `account_id` from `raw_user_meta_data`,
-- which a sign-up request populates and `auth.updateUser` can edit — so a
-- self-registered user could mint an admin profile in any tenant. It now reads
-- `raw_app_meta_data`, which only the Admin API (service role) can write.
--
-- Verifies:
--   1. Client-supplied user metadata cannot grant a role
--   2. Client-supplied user metadata cannot attach an account
--   3. Service-role app metadata does grant the invited role
--   4. Service-role app metadata does attach the invited account
--   5. An unparseable role falls back to customer_user instead of erroring
--   6. Display name still comes from user metadata
-- =====================================================================

begin;
\ir _fixtures.psql

select plan(6);

-- An attacker signing up with everything they can control set to admin.
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, instance_id, aud, role
) values (
  '00000000-0000-4000-8000-000000000801',
  'attacker@evil.test', '', now(),
  jsonb_build_object(
    'name', 'Nice Person',
    'role', 'admin',
    'account_id', '00000000-0000-4000-8000-0000000000a1'
  ),
  '{}'::jsonb,
  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
);

select is(
  (select role::text from profiles where id = '00000000-0000-4000-8000-000000000801'),
  'customer_user',
  'user metadata cannot self-assign a privileged role'
);

select is(
  (select account_id from profiles where id = '00000000-0000-4000-8000-000000000801'),
  null,
  'user metadata cannot attach an account'
);

select is(
  (select name from profiles where id = '00000000-0000-4000-8000-000000000801'),
  'Nice Person',
  'display name still comes from user metadata'
);

-- A genuine invite: the Admin API sets app metadata.
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, instance_id, aud, role
) values (
  '00000000-0000-4000-8000-000000000802',
  'invited@acme.test', '', now(),
  '{}'::jsonb,
  jsonb_build_object(
    'role', 'customer_admin',
    'account_id', '00000000-0000-4000-8000-0000000000a1'
  ),
  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
);

select is(
  (select role::text from profiles where id = '00000000-0000-4000-8000-000000000802'),
  'customer_admin',
  'app metadata grants the invited role'
);

select is(
  (select account_id from profiles where id = '00000000-0000-4000-8000-000000000802'),
  '00000000-0000-4000-8000-0000000000a1'::uuid,
  'app metadata attaches the invited account'
);

-- A malformed role must not break auth user creation.
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, raw_app_meta_data,
  created_at, updated_at, instance_id, aud, role
) values (
  '00000000-0000-4000-8000-000000000803',
  'garbled@acme.test', '', now(),
  '{}'::jsonb,
  jsonb_build_object('role', 'superuser'),
  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'
);

select is(
  (select role::text from profiles where id = '00000000-0000-4000-8000-000000000803'),
  'customer_user',
  'an unparseable role falls back to customer_user'
);

select * from finish();
rollback;
