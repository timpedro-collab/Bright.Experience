-- ============================================================
-- Stage 5 foundation: measurement & proof engine
--
-- Four independent pieces, one migration because they ship together:
--   1. Lead quality columns — verified/disposable/invalid email verdicts and
--      repeat-player dedupe, so "verified leads" can be reported separately.
--   2. Live-share token on events — a view-only, expiring public link to the
--      live dashboard ("Powered by Bright.Experience" growth loop).
--   3. Event-scoped webhook subscriptions — real-time lead delivery to a
--      brand's CRM ("leads in your CRM before the stand packs down").
--   4. Post-play journeys — the branded where-to-buy / review / discount
--      follow-up sent on lead capture, with per-lead touch tracking.
--
-- Also widens the telemetry event_type CHECK: capture_rejected_domain and
-- capture_duplicate_blocked have been streamed and counted since the capture
-- quality work but were never added to the constraint.
-- ============================================================

-- 1. Lead quality --------------------------------------------------

alter table leads
  add column email_status text not null default 'unchecked'
    check (email_status in ('unchecked', 'verified', 'disposable', 'invalid')),
  add column is_repeat_player boolean not null default false;

comment on column leads.email_status is
  'Lead-quality verdict: syntax + disposable-domain screen. verified counts toward "verified leads".';
comment on column leads.is_repeat_player is
  'True when an earlier lead at the same event already carries this email — the replay, not the first capture.';

-- 2. Live-share token ----------------------------------------------

alter table events
  add column live_share_token uuid,
  add column live_share_expires_at timestamptz;

comment on column events.live_share_token is
  'Capability token for the view-only public live dashboard. Null = no link issued.';

create unique index idx_events_live_share_token
  on events(live_share_token)
  where live_share_token is not null;

-- 3. Event-scoped webhook subscriptions ----------------------------

alter table webhook_subscriptions
  add column event_id uuid references events(id) on delete cascade;

comment on column webhook_subscriptions.event_id is
  'Lead-delivery scope: subscription fires for leads captured at this event.';

create index idx_webhook_subscriptions_event
  on webhook_subscriptions(event_id)
  where event_id is not null;

-- 4. Post-play journeys --------------------------------------------

create table post_play_journeys (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kind text not null check (kind in ('where_to_buy', 'review', 'discount')),
  headline text not null,
  body text,
  cta_label text not null,
  cta_url text not null,
  discount_code text,
  is_active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table post_play_journeys is
  'The branded follow-up a player receives after lead capture. One active journey per event drives the send.';

create index idx_post_play_journeys_event on post_play_journeys(event_id);

create table journey_touches (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references post_play_journeys(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  touch text not null check (touch in ('sent', 'opened', 'clicked', 'redeemed')),
  occurred_at timestamptz default now(),
  unique (journey_id, lead_id, touch)
);

comment on table journey_touches is
  'Per-lead journey funnel: sent → opened → clicked → redeemed. Feeds the 24h and 30-day report blocks.';

create index idx_journey_touches_journey on journey_touches(journey_id);

-- RLS: journeys and touches follow the event's account scoping.
alter table post_play_journeys enable row level security;
alter table journey_touches enable row level security;

create policy "Internal manage journeys"
  on post_play_journeys for all using (is_internal_user());

create policy "Customers see own journeys"
  on post_play_journeys for select using (
    event_id in (select id from events where account_id = user_account_id())
  );

create policy "Internal manage journey touches"
  on journey_touches for all using (is_internal_user());

create policy "Customers see own journey touches"
  on journey_touches for select using (
    journey_id in (
      select j.id from post_play_journeys j
      join events e on e.id = j.event_id
      where e.account_id = user_account_id()
    )
  );

-- 5. Telemetry CHECK widening --------------------------------------

alter table telemetry_events
  drop constraint telemetry_events_event_type_check;

alter table telemetry_events
  add constraint telemetry_events_event_type_check
  check (event_type in (
    'play_started', 'play_completed', 'lead_captured', 'prize_awarded',
    'heartbeat', 'error', 'capture_rejected_domain', 'capture_duplicate_blocked'
  ));
