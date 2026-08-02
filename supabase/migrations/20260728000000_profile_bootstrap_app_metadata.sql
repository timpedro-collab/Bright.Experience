-- Privilege escalation fix: stop trusting user-writable metadata for role.
--
-- The previous version of handle_new_auth_user() read `role` and `account_id`
-- from `raw_user_meta_data`. That column is populated from the client-supplied
-- `options.data` on sign-up and is editable afterwards via `auth.updateUser`,
-- so anyone who could create an account could mint themselves an `admin`
-- profile scoped to any tenant.
--
-- `raw_app_meta_data` is writable only through the Admin API (service role), so
-- it is a safe source. Both invite paths (src/app/actions/invites.ts,
-- src/app/actions/organizer-admin.ts) already upsert the correct role and
-- account with the service-role client immediately after inviting, so the
-- trigger only needs a safe default: an unprivileged, account-less
-- customer_user. `name` still comes from user metadata because it is display
-- text with no authorisation meaning.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  display_name text;
  meta_role    user_role;
  meta_account uuid;
BEGIN
  display_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  );

  -- Service-role-only metadata. Anything unparseable falls back to the least
  -- privileged role rather than raising, so auth user creation never fails.
  BEGIN
    meta_role := (new.raw_app_meta_data ->> 'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    meta_role := 'customer_user';
  END;

  BEGIN
    meta_account := (new.raw_app_meta_data ->> 'account_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    meta_account := null;
  END;

  INSERT INTO public.profiles (id, name, email, role, account_id, is_active)
  VALUES (
    new.id,
    display_name,
    coalesce(new.email, new.id::text || '@unknown'),
    coalesce(meta_role, 'customer_user'),
    meta_account,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
