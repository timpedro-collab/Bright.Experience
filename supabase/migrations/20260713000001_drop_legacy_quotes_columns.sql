-- =====================================================================
-- Drop the superseded legacy `quotes` columns.
--
-- The schema-reconcile migration (20260403000010) introduced the
-- canonical columns and back-filled them from the originals, promising
-- a follow-up drop that never shipped (docs/11-cloud-handoff.md E2).
-- This is that migration.
--
--   legacy               → canonical
--   ------------------------------------------
--   location_postcode    → postcode
--   dates_start          → event_date_start
--   dates_end            → event_date_end
--   footfall_estimate    → footfall_estimate_text
--   valid_until          → expires_at
--   budget_indication    → engagement_scope
--
-- No code reads or writes the legacy names any more (the last writer,
-- prepareProposal's `valid_until`, and the last reader, the quote-list
-- select of `location_postcode`, were removed in the same change set).
-- =====================================================================

alter table quotes
  drop column if exists location_postcode,
  drop column if exists dates_start,
  drop column if exists dates_end,
  drop column if exists footfall_estimate,
  drop column if exists valid_until,
  drop column if exists budget_indication;
