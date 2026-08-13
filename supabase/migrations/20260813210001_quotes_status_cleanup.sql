-- ============================================================
-- Quotes: retire dead lifecycle statuses.
--
-- 'preparing', 'walkthrough_scheduled' and 'delivered' were allowed by the
-- check constraint but nothing ever wrote them — the walkthrough lives on
-- its own columns (walkthrough_scheduled_at / walkthrough_completed_at),
-- not in status, and proposal delivery is 'proposal_sent'. Keeping unused
-- states invites code that writes one and a lifecycle no surface handles.
--
-- The code-side counterpart: 'booked' was referenced by the conversion
-- allow-lists but never existed in this constraint; it is removed from
-- code in the same change.
--
-- Verified before shrinking: production holds only 'submitted' and
-- 'proposal_sent' rows.
-- ============================================================

alter table quotes
  drop constraint if exists quotes_status_check;

alter table quotes
  add constraint quotes_status_check
  check (
    status in (
      'draft',
      'submitted',
      'proposal_sent',
      'accepted',
      'expired',
      'declined'
    )
  );
