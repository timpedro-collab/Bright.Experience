-- ============================================================
-- Migration: Unified notification spine (PR 1 + PR 2 + PR 3 schema)
--
-- Extends `notifications` with the metadata the dispatcher needs (canonical
-- `kind`, `priority`, generic entity reference, `action_required` flag) and
-- introduces three sibling tables:
--   - notification_preferences : per-user, per-archetype toggles (class B can
--     silence the in-portal lane; class A is enforced in app code regardless
--     of the stored row)
--   - notification_reminders   : the dedup ledger consulted by the reminder
--     cron so we never re-send the same nudge until the cadence ticks
--   - assets review fields     : the review_status/decided_by/feedback fields
--     used by the asset approval gate (PR 2)
--
-- The migration is deliberately additive — every column has a sane default so
-- existing rows continue to work and the `createNotification` server action
-- stays valid while we cut callers over to `dispatchNotification`.
-- ============================================================

alter table notifications
  add column if not exists kind text,
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists action_required boolean not null default false;

create index if not exists idx_notifications_kind on notifications(kind);
create index if not exists idx_notifications_action_required
  on notifications(user_id, action_required, is_read);
create index if not exists idx_notifications_entity
  on notifications(entity_type, entity_id);

-- ============================================================
-- notification_preferences
-- ------------------------------------------------------------
-- One row per (user, archetype). Absence of a row implies the archetype's
-- defaults (declared in src/lib/notifications/archetypes.ts). The
-- application layer treats `in_portal` as `true` for class A archetypes no
-- matter what is stored here — the column exists so the table is symmetric
-- across both classes and the UI can still surface the setting as a
-- read-only "Always on" hint.
-- ============================================================

create table if not exists notification_preferences (
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  in_portal boolean not null default true,
  email_mode text not null default 'immediate'
    check (email_mode in ('immediate', 'digest', 'off')),
  updated_at timestamptz default now(),
  primary key (user_id, kind)
);

alter table notification_preferences enable row level security;

create policy "Users see own notification preferences"
  on notification_preferences for select
  using (user_id = auth.uid());

create policy "Users manage own notification preferences"
  on notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Internal users see all notification preferences"
  on notification_preferences for select
  using (is_internal_user());

-- ============================================================
-- notification_reminders
-- ------------------------------------------------------------
-- A append-only-ish ledger of "we already nudged (user, kind) about (entity)
-- on this date at this escalation level". The reminder cron consults this
-- before sending. Composite primary key prevents double-sends within a
-- single tick.
-- ============================================================

create table if not exists notification_reminders (
  subject_type text not null,
  subject_id uuid not null,
  recipient_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  last_sent_at timestamptz not null default now(),
  escalation_level int not null default 1,
  primary key (subject_type, subject_id, recipient_id, kind)
);

create index if not exists idx_reminders_subject
  on notification_reminders(subject_type, subject_id);
create index if not exists idx_reminders_recipient
  on notification_reminders(recipient_id);

alter table notification_reminders enable row level security;

create policy "Internal users manage reminders"
  on notification_reminders for all
  using (is_internal_user());

-- ============================================================
-- Asset review gate (PR 2 schema, landed now to keep migrations linear)
-- ------------------------------------------------------------
-- The existing `status` enum (required/uploaded/under_review/accepted/
-- rejected) describes the customer's *upload* state. `review_status` is the
-- Bright.Blue creative side's *decision* state, kept separate so we can
-- evolve customer-side UX without touching review history.
-- ============================================================

alter table assets
  add column if not exists review_status text not null default 'pending_review'
    check (review_status in ('pending_review', 'approved', 'revision_requested')),
  add column if not exists review_decided_by uuid references profiles(id),
  add column if not exists review_decided_at timestamptz,
  add column if not exists revision_count int not null default 0;

create index if not exists idx_assets_review_status
  on assets(event_id, review_status);
