-- ============================================================
-- Quote: projected reach + comprehensive lead capture + in-app booking
--
-- The recommendation quiz now branches into a tradeshow track (reach from an
-- attendee count) and an experiential track (reach from a real OOH site's
-- footfall, plus a DOOH media value). Those figures, the fuller lead profile,
-- and the in-app 15-minute walkthrough booking are all persisted on the quote
-- so the event lead sees the whole picture in the portal.
-- ============================================================
alter table quotes
  add column if not exists contact_role text,
  add column if not exists reach_track text,
  add column if not exists attendees integer,
  add column if not exists activation_location text,
  add column if not exists activation_location_key text,
  add column if not exists activation_days integer,
  add column if not exists event_timeline text,
  add column if not exists estimated_impressions bigint,
  add column if not exists estimated_interactions bigint,
  add column if not exists estimated_leads bigint,
  -- DOOH media value, stored in integer USD cents to match app convention.
  add column if not exists dooh_media_value bigint,
  -- In-app walkthrough booking (replaces the cold Calendly link for the demo).
  add column if not exists walkthrough_scheduled_at timestamptz,
  add column if not exists walkthrough_slot_label text;
