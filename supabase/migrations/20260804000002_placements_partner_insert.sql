-- ============================================================
-- Fix: partner users could never create placements.
--
-- 20260403000008 gave partners SELECT and UPDATE on placements, and the
-- hardening pass (20260403000012) added partner INSERT for venues and
-- sponsorship_slots — but placements were skipped. In production every
-- "New placement" from the venue portal failed RLS; mock mode (no RLS)
-- hid it. Same venue-ownership scope as the existing partner policies.
-- ============================================================

create policy "Partner users create placements at own venues"
  on placements for insert
  with check (
    venue_id in (select id from venues where partner_id = user_partner_id())
  );
