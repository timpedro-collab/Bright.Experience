-- ============================================================
-- Add the branded-landing-page capability slug
-- ============================================================
--
-- Source of truth: src/lib/capabilities.ts (CAPABILITIES / UPSELL_SLUGS).
-- New paid upsell from client feedback (Adyen, Jul 2026): the QR data-capture
-- landing page rendered with the customer's brand kit. Delivery is flagged
-- per event via game_configurations.branded_landing.
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
      'linkedin-follow',
      'survey-layer',
      'dynamic-sponsors',
      'age-verification',
      'payments-onunit',
      'branded-landing-page'
    )
  );
