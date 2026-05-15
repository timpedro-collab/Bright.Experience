-- ============================================================
-- Phase 7: Venue & Runway Module
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table venues (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references partners(id) on delete set null,
  name text not null,
  slug text not null unique,
  address text,
  postcode text,
  location_tier text,
  capacity int,
  venue_type text check (venue_type in ('convention_centre', 'shopping_centre', 'hotel', 'arena', 'other')),
  contact_info_json jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table placements (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  machine_instance_id uuid references machine_instances(id) on delete set null,
  start_date date not null,
  end_date date,
  status text not null default 'planned' check (status in ('planned', 'active', 'completed', 'cancelled')),
  pricing_model_json jsonb default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table sponsorship_slots (
  id uuid primary key default gen_random_uuid(),
  placement_id uuid not null references placements(id) on delete cascade,
  sponsor_account_id uuid references profiles(id) on delete set null,
  start_date date not null,
  end_date date not null,
  price numeric,
  status text not null default 'available' check (status in ('available', 'reserved', 'active', 'completed')),
  creative_asset_ids jsonb default '[]',
  game_config_json jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table venue_packages (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  includes_bright_blue boolean default false,
  bright_blue_package_id uuid references packages(id) on delete set null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_venues_slug on venues(slug);
create index idx_venues_partner on venues(partner_id);
create index idx_venues_postcode on venues(postcode);
create index idx_venues_active on venues(is_active);

create index idx_placements_venue on placements(venue_id);
create index idx_placements_machine on placements(machine_instance_id);
create index idx_placements_status on placements(status);
create index idx_placements_dates on placements(start_date, end_date);

create index idx_sponsorship_slots_placement on sponsorship_slots(placement_id);
create index idx_sponsorship_slots_status on sponsorship_slots(status);
create index idx_sponsorship_slots_dates on sponsorship_slots(start_date, end_date);

create index idx_venue_packages_venue on venue_packages(venue_id);
create index idx_venue_packages_sort on venue_packages(sort_order);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table venues enable row level security;
alter table placements enable row level security;
alter table sponsorship_slots enable row level security;
alter table venue_packages enable row level security;

-- Venues: internal full access
create policy "Internal see all venues"
  on venues for select using (is_internal_user());

create policy "Internal manage venues"
  on venues for all using (is_internal_user());

-- Venues: partner users see their own venues
create policy "Partner users see own venues"
  on venues for select using (partner_id = user_partner_id());

create policy "Partner users manage own venues"
  on venues for update using (partner_id = user_partner_id());

-- Placements: internal full access
create policy "Internal see all placements"
  on placements for select using (is_internal_user());

create policy "Internal manage placements"
  on placements for all using (is_internal_user());

-- Placements: partner users see placements at their venues
create policy "Partner users see own placements"
  on placements for select using (
    venue_id in (select id from venues where partner_id = user_partner_id())
  );

create policy "Partner users manage own placements"
  on placements for update using (
    venue_id in (select id from venues where partner_id = user_partner_id())
  );

-- Sponsorship slots: internal full access
create policy "Internal see all sponsorship slots"
  on sponsorship_slots for select using (is_internal_user());

create policy "Internal manage sponsorship slots"
  on sponsorship_slots for all using (is_internal_user());

-- Sponsorship slots: partner users see slots on their placements
create policy "Partner users see own sponsorship slots"
  on sponsorship_slots for select using (
    placement_id in (
      select p.id from placements p
      join venues v on v.id = p.venue_id
      where v.partner_id = user_partner_id()
    )
  );

-- Venue packages: internal full access
create policy "Internal see all venue packages"
  on venue_packages for select using (is_internal_user());

create policy "Internal manage venue packages"
  on venue_packages for all using (is_internal_user());

-- Venue packages: partner users manage their own venue packages
create policy "Partner users see own venue packages"
  on venue_packages for select using (
    venue_id in (select id from venues where partner_id = user_partner_id())
  );

create policy "Partner users manage own venue packages"
  on venue_packages for all using (
    venue_id in (select id from venues where partner_id = user_partner_id())
  );

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on venues
  for each row execute function update_updated_at();

create trigger set_updated_at before update on placements
  for each row execute function update_updated_at();

create trigger set_updated_at before update on sponsorship_slots
  for each row execute function update_updated_at();
