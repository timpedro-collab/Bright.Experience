-- ============================================================
-- Proposal walkthrough (call-first selling)
--
-- Premium proposals are walked through on a short call before pricing is
-- revealed, rather than emailed cold. We store the per-proposal scheduler
-- link and a timestamp for when the walkthrough has happened — the customer
-- proposal page hides the investment section until that timestamp is set.
-- ============================================================
alter table quotes
  add column if not exists walkthrough_url text,
  add column if not exists walkthrough_completed_at timestamptz;
