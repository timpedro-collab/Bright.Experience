-- ============================================================
-- Stage 4: Venue yield engine (docs/19 §venues)
--
-- Placement-as-SKU: a placement becomes a coded, publishable unit of
-- inventory (location, footfall, per-sponsor cap) with a venue approval
-- step (`sku_status`) gating what appears on the public advertise page
-- and the embeddable widget.
--
-- The revenue model stays in `pricing_model_json` but is now typed at the
-- application layer (src/lib/venues/revenue-model.ts): revenue_share /
-- fixed_fee / guarantee_overage (guarantee vs % of booked, whichever is
-- greater — the mental model venues already hold).
-- ============================================================

alter table placements
  add column sku_code text,
  add column location_label text,
  add column footfall_estimate int,
  add column max_slots_per_sponsor int,
  add column sku_status text not null default 'draft'
    check (sku_status in ('draft', 'live'));

comment on column placements.sku_code is
  'Venue-scoped inventory code (e.g. WES-ST-01). Unique per venue when set.';
comment on column placements.location_label is
  'Where the unit stands, in the venue''s own words (e.g. "The Street, ground floor").';
comment on column placements.footfall_estimate is
  'Venue-estimated daily footfall past this position. Marketing figure, not telemetry.';
comment on column placements.max_slots_per_sponsor is
  'Per-sponsor cap: how many slots one sponsor may hold on this placement at once.';
comment on column placements.sku_status is
  'Venue approval step: only ''live'' placements appear on the public advertise page and widget.';

-- One code per venue; placements without a code are unconstrained.
create unique index idx_placements_sku_code
  on placements(venue_id, sku_code)
  where sku_code is not null;

-- Existing placements were already publicly visible on the advertise page,
-- so backfill them as live — the approval step applies from here forward.
update placements set sku_status = 'live';
