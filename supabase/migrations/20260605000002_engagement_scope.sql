-- ============================================================
-- Engagement scope (replaces the budget-band qualifier)
--
-- The proposal intake no longer asks for a budget band — anchoring pricing
-- before the consultative walkthrough runs against the call-first model.
-- Instead we capture a non-price qualifier (one-off vs. part of a wider
-- programme) that helps the AE gauge scale and seriousness without naming a
-- number. The legacy `budget_indication` column is left in place for any
-- historical rows but is no longer written from the intake.
-- ============================================================
alter table quotes
  add column if not exists engagement_scope text;
