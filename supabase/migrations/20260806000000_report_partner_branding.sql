-- Stage 6: partner white-label report theming.
--
-- A published proof-of-performance report can carry a partner's branding
-- (logo + accent colour) so trade partners — agencies, organizers, venues —
-- can share results under their own lockup ("Prepared by X with
-- Bright.Experience"). The column is a *theming* link only: commission
-- attribution stays in partner_attributions, organizer ownership stays in
-- events.organizer_partner_id.

alter table event_reports
  add column if not exists brand_partner_id uuid references partners(id);

comment on column event_reports.brand_partner_id is
  'Partner whose branding (logo_url, brand_color) themes the public shared report. Theming only — not attribution.';

-- Fast lookup when listing a partner''s branded reports.
create index if not exists idx_event_reports_brand_partner
  on event_reports (brand_partner_id)
  where brand_partner_id is not null;
