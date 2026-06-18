-- ============================================================
-- notification_user_settings
-- ------------------------------------------------------------
-- Per-recipient delivery timing for the daily FYI digest. The digest cron
-- runs hourly and consults this table so each recipient receives their digest
-- at their own local hour, never inside their quiet-hours window, and at most
-- once per day (last_digest_sent_at is the dedup ledger the cron stamps).
--
-- A missing row means "use the defaults" (see lib/notifications/digest-timing),
-- so we do not need to backfill a row per user.
-- ============================================================

create table if not exists notification_user_settings (
  user_id uuid primary key references profiles(id) on delete cascade,
  timezone text not null default 'Europe/London',
  digest_hour int not null default 9 check (digest_hour between 0 and 23),
  quiet_start_hour int not null default 21 check (quiet_start_hour between 0 and 23),
  quiet_end_hour int not null default 8 check (quiet_end_hour between 0 and 23),
  last_digest_sent_at timestamptz,
  updated_at timestamptz default now()
);

alter table notification_user_settings enable row level security;

create policy "Users see own notification timing"
  on notification_user_settings for select
  using (user_id = auth.uid());

create policy "Users manage own notification timing"
  on notification_user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Internal users see all notification timing"
  on notification_user_settings for select
  using (is_internal_user());

create trigger set_updated_at before update on notification_user_settings
  for each row execute function update_updated_at();
