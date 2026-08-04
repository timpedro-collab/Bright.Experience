-- ============================================================
-- Organizer sales engine — slot economics, holds, pitch tracking,
-- and deal registration (ecosystem build Stage 3, docs/19 §organizers)
-- ============================================================
--
-- What this adds and why:
--
--   1. `sponsorship_slots.wholesale_price` — what Bright.Blue invoices the
--      organizer for a sold slot (minor units, like `price`). The spread
--      between the organizer's sponsor-facing `price` and this wholesale
--      figure IS the organizer's margin — the number the whole channel
--      model (docs/20 §4: rack −20–25%) turns on. No new table: earnings
--      are derived per slot, statements sum them.
--   2. `sponsorship_slots.hold_expires_at` — a `reserved` slot with a
--      future hold expiry is a *hold*: inventory taken off the table while
--      a sponsor decides. Expiry is evaluated at read time (the same
--      pattern as quote expiry) so no cron is needed; an expired hold
--      reads as available again.
--   3. Pitch-link open tracking — `pitch_view_count` / `pitch_last_viewed_at`
--      so the rep can see whether the sponsor actually opened the link.
--      Counts only; no visitor identity is recorded.
--   4. `deal_registrations` — the channel-protection ledger. An organizer
--      registers a sponsor conversation (≤8 fields); approval grants a
--      14-day exclusivity window visible to every channel. `source`
--      distinguishes organizer-registered deals from "reverse" shells we
--      push when an inbound brand lead belongs at an organizer's show.

-- ============================================================
-- 1. Slot economics + holds + pitch tracking
-- ============================================================

alter table sponsorship_slots
  add column if not exists wholesale_price numeric;

alter table sponsorship_slots
  add column if not exists hold_expires_at timestamptz;

alter table sponsorship_slots
  add column if not exists pitch_view_count int not null default 0;

alter table sponsorship_slots
  add column if not exists pitch_last_viewed_at timestamptz;

-- ============================================================
-- 2. Deal registrations
-- ============================================================

create table if not exists deal_registrations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  -- Optional anchors: a specific show and/or the inbound quote that
  -- produced a reverse-registered shell.
  event_id uuid references events(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  sponsor_company text not null,
  sponsor_contact_name text,
  sponsor_contact_email text,
  -- Expected deal value in minor units; optional at registration.
  estimated_value numeric,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'converted', 'expired')),
  -- Set on approval: now() + 14 days. While in the future, the registering
  -- organizer owns this sponsor conversation across every channel.
  exclusivity_expires_at timestamptz,
  source text not null default 'organizer'
    check (source in ('organizer', 'reverse')),
  rejected_reason text,
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_deal_registrations_partner
  on deal_registrations(partner_id, status);

-- Duplicate/exclusivity checks match on the normalised company name.
create index if not exists idx_deal_registrations_company
  on deal_registrations(lower(sponsor_company));

create trigger set_updated_at before update on deal_registrations
  for each row execute function update_updated_at();

-- ============================================================
-- 3. RLS
-- ============================================================
-- Organizers see and create their own registrations. Approval/rejection is
-- a Bright.Blue decision, so status changes stay internal-only: partner
-- users get select + insert, never update/delete.

alter table deal_registrations enable row level security;

create policy "Partner users see own deal registrations"
  on deal_registrations for select using (
    partner_id = user_partner_id()
  );

create policy "Partner users register own deals"
  on deal_registrations for insert with check (
    partner_id = user_partner_id()
  );

create policy "Internal see all deal registrations"
  on deal_registrations for select using (is_internal_user());

create policy "Internal manage deal registrations"
  on deal_registrations for all using (is_internal_user());
