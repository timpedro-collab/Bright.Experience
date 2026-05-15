-- ============================================================
-- Bright.Experience — Phase 2: Game Catalog & Public Storefront
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  specs_json jsonb not null default '{}',
  dimensions text,
  hero_image_url text,
  gallery_urls jsonb not null default '[]',
  video_url text,
  capabilities jsonb not null default '[]',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  preview_video_url text,
  thumbnail_url text,
  suitable_for jsonb not null default '[]',
  category text,
  objectives jsonb not null default '[]',
  crowd_guidance text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table machine_games (
  machine_id uuid not null references machines(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  primary key (machine_id, game_id)
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  machine_id uuid references machines(id),
  tier text not null,
  base_price integer,
  duration_days integer,
  features_json jsonb not null default '[]',
  is_bookable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table package_addons (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references packages(id) on delete cascade,
  name text not null,
  description text,
  price integer,
  category text,
  created_at timestamptz default now()
);

create table case_studies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  client_name text,
  event_type text,
  location text,
  description text,
  hero_image_url text,
  gallery_urls jsonb not null default '[]',
  stats_json jsonb not null default '{}',
  testimonial_quote text,
  testimonial_author text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_machines_slug on machines(slug);
create index idx_machines_is_active on machines(is_active);
create index idx_machines_sort_order on machines(sort_order);

create index idx_games_slug on games(slug);
create index idx_games_is_active on games(is_active);
create index idx_games_sort_order on games(sort_order);
create index idx_games_category on games(category);

create index idx_machine_games_game_id on machine_games(game_id);

create index idx_packages_slug on packages(slug);
create index idx_packages_machine_id on packages(machine_id);
create index idx_packages_tier on packages(tier);
create index idx_packages_is_bookable on packages(is_bookable);
create index idx_packages_sort_order on packages(sort_order);

create index idx_package_addons_package_id on package_addons(package_id);
create index idx_package_addons_category on package_addons(category);

create index idx_case_studies_slug on case_studies(slug);
create index idx_case_studies_is_published on case_studies(is_published);
create index idx_case_studies_event_type on case_studies(event_type);

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

alter table machines enable row level security;
alter table games enable row level security;
alter table machine_games enable row level security;
alter table packages enable row level security;
alter table package_addons enable row level security;
alter table case_studies enable row level security;

-- machines: public read for active, internal-only write
create policy "machines_public_read"
  on machines for select
  using (is_active = true);

create policy "machines_internal_read_all"
  on machines for select
  using (is_internal_user());

create policy "machines_internal_insert"
  on machines for insert
  with check (is_internal_user());

create policy "machines_internal_update"
  on machines for update
  using (is_internal_user());

create policy "machines_internal_delete"
  on machines for delete
  using (is_internal_user());

-- games: public read for active, internal-only write
create policy "games_public_read"
  on games for select
  using (is_active = true);

create policy "games_internal_read_all"
  on games for select
  using (is_internal_user());

create policy "games_internal_insert"
  on games for insert
  with check (is_internal_user());

create policy "games_internal_update"
  on games for update
  using (is_internal_user());

create policy "games_internal_delete"
  on games for delete
  using (is_internal_user());

-- machine_games: public read, internal-only write
create policy "machine_games_public_read"
  on machine_games for select
  using (true);

create policy "machine_games_internal_insert"
  on machine_games for insert
  with check (is_internal_user());

create policy "machine_games_internal_delete"
  on machine_games for delete
  using (is_internal_user());

-- packages: public read for bookable, internal-only write
create policy "packages_public_read"
  on packages for select
  using (is_bookable = true);

create policy "packages_internal_read_all"
  on packages for select
  using (is_internal_user());

create policy "packages_internal_insert"
  on packages for insert
  with check (is_internal_user());

create policy "packages_internal_update"
  on packages for update
  using (is_internal_user());

create policy "packages_internal_delete"
  on packages for delete
  using (is_internal_user());

-- package_addons: public read, internal-only write
create policy "package_addons_public_read"
  on package_addons for select
  using (true);

create policy "package_addons_internal_insert"
  on package_addons for insert
  with check (is_internal_user());

create policy "package_addons_internal_update"
  on package_addons for update
  using (is_internal_user());

create policy "package_addons_internal_delete"
  on package_addons for delete
  using (is_internal_user());

-- case_studies: public read for published, internal-only write
create policy "case_studies_public_read"
  on case_studies for select
  using (is_published = true);

create policy "case_studies_internal_read_all"
  on case_studies for select
  using (is_internal_user());

create policy "case_studies_internal_insert"
  on case_studies for insert
  with check (is_internal_user());

create policy "case_studies_internal_update"
  on case_studies for update
  using (is_internal_user());

create policy "case_studies_internal_delete"
  on case_studies for delete
  using (is_internal_user());

-- ============================================================
-- STORAGE: catalog-media bucket (public)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('catalog-media', 'catalog-media', true)
on conflict (id) do nothing;

create policy "catalog_media_public_read"
  on storage.objects for select
  using (bucket_id = 'catalog-media');

create policy "catalog_media_internal_insert"
  on storage.objects for insert
  with check (bucket_id = 'catalog-media' and is_internal_user());

create policy "catalog_media_internal_update"
  on storage.objects for update
  using (bucket_id = 'catalog-media' and is_internal_user());

create policy "catalog_media_internal_delete"
  on storage.objects for delete
  using (bucket_id = 'catalog-media' and is_internal_user());
