-- ============================================================
-- Lead capture becomes a selectable, priced capability
-- ============================================================
--
-- Lead capture / first-party data collection is no longer bundled as an
-- always-on inclusion. It now lives as a tailorable capability the customer
-- selects (and is priced for) during intake. The source of truth is
-- src/lib/capabilities.ts; this migration keeps the package_addons check
-- constraint in sync so a package can carry a priced `lead-capture` add-on.
-- ============================================================

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
      'voucher-redemption',
      'linkedin-follow',
      'survey-layer',
      'dynamic-sponsors',
      'app-qr-drive',
      'age-verification',
      'payments-onunit'
    )
  );
