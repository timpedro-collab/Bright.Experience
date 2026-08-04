-- ============================================================
-- Fix: infinite recursion in partner_users RLS.
--
-- The hardening policy "Partner admins manage own partner users"
-- (20260403000012) selects from partner_users inside its own USING clause.
-- Policies on a table cannot query that same table without recursing, so
-- EVERY non-internal read of partner_users aborted with "infinite recursion
-- detected" — which made getPartnerForUser() return null and bounced every
-- partner (venue, organizer, reseller) out of their portal in production.
-- Mock mode bypasses RLS, so local development never saw it.
--
-- "Partner admins update own partner" on partners had the same recursive
-- subquery (and an inner-scope binding bug: `where partner_id = id` bound to
-- the subquery's own column, making it a tautology).
--
-- The fix mirrors user_partner_id(): a SECURITY DEFINER helper runs outside
-- RLS, so policies can ask "is this caller a partner admin?" without
-- re-entering the policy.
-- ============================================================

-- search_path pinned like the other helpers (20260728000002): a definer
-- function that resolves table names off the caller's path can be shadowed.
create or replace function public.user_is_partner_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from partner_users
    where profile_id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Partner admins manage own partner users" on partner_users;
create policy "Partner admins manage own partner users"
  on partner_users for all
  using (partner_id = user_partner_id() and user_is_partner_admin())
  with check (partner_id = user_partner_id() and user_is_partner_admin());

drop policy if exists "Partner admins update own partner" on partners;
create policy "Partner admins update own partner"
  on partners for update
  using (id = user_partner_id() and user_is_partner_admin());
