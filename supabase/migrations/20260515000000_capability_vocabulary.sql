-- ============================================================
-- Capability vocabulary — World-class buying experience PR 1
-- ============================================================
--
-- Adds the canonical capability slug column to package_addons and a jsonb
-- addons column to quotes (carrying the customer's selected capabilities
-- through to the AE on /admin/quotes/[id]). The source of truth for the
-- slug list lives in src/lib/capabilities.ts; the DB check constraint
-- mirrors it for safety.
-- ============================================================

-- ------------------------------------------------------------
-- package_addons.capability_slug
-- ------------------------------------------------------------
-- Nullable on purpose: legacy or ad-hoc add-ons created before this pass
-- remain valid with a null slug; only rows attached to one of the nine
-- canonical capabilities use the slug column.

alter table package_addons
  add column if not exists capability_slug text;

alter table package_addons
  drop constraint if exists package_addons_capability_slug_check;

alter table package_addons
  add constraint package_addons_capability_slug_check
  check (
    capability_slug is null
    or capability_slug in (
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

create index if not exists idx_package_addons_capability_slug
  on package_addons(capability_slug);

-- ------------------------------------------------------------
-- quotes.addons
-- ------------------------------------------------------------
-- Carries the canonical capability slugs the customer asked for through
-- to the AE preparing the proposal. Validation is performed server-side
-- (sanitiseCapabilitySlugs in src/lib/capabilities.ts) before the row
-- is written; the column is jsonb to keep ordering and allow future
-- per-capability metadata without another migration.

alter table quotes
  add column if not exists addons jsonb not null default '[]'::jsonb;

create index if not exists idx_quotes_addons
  on quotes using gin (addons);
