-- Workstream 6: Game and Product Configuration Portal
-- Structured tables replacing email-based config for prizes, form fields,
-- game parameters, and product/sampling setup.

create table if not exists game_configurations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  game_id uuid references games(id),
  prize_mode text not null default 'random' check (prize_mode in ('random', 'score_based', 'guaranteed')),
  prizes_json jsonb not null default '[]',
  form_fields_json jsonb not null default '[]',
  include_score_in_export boolean default false,
  leaderboard_enabled boolean default false,
  game_parameters_json jsonb not null default '{}',
  idle_screen_config_json jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'configured', 'tested')),
  submitted_by uuid references profiles(id),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_game_config_event on game_configurations(event_id);

create table if not exists product_configurations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  products_json jsonb not null default '[]',
  total_units integer,
  samples_received_at timestamptz,
  samples_tested boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_product_config_event on product_configurations(event_id);
