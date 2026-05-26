-- ============================================================
-- Profile bootstrap — Phase 0.2 of the Path-to-10/10 build.
-- ------------------------------------------------------------
-- Every new auth.users row gets a matching profiles row (default
-- role 'customer_user'). The Supabase callback also re-runs this
-- check at the application layer so existing users created before
-- the trigger landed get back-filled on first sign-in.
--
-- The role assignment defaults to 'customer_user' so an
-- unrecognised invitee never accidentally gets elevated. Internal
-- onboarding flips the role explicitly through the admin UI.
-- ============================================================

-- ============================================================
-- Trigger: create profile row on auth.users insert.
-- ============================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1),
    'New user'
  );

  insert into profiles (id, name, email, role, is_active)
  values (
    new.id,
    display_name,
    new.email,
    'customer_user',
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================
-- Back-fill : create profiles for any existing auth.users row that
-- doesn't have one (mostly demo accounts created before the trigger
-- landed in earlier environments).
-- ============================================================

insert into profiles (id, name, email, role, is_active)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1),
    'New user'
  ),
  u.email,
  'customer_user',
  true
from auth.users u
where not exists (
  select 1 from profiles p where p.id = u.id
);
