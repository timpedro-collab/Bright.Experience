-- Update profile bootstrap trigger to read account_id and role from invite metadata.
-- When a user is invited via inviteUserByEmail with data: { account_id, role },
-- the trigger now uses those values instead of defaulting to customer_user with no account.

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

  -- Read role and account_id from invite metadata if present
  BEGIN
    meta_role := (new.raw_user_meta_data ->> 'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    meta_role := 'customer_user';
  END;

  BEGIN
    meta_account := (new.raw_user_meta_data ->> 'account_id')::uuid;
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
