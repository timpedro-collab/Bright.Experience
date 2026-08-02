-- ============================================================
-- Organizer Shows — fleet, zones, and show-scoped sponsorship
-- ============================================================
--
-- An "organizer" (e.g. a conference producer running a trade show) is a
-- partner org that owns one or more shows. A show is an ordinary `events`
-- row — it inherits the delivery pipeline, telemetry, leads, reports, and
-- capture rules already built for customer events. What is new:
--
--   1. `partners.type` gains 'organizer'.
--   2. `events.organizer_partner_id` links a show to its organizer.
--   3. `machine_instances` gain a `zone` (where in the venue) and a
--      `mission` (what that unit is there to do) so one show can run a
--      fleet with different jobs per unit.
--   4. `sponsorship_slots` become dual-scoped: the existing venue path
--      (placement_id) OR a show path (event_id + machine_instance_id),
--      so an organizer can sell an individual machine to a sponsor.
--
-- Enforcement of anything machine-side (badge scanning, per-zone capture
-- behaviour) remains on the machine stack; this schema only authors it.

-- ============================================================
-- 1. Organizer partner type
-- ============================================================

alter table partners
  drop constraint if exists partners_type_check;

alter table partners
  add constraint partners_type_check
  check (type in ('reseller', 'venue', 'agency', 'organizer'));

-- ============================================================
-- 2. Shows belong to an organizer
-- ============================================================

alter table events
  add column if not exists organizer_partner_id uuid
  references partners(id) on delete set null;

create index if not exists idx_events_organizer
  on events(organizer_partner_id);

-- ============================================================
-- 3. Fleet: zone + mission per deployed machine
-- ============================================================
-- Both describe the *current deployment*, matching the existing mutable
-- `current_event_id` / `current_placement_id` columns on this table.
--
-- `zone` is deliberately free text: organizers name their own zones
-- ("Registration", "Hall 3 entrance", "Rebooking desk") and we should not
-- force them into our taxonomy. `mission` is constrained because the
-- machine stack branches on it.

alter table machine_instances
  add column if not exists zone text;

alter table machine_instances
  add column if not exists mission text;

alter table machine_instances
  drop constraint if exists machine_instances_mission_check;

alter table machine_instances
  add constraint machine_instances_mission_check
  check (
    mission is null
    or mission in (
      'lead_capture',
      'sponsor_activation',
      'welcome_gift',
      'rebook_reward',
      'sampling'
    )
  );

create index if not exists idx_machine_instances_zone
  on machine_instances(current_event_id, zone);

-- Leads are queried per machine for the fleet roll-up and per-sponsor
-- reporting; the column existed with no index.
create index if not exists idx_leads_machine
  on leads(machine_instance_id);

-- ============================================================
-- 4. Show-scoped sponsorship slots
-- ============================================================

-- A slot is scoped EITHER to a venue placement (the existing Bright.Runway
-- path) OR to a show machine (the organizer path).
alter table sponsorship_slots
  alter column placement_id drop not null;

alter table sponsorship_slots
  add column if not exists event_id uuid
  references events(id) on delete cascade;

alter table sponsorship_slots
  add column if not exists machine_instance_id uuid
  references machine_instances(id) on delete set null;

-- Unguessable share token for the public sponsor pitch page. Mirrors the
-- `event_reports.share_token` pattern.
alter table sponsorship_slots
  add column if not exists pitch_token text unique;

alter table sponsorship_slots
  add column if not exists pitch_token_expires_at timestamptz;

-- Sponsors are frequently a brand we have no account for yet, so capture a
-- plain name alongside the optional linked account.
alter table sponsorship_slots
  add column if not exists sponsor_name text;

alter table sponsorship_slots
  drop constraint if exists sponsorship_slots_scope_check;

alter table sponsorship_slots
  add constraint sponsorship_slots_scope_check
  check (
    (placement_id is not null and event_id is null)
    or (event_id is not null and placement_id is null)
  );

-- Bug fix: `sponsor_account_id` referenced profiles(id), but every write
-- path stores an id from the `accounts` table (see getAccountOptions in
-- src/lib/queries/admin.ts). Repoint the FK at the table actually used and
-- null out any value that cannot be resolved.
update sponsorship_slots
  set sponsor_account_id = null
  where sponsor_account_id is not null
    and sponsor_account_id not in (select id from accounts);

alter table sponsorship_slots
  drop constraint if exists sponsorship_slots_sponsor_account_id_fkey;

alter table sponsorship_slots
  add constraint sponsorship_slots_sponsor_account_id_fkey
  foreign key (sponsor_account_id) references accounts(id) on delete set null;

create index if not exists idx_sponsorship_slots_event
  on sponsorship_slots(event_id);

create index if not exists idx_sponsorship_slots_machine
  on sponsorship_slots(machine_instance_id);

create index if not exists idx_sponsorship_slots_pitch_token
  on sponsorship_slots(pitch_token);

-- ============================================================
-- 5. RLS — organizer partner users see their own shows
-- ============================================================
-- Organizers are partner users, so they reuse `user_partner_id()`. They get
-- read access to their shows and the fleet/slots on them, and may manage
-- slots (their commercial inventory) but never the delivery pipeline.

create policy "Organizer users see own shows"
  on events for select using (
    organizer_partner_id is not null
    and organizer_partner_id = user_partner_id()
  );

create policy "Organizer users see own show machines"
  on machine_instances for select using (
    current_event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

create policy "Organizer users see own show slots"
  on sponsorship_slots for select using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

create policy "Organizer users manage own show slots"
  on sponsorship_slots for all using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

-- Aggregate performance data for the fleet board. Telemetry carries no
-- contact details, so an organizer may read it for their own shows.
create policy "Organizer users see own show telemetry"
  on telemetry_events for select using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

create policy "Organizer users see own show snapshots"
  on event_metrics_snapshot for select using (
    event_id in (
      select id from events where organizer_partner_id = user_partner_id()
    )
  );

-- Deliberately NOT granted: `leads`. Captured contacts belong to the brand
-- that ran the activation, not to the organizer hosting it. Organizers see
-- lead *counts* (via telemetry and snapshots) and never lead rows. Selling
-- lead data onward is a commercial decision that needs a consent basis
-- before any policy here is widened.

