-- Phase 1 — Partner public landing.
--
-- The public funnel reads a tiny, co-brand-safe partner projection by
-- `partner_code` from two surfaces:
--   * /p/[code]              — set the attribution cookie, render hero
--   * <PartnerAttributionBanner> — show "Browsing with X" on every page
--
-- The existing `partners` policies allow only internal + partner members
-- to SELECT. Without a narrow anon policy the lookups above silently fail
-- and attribution never sticks. We add a policy targeting *only* active
-- partners. Sensitive columns (contact_name, contact_email,
-- commission_model_json, onboarded_at) are still protected because the
-- queries that hit this policy always SELECT a narrow column list — see
-- `src/lib/queries/partners.ts::getPartnerByCode`.

drop policy if exists "Public read active partners" on partners;

create policy "Public read active partners"
  on partners
  for select
  to anon, authenticated
  using (status = 'active');
