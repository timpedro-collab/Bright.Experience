-- ============================================================
-- Partner type: add 'referral'
-- ============================================================
--
-- The public join form (/partners/join) has always offered three tiers —
-- referral, reseller and agency — and defaults to referral. The check
-- constraint only allowed reseller / venue / agency / organizer, so every
-- application submitted with the default selection was rejected by the
-- database and the applicant saw "Failed to submit application". The mock
-- client does not enforce check constraints, which is why this survived to
-- here.
--
-- Referral partners are a real tier, not a typo: they refer business through
-- /p/:code, earn commission on attributed quotes, and use the same
-- /partners/:slug portal as resellers and agencies. Venue and organizer
-- partners are still created internally, never through the public form —
-- `partnerApplicationSchema` enforces that separately.

alter table partners
  drop constraint if exists partners_type_check;

alter table partners
  add constraint partners_type_check
  check (type in ('referral', 'reseller', 'venue', 'agency', 'organizer'));
