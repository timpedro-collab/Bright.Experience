-- ============================================================
-- Reminder ledger: support email-only recipients.
--
-- The proposal follow-up chase (`proposal.delivered`) nudges the quote's
-- contact email — a prospect with no portal account and therefore no
-- profiles row. The ledger's recipient_id was uuid + FK to profiles, so
-- recording a nudge for a synthetic recipient id (e.g.
-- "quote-contact:<quoteId>") failed, which would have made the cron
-- re-send the same chase every day.
--
-- recipient_id becomes text with no FK. Existing uuid values cast
-- losslessly. The ledger is cron-owned bookkeeping behind internal-only
-- RLS; nothing user-facing reads it.
-- ============================================================

alter table notification_reminders
  drop constraint if exists notification_reminders_recipient_id_fkey;

alter table notification_reminders
  alter column recipient_id type text using recipient_id::text;
