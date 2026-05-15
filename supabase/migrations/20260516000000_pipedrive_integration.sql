-- ============================================================
-- Migration: Pipedrive write-back integration (PR 3)
--
-- Adds three things to support one-way Bright.Experience → Pipedrive sync:
--   1. events.pipedrive_deal_id : optional link from a delivery event to the
--      Pipedrive deal it originated from. Null events silently skip all
--      Pipedrive triggers — the integration is fully opt-in per event.
--   2. pipedrive_outbox : durable queue of pending writes. The portal never
--      blocks on a Pipedrive HTTP call — every trigger enqueues a row and a
--      best-effort inline drain attempts the send, with a cron sweeping
--      anything that failed.
--   3. pipedrive_config : singleton settings row holding the API token and
--      the three opaque custom-field keys. Stored server-side only (RLS:
--      internal users), never exposed to the browser.
-- ============================================================

alter table events
  add column if not exists pipedrive_deal_id text,
  add column if not exists pipedrive_linked_at timestamptz;

create index if not exists idx_events_pipedrive_deal
  on events(pipedrive_deal_id)
  where pipedrive_deal_id is not null;

-- ============================================================
-- pipedrive_outbox
-- ------------------------------------------------------------
-- Each row represents one pending API call to Pipedrive. `kind` discriminates
-- the payload shape; `payload` is rendered into a note body or a custom-field
-- update by the drain worker. Successful rows set `sent_at`; the cleanup
-- happens out-of-band so we keep a short history for debugging.
-- ============================================================

create table if not exists pipedrive_outbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  deal_id text,
  kind text not null check (
    kind in (
      'note',
      'custom_field_update'
    )
  ),
  payload jsonb not null,
  attempts int not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_pipedrive_outbox_pending
  on pipedrive_outbox(created_at)
  where sent_at is null;

create index if not exists idx_pipedrive_outbox_event
  on pipedrive_outbox(event_id);

alter table pipedrive_outbox enable row level security;

create policy "Internal users see pipedrive outbox"
  on pipedrive_outbox for select
  using (is_internal_user());

create policy "Internal users manage pipedrive outbox"
  on pipedrive_outbox for all
  using (is_internal_user())
  with check (is_internal_user());

-- ============================================================
-- pipedrive_config
-- ------------------------------------------------------------
-- A single canonical row (`id = 1`). Storing config in a table rather than
-- env vars lets the integration page mutate it without a redeploy. The env
-- override `PIPEDRIVE_API_TOKEN` exists for local development.
-- ============================================================

create table if not exists pipedrive_config (
  id int primary key default 1,
  api_token text,
  base_url text not null default 'https://api.pipedrive.com',
  field_key_last_activity_at text,
  field_key_health_status text,
  field_key_delivered_events text,
  health_option_green_id int,
  health_option_amber_id int,
  health_option_red_id int,
  default_pipeline_id int,
  updated_at timestamptz default now(),
  constraint pipedrive_config_singleton check (id = 1)
);

alter table pipedrive_config enable row level security;

create policy "Internal users see pipedrive config"
  on pipedrive_config for select
  using (is_internal_user());

create policy "Internal users manage pipedrive config"
  on pipedrive_config for all
  using (is_internal_user())
  with check (is_internal_user());

-- Seed the singleton row up-front so the admin page can `update` without a
-- create-or-update dance.
insert into pipedrive_config (id) values (1)
  on conflict (id) do nothing;
