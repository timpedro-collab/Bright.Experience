-- Partner pricing microsites (`/pp/:slug`).
--
-- One row per capability-URL deal page. The unguessable `slug` is the
-- credential; public reads go through the service-role client keyed by slug
-- (same model as event_reports.share_token). Internal staff manage pages
-- from the admin surface; there is deliberately no anon/public RLS policy.

create table if not exists public.partner_pricing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  partner_name text not null,
  show_label text not null,
  status text not null default 'live'
    check (status in ('draft', 'live', 'revoked')),
  template text not null default 'generic'
    check (template in ('generic', 'nrs')),
  config jsonb not null default '{}'::jsonb,
  hero jsonb not null default '{}'::jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.partner_pricing_pages is
  'Capability-URL partner pricing microsites. Service-role reads by slug; internal-only RLS.';

create index if not exists idx_partner_pricing_pages_created_by
  on public.partner_pricing_pages (created_by);

alter table public.partner_pricing_pages enable row level security;

drop policy if exists "Internal read" on public.partner_pricing_pages;
create policy "Internal read" on public.partner_pricing_pages
  for select using (public.is_internal_user());

drop policy if exists "Internal manage" on public.partner_pricing_pages;
create policy "Internal manage" on public.partner_pricing_pages
  for all using (public.is_internal_user())
  with check (public.is_internal_user());

create trigger set_updated_at before update on public.partner_pricing_pages
  for each row execute function update_updated_at();

-- Seed the live NRS page so `/pp/nrs-europa-4e9d1c7a2b86` keeps working
-- when the app switches from the hardcoded registry to DB lookups.
insert into public.partner_pricing_pages (
  slug,
  partner_name,
  show_label,
  status,
  template,
  config,
  hero
) values (
  'nrs-europa-4e9d1c7a2b86',
  'Informa Connect',
  'National Restaurant Show, Chicago',
  'live',
  'nrs',
  '{
    "currency": "USD",
    "split": {"brightBlue": 0.7, "partner": 0.3},
    "commitment": {"pilotMinUnits": 12, "pilotMaxUnits": 15, "maxUnits": 50, "cutoffWeeks": 25},
    "levers": [
      {"key": "single", "label": "Single-unit placements", "unitsPerItem": 1, "retail": {"min": 45000, "max": 70000, "suggested": 50000, "step": 1000}},
      {"key": "takeover", "label": "Cross-Hall Takeover bundles (3 units each)", "unitsPerItem": 3, "maxItems": 3, "retail": {"min": 110000, "max": 175000, "suggested": 120000, "step": 5000}},
      {"key": "corridor", "label": "Corridor placements", "unitsPerItem": 1, "maxItems": 4, "retail": {"min": 25000, "max": 40000, "suggested": 30000, "step": 1000}}
    ],
    "floorTiers": [
      {"label": "Pilot", "minUnits": 1, "maxUnits": 15, "floor": 15000},
      {"label": "Scale", "minUnits": 16, "maxUnits": 30, "floor": 13500},
      {"label": "Portfolio", "minUnits": 31, "maxUnits": 50, "floor": 12000}
    ]
  }'::jsonb,
  '{}'::jsonb
)
on conflict (slug) do nothing;

-- Rollback: drop table public.partner_pricing_pages cascade;
