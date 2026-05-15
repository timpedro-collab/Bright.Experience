-- ============================================================
-- Phase 3: Two-Track Quoting Engine
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table quotes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id),
  partner_id uuid,
  track text not null check (track in ('standard', 'proposal')),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'preparing', 'delivered', 'accepted', 'expired', 'declined')),
  event_type text,
  location_postcode text,
  location_name text,
  location_tier text check (location_tier in ('tier_1', 'tier_2', 'tier_3', 'tier_4')),
  venue_name text,
  dates_start date,
  dates_end date,
  duration_days integer,
  footfall_estimate integer,
  objective text,
  machine_id uuid references machines(id),
  game_id uuid references games(id),
  package_id uuid references packages(id),
  creative_needs text,
  budget_indication text,
  special_requirements text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  company_name text,
  valid_until timestamptz,
  proposal_notes text,
  outcome_estimates_json jsonb default '{}',
  prepared_by uuid references profiles(id),
  prepared_at timestamptz,
  accepted_at timestamptz,
  expired_at timestamptz,
  event_id uuid references events(id),
  total_amount integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table quote_line_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  label text not null,
  description text,
  amount integer,
  category text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table locations (
  postcode_prefix text primary key,
  tier text not null check (tier in ('tier_1', 'tier_2', 'tier_3', 'tier_4')),
  name text,
  region text,
  footfall_index numeric,
  media_value_multiplier numeric default 1.0,
  notes text,
  updated_at timestamptz default now()
);

create table prospect_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  contact_email text,
  quote_id uuid references quotes(id),
  created_at timestamptz default now(),
  converted_at timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_quotes_account_id on quotes(account_id);
create index idx_quotes_status on quotes(status);
create index idx_quotes_track on quotes(track);
create index idx_quotes_machine_id on quotes(machine_id);
create index idx_quotes_game_id on quotes(game_id);
create index idx_quotes_package_id on quotes(package_id);
create index idx_quotes_prepared_by on quotes(prepared_by);
create index idx_quotes_event_id on quotes(event_id);
create index idx_quote_line_items_quote_id on quote_line_items(quote_id);
create index idx_prospect_sessions_quote_id on prospect_sessions(quote_id);
create index idx_prospect_sessions_token on prospect_sessions(session_token);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table quotes enable row level security;
alter table quote_line_items enable row level security;
alter table locations enable row level security;
alter table prospect_sessions enable row level security;

-- Quotes: customers see own via account_id
create policy "Customers see own quotes"
  on quotes for select using (
    account_id = user_account_id()
  );

-- Quotes: internal see all
create policy "Internal see all quotes"
  on quotes for select using (is_internal_user());

-- Quotes: internal manage all
create policy "Internal manage quotes"
  on quotes for all using (is_internal_user());

-- Quotes: public can insert (prospect submissions)
create policy "Public can submit quotes"
  on quotes for insert with check (true);

-- Quote line items: customers see own (via quote relationship)
create policy "Customers see own quote line items"
  on quote_line_items for select using (
    quote_id in (select id from quotes where account_id = user_account_id())
  );

-- Quote line items: internal see all
create policy "Internal see all quote line items"
  on quote_line_items for select using (is_internal_user());

-- Quote line items: internal manage all
create policy "Internal manage quote line items"
  on quote_line_items for all using (is_internal_user());

-- Locations: internal only
create policy "Internal read locations"
  on locations for select using (is_internal_user());

create policy "Internal manage locations"
  on locations for all using (is_internal_user());

-- Prospect sessions: internal see all
create policy "Internal see all prospect sessions"
  on prospect_sessions for select using (is_internal_user());

-- Prospect sessions: public can insert
create policy "Public can create prospect sessions"
  on prospect_sessions for insert with check (true);

-- Prospect sessions: public can read own (by session_token match)
create policy "Public read own prospect session"
  on prospect_sessions for select using (true);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on quotes
  for each row execute function update_updated_at();

create trigger set_updated_at before update on locations
  for each row execute function update_updated_at();
