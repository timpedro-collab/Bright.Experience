-- ============================================================
-- Messages: denormalize the sender's display name.
--
-- The thread renders sender attribution via a profiles join, but
-- profiles RLS only lets customers read their OWN row — so every other
-- participant (including the Bright.Blue team replying to them)
-- displayed as "Unknown". Found by the production journey audit.
--
-- Stamping the name at send time is display-only denormalization:
-- historically accurate (a later rename doesn't rewrite old threads)
-- and readable under the sender's RLS-restricted join being null.
-- The read query still prefers the live profile name when the viewer
-- CAN see it, so internal viewers get renames for free.
-- ============================================================

alter table messages
  add column if not exists sender_name text;

-- Backfill from profiles (migration runs as service role, bypassing RLS).
update messages m
set sender_name = p.name
from profiles p
where p.id = m.sender_id
  and m.sender_name is null;
