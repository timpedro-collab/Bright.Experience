-- ============================================================
-- Phase 6: Partner & Reseller Portal
-- ============================================================

-- ============================================================
-- ENUM EXTENSIONS
-- ============================================================

alter type user_role add value if not exists 'partner_member';
alter type user_role add value if not exists 'partner_admin';

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

create or replace function user_partner_id() returns uuid as $$
  select partner_id from partner_users where profile_id = auth.uid() limit 1;
$$ language sql security definer stable;

-- ============================================================
-- TABLES
-- ============================================================

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null check (type in ('reseller', 'venue', 'agency')),
  contact_name text,
  contact_email text,
  logo_url text,
  brand_color text,
  partner_code text unique not null,
  commission_model_json jsonb default '{}',
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'inactive')),
  onboarded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table partner_users (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz default now(),
  unique (partner_id, profile_id)
);

create table partner_attributions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  commission_amount numeric,
  commission_status text not null default 'pending' check (commission_status in ('pending', 'approved', 'paid')),
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_partners_slug on partners(slug);
create index idx_partners_code on partners(partner_code);
create index idx_partners_status on partners(status);
create index idx_partners_type on partners(type);
create index idx_partner_users_partner on partner_users(partner_id);
create index idx_partner_users_profile on partner_users(profile_id);
create index idx_partner_attributions_partner on partner_attributions(partner_id);
create index idx_partner_attributions_status on partner_attributions(commission_status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table partners enable row level security;
alter table partner_users enable row level security;
alter table partner_attributions enable row level security;

-- Partners: internal sees all
create policy "Internal see all partners"
  on partners for select using (is_internal_user());

create policy "Internal manage partners"
  on partners for all using (is_internal_user());

-- Partners: partner members see their own partner
create policy "Partner members see own partner"
  on partners for select using (id = user_partner_id());

-- Partners: public can insert (partner applications)
create policy "Public can apply as partner"
  on partners for insert with check (true);

-- Partner users: internal sees all
create policy "Internal see all partner users"
  on partner_users for select using (is_internal_user());

create policy "Internal manage partner users"
  on partner_users for all using (is_internal_user());

-- Partner users: users see their own partner_users rows
create policy "Users see own partner membership"
  on partner_users for select using (profile_id = auth.uid());

-- Partner attributions: internal sees all
create policy "Internal see all attributions"
  on partner_attributions for select using (is_internal_user());

create policy "Internal manage attributions"
  on partner_attributions for all using (is_internal_user());

-- Partner attributions: partner members see their own partner's attributions
create policy "Partner members see own attributions"
  on partner_attributions for select using (partner_id = user_partner_id());

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at before update on partners
  for each row execute function update_updated_at();

create trigger set_updated_at before update on partner_attributions
  for each row execute function update_updated_at();

-- ============================================================
-- FK: link quotes.partner_id to partners table
-- ============================================================

-- The quotes table already has a partner_id column (Phase 3).
-- Add the foreign key constraint now that the partners table exists.
alter table quotes
  add constraint fk_quotes_partner
  foreign key (partner_id) references partners(id) on delete set null;
