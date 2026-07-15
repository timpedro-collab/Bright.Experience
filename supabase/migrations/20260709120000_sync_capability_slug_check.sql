-- ============================================================
-- Sync package_addons.capability_slug check with capabilities.ts
-- ============================================================
--
-- Source of truth: src/lib/capabilities.ts (UPSELL_SLUGS / CAPABILITIES).
-- Removes retired slugs `voucher-redemption` and `app-qr-drive`, and ensures
-- `lead-capture` remains allowed. Any seed/demo rows using retired slugs
-- must be remapped before this constraint is applied.
-- ============================================================

-- Remap any leftover rows that still carry retired vocabulary.
update package_addons
  set capability_slug = 'lead-capture'
  where capability_slug = 'app-qr-drive';

update package_addons
  set capability_slug = 'sampling-unlock'
  where capability_slug = 'voucher-redemption';

alter table package_addons
  drop constraint if exists package_addons_capability_slug_check;

alter table package_addons
  add constraint package_addons_capability_slug_check
  check (
    capability_slug is null
    or capability_slug in (
      'lead-capture',
      'live-telemetry',
      'sampling-unlock',
      'linkedin-follow',
      'survey-layer',
      'dynamic-sponsors',
      'age-verification',
      'payments-onunit'
    )
  );
