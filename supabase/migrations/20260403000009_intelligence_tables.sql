-- ============================================================
-- Phase 8: Intelligence & Scale
-- Campaigns, Recommendations, API Keys, Webhooks
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  start_date date,
  end_date date,
  shared_creative_json jsonb default '{}',
  aggregate_metrics_json jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (campaign_id, event_id)
);

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('machine_game_combo', 'package_for_objective', 'location_performance')),
  context_json jsonb default '{}',
  recommendation_json jsonb default '{}',
  confidence_score numeric,
  sample_size int default 0,
  updated_at timestamptz default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references profiles(id) on delete cascade,
  partner_id uuid references partners(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  permissions jsonb default '[]',
  is_active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

create table webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references profiles(id) on delete cascade,
  partner_id uuid references partners(id) on delete cascade,
  url text not null,
  events jsonb default '[]',
  secret text,
  is_active boolean default true,
  last_triggered_at timestamptz,
  failure_count int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_campaigns_account on campaigns(account_id);
create index idx_campaigns_status on campaigns(status);
create index idx_campaign_events_campaign on campaign_events(campaign_id);
create index idx_campaign_events_event on campaign_events(event_id);
create index idx_recommendations_category on recommendations(category);
create index idx_recommendations_confidence on recommendations(confidence_score);
create index idx_api_keys_hash on api_keys(key_hash);
create index idx_api_keys_prefix on api_keys(key_prefix);
create index idx_api_keys_active on api_keys(is_active);
create index idx_webhook_subscriptions_active on webhook_subscriptions(is_active);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table campaigns enable row level security;
alter table campaign_events enable row level security;
alter table recommendations enable row level security;
alter table api_keys enable row level security;
alter table webhook_subscriptions enable row level security;

-- Campaigns: internal full access
create policy "Internal manage campaigns"
  on campaigns for all using (is_internal_user());

-- Campaigns: customers see their own
create policy "Customers see own campaigns"
  on campaigns for select using (account_id = user_account_id());

-- Campaign events: internal full access
create policy "Internal manage campaign events"
  on campaign_events for all using (is_internal_user());

-- Campaign events: customers see events in their campaigns
create policy "Customers see own campaign events"
  on campaign_events for select using (
    campaign_id in (select id from campaigns where account_id = user_account_id())
  );

-- Recommendations: internal manages
create policy "Internal manage recommendations"
  on recommendations for all using (is_internal_user());

-- Recommendations: public reads
create policy "Public read recommendations"
  on recommendations for select using (true);

-- API keys: internal manages all
create policy "Internal manage api keys"
  on api_keys for all using (is_internal_user());

-- API keys: account owners manage their own
create policy "Account owners manage own api keys"
  on api_keys for all using (account_id = user_account_id());

-- API keys: partner members manage their partner's keys
create policy "Partners manage own api keys"
  on api_keys for all using (partner_id = user_partner_id());

-- Webhook subscriptions: internal manages all
create policy "Internal manage webhooks"
  on webhook_subscriptions for all using (is_internal_user());

-- Webhook subscriptions: account owners manage their own
create policy "Account owners manage own webhooks"
  on webhook_subscriptions for all using (account_id = user_account_id());

-- Webhook subscriptions: partner members manage their partner's webhooks
create policy "Partners manage own webhooks"
  on webhook_subscriptions for all using (partner_id = user_partner_id());

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on campaigns
  for each row execute function update_updated_at();

create trigger set_updated_at before update on recommendations
  for each row execute function update_updated_at();
