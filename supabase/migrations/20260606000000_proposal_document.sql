-- ============================================================
-- Narrative proposal documents
--
-- Upgrades the proposal track from a flat line-item brochure to a
-- multi-section, editorial document (brief → solution → creative → data
-- → included → investment → timeline → next steps), modelled on the
-- Bright.Blue sales proposal format.
--
--   * proposal_content        — the structured, AE-editable document JSON
--   * brief_challenge/success  — narrative captured from the customer at
--                                intake (their words drive "The brief")
--   * qualifying_questions     — the post-game data-capture questions
--   * walkthrough_scheduled_*  — the call-first workflow: a proposal is
--                                presented on a 15-minute walkthrough rather
--                                than emailed cold
-- ============================================================

alter table quotes
  add column if not exists proposal_content jsonb,
  add column if not exists brief_challenge text,
  add column if not exists brief_success text,
  add column if not exists qualifying_questions text,
  add column if not exists walkthrough_scheduled_at timestamptz,
  add column if not exists walkthrough_notes text;

-- Add the call-first status to the allow-list. `walkthrough_scheduled`
-- sits between intake and the proposal reveal: the document exists but the
-- customer has booked the 15-minute run-through where pricing is presented.
alter table quotes
  drop constraint if exists quotes_status_check;

alter table quotes
  add constraint quotes_status_check
  check (
    status in (
      'draft',
      'submitted',
      'preparing',
      'walkthrough_scheduled',
      'proposal_sent',
      'delivered',
      'accepted',
      'expired',
      'declined'
    )
  );
