-- ============================================================
-- Pin search_path on the RLS helper functions
-- ============================================================
--
-- `is_internal_user()`, `user_account_id()` and `user_partner_id()` are
-- SECURITY DEFINER and decide the outcome of nearly every policy in the schema,
-- but they inherited the caller's `search_path`. A role that can create objects
-- in a schema earlier on that path (or that can set the path for its session)
-- could shadow `profiles` or `partner_users` with its own table and have every
-- policy consult it instead — is_internal_user() returning true for anyone.
--
-- `set search_path = public` resolves the names at definition scope. Bodies are
-- otherwise unchanged. `auth.uid()` is schema-qualified so it keeps resolving
-- with the restricted path.

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('events_lead', 'creative_lead', 'operations_lead', 'qa_lead', 'developer', 'admin')
  );
$$;

create or replace function public.user_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select account_id from public.profiles where id = auth.uid();
$$;

create or replace function public.user_partner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select partner_id from public.partner_users where profile_id = auth.uid() limit 1;
$$;
