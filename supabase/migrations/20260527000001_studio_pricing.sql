-- Studio pricing tiers — replaces hardcoded STATIC_TIERS / VIDEO_TIERS in the app.
-- Covers both "design" (static) and "animation" (motion) service types.

create table studio_pricing (
  id uuid primary key default gen_random_uuid(),
  service_type text not null check (service_type in ('design', 'animation')),
  tier_name text not null,
  description text,
  price_gbp numeric(10, 2) not null,
  price_label text not null,
  price_unit text not null default 'Per Asset',
  features text[] not null default '{}',
  turnaround_days int,
  revisions_included int,
  is_express boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table studio_pricing enable row level security;

create policy "studio_pricing_public_read"
  on studio_pricing for select using (true);

create policy "studio_pricing_internal_insert"
  on studio_pricing for insert
  with check (auth.jwt() ->> 'user_role' in ('admin', 'creative_lead'));

create policy "studio_pricing_internal_update"
  on studio_pricing for update
  using (auth.jwt() ->> 'user_role' in ('admin', 'creative_lead'));

create index idx_studio_pricing_service_type on studio_pricing(service_type, sort_order);

-- Seed: Static (design) tiers
insert into studio_pricing (service_type, tier_name, description, price_gbp, price_label, price_unit, features, is_featured, sort_order) values
  ('design', 'Essential Enhancements', 'Meets minimum asset standards', 32.00, '£32', 'Per Asset',
   array['Aspect Ratio Correction', 'Size Compression', 'Background Removal', 'Colour Matching'],
   false, 1),
  ('design', 'Professional Enhancements', 'Transforms assets with expert detail', 72.00, '£72', 'Per Asset',
   array['All in Essential', 'Quality Boost', 'Layout Adjustments', 'Web Asset Sourcing', 'Web Asset Adaptation'],
   true, 2),
  ('design', 'New Asset Creation', 'Original assets from the ground up', 120.00, '£120', 'Per Asset',
   array['All in Professional', 'Concept Development', 'Custom Graphics', 'Brand Alignment', 'Original Layouts', 'Multi-Format Delivery'],
   false, 3);

-- Seed: Motion (animation) tiers
insert into studio_pricing (service_type, tier_name, description, price_gbp, price_label, price_unit, features, is_featured, sort_order) values
  ('animation', 'Essential Enhancements', 'Meets minimum motion standards', 160.00, '£160', 'Per Asset',
   array['Format Conversion', 'Duration Trimming', 'Resolution Adjustment', 'Basic Colour Correction'],
   false, 1),
  ('animation', 'Professional Enhancements', 'Elevates existing motion assets', 480.00, '£480', 'Per Asset',
   array['All in Essential', 'Transition Effects', 'Audio Sync', 'Text Overlay', 'Branded Elements'],
   true, 2),
  ('animation', 'New Asset Creation', 'Original motion from the ground up', 1080.00, '£1,080', 'Per Asset',
   array['All in Professional', 'Concept Development', 'Custom Animation', 'Brand Alignment', 'Original Sequences', 'Multi-Format Delivery'],
   false, 3);
