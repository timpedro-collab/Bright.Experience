-- ============================================================
-- Bright.Experience — Seed Data
-- ============================================================
-- This seed gives every UI surface real data to render against:
--   - 3 customer accounts and 5 personas (1 customer, 4 internal)
--   - 5 events spanning every lifecycle stage
--   - Catalog of 4 machines, 6 games, 5 packages, 9 add-ons, 4 case
--     studies
--   - 8 UK locations covering tiers 1-4
--   - 2 partners (1 reseller, 1 venue) + their users
--   - 2 venues with placements, sponsorship slots and venue packages
--   - 6 telemetry events, 3 leads, 1 metrics snapshot for the live
--     dashboard demo
--   - 2 event reports (1 draft, 1 shareable)
--   - 4 benchmarks for the recommendations + reports surfaces
--   - 1 studio request, briefings + QA items + logistics for evt-1
--
-- Auth users must be created separately via the auth admin API
-- (see seed-users.ts). This seed references those UUIDs.
--
-- All inserts are idempotent (`on conflict do nothing`) so the seed
-- can be re-applied without crashing on re-runs.
-- ============================================================

-- ============================================================
-- ACCOUNTS
-- ============================================================
insert into accounts (id, name, slug) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola UK', 'coca-cola-uk'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Electronics', 'samsung'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Diageo', 'diageo')
on conflict (id) do nothing;

-- ============================================================
-- PROFILES (inserted after auth users via seed-users.ts)
-- ============================================================
insert into profiles (id, name, email, role, account_id) values
  ('11111111-1111-1111-1111-111111111111', 'Sarah Mitchell', 'sarah@brightblue.co.uk', 'events_lead', null),
  ('22222222-2222-2222-2222-222222222222', 'James Chen', 'james.chen@cocacola.com', 'customer_admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('33333333-3333-3333-3333-333333333333', 'Emma Wright', 'emma@brightblue.co.uk', 'creative_lead', null),
  ('44444444-4444-4444-4444-444444444444', 'Tom Parker', 'tom@brightblue.co.uk', 'operations_lead', null),
  ('55555555-5555-5555-5555-555555555555', 'Alex Rivera', 'alex@brightblue.co.uk', 'qa_lead', null)
on conflict (id) do nothing;

-- ============================================================
-- CATALOG: machines
-- ============================================================
insert into machines (id, name, slug, tagline, description, hero_image_url, video_url, is_active, sort_order) values
  ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'Experience Portal Compact', 'experience-portal-compact',
    'The compact gifting kiosk',
    'A smaller-footprint Experience Portal with single-pull dispense, designed for high-frequency sampling moments at retail, transport hubs, and festivals. Same game engine, same lead capture — just smaller.',
    '/catalog/experience-portal-compact-hero.jpg', null, true, 1),
  ('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'Experience Portal', 'experience-portal',
    'The standard activation unit',
    'The Europa — a 55" portrait touchscreen wrapped in a fully branded shell, with built-in lead capture, prize dispensing, and Bright.Blue''s entire game engine. The machine behind the majority of Bright.Blue activations. Compact enough for retail, powerful enough for stadiums.',
    '/catalog/experience-portal-hero.jpg', null, true, 2),
  ('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'Experience Portal XL', 'experience-portal-xl',
    'The large-format interactive experience',
    'Full-body interactive experience cabinet with a 65" landscape display, capacitive touch, RFID, and Bright.Blue''s game engine. Built for activations where presence and scale matter.',
    '/catalog/experience-portal-xl-hero.jpg', null, true, 3),
  ('a4a4a4a4-a4a4-4a4a-8a4a-a4a4a4a4a4a4', 'Experience Portal Studio', 'experience-portal-studio',
    'Bespoke creative + content',
    'The Bright.Blue studio team — design, animation, video, and photography — packaged as bookable creative capacity alongside any hardware activation.',
    '/catalog/experience-portal-studio-hero.jpg', null, true, 4)
on conflict (id) do nothing;

-- ============================================================
-- CATALOG: games
-- ============================================================
insert into games (id, name, slug, description, category, suitable_for, objectives, crowd_guidance, is_active, sort_order) values
  ('b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1', 'Tap to Win', 'tap-to-win',
    'Single-tap arcade game with timed bonus rounds — the highest-converting game in our catalogue.',
    'arcade', '["sampling","activation"]'::jsonb,
    '["lead_capture","brand_lift","footfall"]'::jsonb,
    'High-traffic, low-dwell. Targets 6-12 second sessions.', true, 1),
  ('b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2', 'Spin & Reveal', 'spin-and-reveal',
    'Wheel-of-fortune mechanic with branded prize tiles. Pairs well with sampling.',
    'casino', '["sampling","vending"]'::jsonb,
    '["sampling","trial","loyalty"]'::jsonb,
    'Crowd-pleaser. 90-second loop time including dispense.', true, 2),
  ('b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3', 'Memory Match', 'memory-match',
    'Pair-matching memory game with brand-themed tiles. Higher dwell time.',
    'puzzle', '["activation","education"]'::jsonb,
    '["education","engagement","share-of-voice"]'::jsonb,
    'Lower throughput, higher engagement. Best for media-rich activations.', true, 3),
  ('b4b4b4b4-b4b4-4b4b-8b4b-b4b4b4b4b4b4', 'Crowd Pulse', 'crowd-pulse',
    'Real-time audience response across multiple screens — for stage moments.',
    'crowd', '["activation","stage"]'::jsonb,
    '["share-of-voice","social","viral"]'::jsonb,
    'Stage-driven. Needs a host. Scales to 5,000+ participants.', true, 4),
  ('b5b5b5b5-b5b5-4b5b-8b5b-b5b5b5b5b5b5', 'Photo Booth Pro', 'photo-booth-pro',
    'AR-overlay photo + video booth with instant social share.',
    'photo', '["activation","social"]'::jsonb,
    '["social","ugc","brand_lift"]'::jsonb,
    'Dwell 30-60s. Highest social share rate of all games.', true, 5),
  ('b6b6b6b6-b6b6-4b6b-8b6b-b6b6b6b6b6b6', 'Quick Quiz', 'quick-quiz',
    'Branded knowledge test with lead-capture gating.',
    'quiz', '["education","retail"]'::jsonb,
    '["lead_capture","education","conversion"]'::jsonb,
    'Sub-90s sessions. Good for lead farms.', true, 6)
on conflict (id) do nothing;

-- ============================================================
-- CATALOG: machine_games (compatibility matrix)
-- ============================================================
insert into machine_games (machine_id, game_id) values
  ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1'),
  ('a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2'),
  ('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1'),
  ('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'b2b2b2b2-b2b2-4b2b-8b2b-b2b2b2b2b2b2'),
  ('a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3'),
  ('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'b3b3b3b3-b3b3-4b3b-8b3b-b3b3b3b3b3b3'),
  ('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'b4b4b4b4-b4b4-4b4b-8b4b-b4b4b4b4b4b4'),
  ('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'b5b5b5b5-b5b5-4b5b-8b5b-b5b5b5b5b5b5'),
  ('a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'b6b6b6b6-b6b6-4b6b-8b6b-b6b6b6b6b6b6')
on conflict do nothing;

-- ============================================================
-- CATALOG: packages
-- ============================================================
insert into packages (id, name, slug, description, machine_id, tier, base_price, duration_days, features_json, is_bookable, sort_order) values
  ('c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1', 'Bright.Vend — Single Day', 'bright-vend-single-day',
    'A one-day sampling activation with the compact Bright.Vend kiosk. Includes setup, takedown, and a same-day metrics handover.',
    'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1', 'standard', 350000, 1,
    '["setup_and_takedown","onsite_brand_ambassador","real_time_dashboard","next_day_report"]'::jsonb,
    true, 1),
  ('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', 'Bright.Vend Pro — Weekend', 'bright-vend-pro-weekend',
    'Friday-through-Sunday with the full Bright.Vend Pro machine, branded wrap, two ambassadors and post-event report.',
    'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'standard', 950000, 3,
    '["setup_and_takedown","two_ambassadors","branded_wrap","real_time_dashboard","post_event_report"]'::jsonb,
    true, 2),
  ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'Bright.Play — Five-Day Activation', 'bright-play-five-day',
    'Five days of interactive gameplay. Full creative production, two on-site ops, live event dashboard.',
    'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'premium', 2500000, 5,
    '["full_creative_production","two_ops","live_event_dashboard","custom_game_logic","post_event_report"]'::jsonb,
    true, 3),
  ('c4c4c4c4-c4c4-4c4c-8c4c-c4c4c4c4c4c4', 'Bright.Play — Tour Edition (10 cities)', 'bright-play-tour',
    'Ten-city tour over six weeks. Travel, logistics, dedicated AE, and a tour-wide intelligence report.',
    'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'premium', 9500000, 42,
    '["tour_logistics","dedicated_ae","cross_market_intelligence","interim_reports","executive_summary"]'::jsonb,
    true, 4),
  ('c5c5c5c5-c5c5-4c5c-8c5c-c5c5c5c5c5c5', 'Bespoke', 'bespoke',
    'A custom proposal sized to your event. Pricing is set after a discovery call.',
    null, 'custom', null, null,
    '["discovery_call","tailored_creative","custom_capacity","bespoke_reporting"]'::jsonb,
    true, 5)
on conflict (id) do nothing;

-- ============================================================
-- CATALOG: package_addons (canonical capability slugs)
-- ============================================================
insert into package_addons (package_id, name, description, price, category, capability_slug) values
  ('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', 'Live telemetry dashboard',     'Live read of leads, plays, conversions during the event.',          50000,  'reporting',     'live-telemetry'),
  ('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', 'Sampling unlock',              'Physical sample dispenses when the player wins.',                  85000,  'mechanics',     'sampling-unlock'),
  ('c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2', 'App / store download QR',     'Final-screen QR pushing players to your app or product page.',     35000,  'mechanics',     'app-qr-drive'),
  ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'LinkedIn follow gate',         'B2B-friendly follow-to-play gate at game start.',                  45000,  'mechanics',     'linkedin-follow'),
  ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'Survey layer',                 'Lightweight survey layer collecting brand-lift data.',             60000,  'mechanics',     'survey-layer'),
  ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'Voucher redemption',           'Branded vouchers with redemption tracking.',                       55000,  'mechanics',     'voucher-redemption'),
  ('c3c3c3c3-c3c3-4c3c-8c3c-c3c3c3c3c3c3', 'Dynamic sponsors',             'Multi-sponsor rotation throughout the event.',                     75000,  'mechanics',     'dynamic-sponsors'),
  ('c4c4c4c4-c4c4-4c4c-8c4c-c4c4c4c4c4c4', 'Age verification',             'ID-based age verification for restricted brands.',                 65000,  'compliance',    'age-verification'),
  ('c4c4c4c4-c4c4-4c4c-8c4c-c4c4c4c4c4c4', 'On-unit payments',             'Take card payments on the unit directly.',                         70000,  'commercial',    'payments-onunit');

-- ============================================================
-- CATALOG: case_studies
-- ============================================================
insert into case_studies (id, title, slug, client_name, event_type, location, description, hero_image_url, stats_json, testimonial_quote, testimonial_author, is_published, published_at) values
  ('d1d1d1d1-d1d1-4d1d-8d1d-d1d1d1d1d1d1', 'How Coca-Cola scaled summer sampling across 12 cities', 'coca-cola-summer-tour',
    'Coca-Cola UK', 'sampling', 'UK',
    'A 12-city sampling tour using Bright.Vend Pro. 124,000 samples, 38% opt-in to lead capture, 4.7 / 5 NPS.',
    '/case-studies/coca-cola-hero.jpg',
    '{"samples":124000,"leadOptInPct":38,"npsScore":4.7,"cities":12}'::jsonb,
    'The fastest sampling activation we''ve ever run.', 'James Chen, Coca-Cola UK',
    true, '2026-01-15T10:00:00Z'),
  ('d2d2d2d2-d2d2-4d2d-8d2d-d2d2d2d2d2d2', 'Samsung Galaxy launch: an interactive activation', 'samsung-galaxy-launch',
    'Samsung Electronics', 'activation', 'London',
    'Five-day flagship launch at Westfield London. Bright.Play with custom creative, 18,000 plays, 6,200 leads.',
    '/case-studies/samsung-hero.jpg',
    '{"plays":18000,"leads":6200,"avgDwellSec":52}'::jsonb,
    'The most engagement we''ve had from any launch activation.', 'Aisha Khan, Samsung',
    true, '2026-02-08T10:00:00Z'),
  ('d3d3d3d3-d3d3-4d3d-8d3d-d3d3d3d3d3d3', 'Guinness Six Nations fan zone', 'guinness-six-nations-fan-zone',
    'Diageo', 'sampling', 'Twickenham',
    'Three match days at Twickenham. 22,000 samples, 12,000 prize redemptions, 41 unique sponsor activations.',
    '/case-studies/guinness-hero.jpg',
    '{"samples":22000,"prizeRedemptions":12000,"sponsorActivations":41}'::jsonb,
    'Brings the energy of the matchday into the bar.', 'Mike O''Donnell, Diageo',
    true, '2026-02-22T10:00:00Z'),
  ('d5d5d5d5-d5d5-4d5d-8d5d-d5d5d5d5d5d5', 'How Storyblok made their DMEXCO booth a magnet', 'storyblok-dmexco',
    'Storyblok', 'exhibition', 'Cologne',
    'An interactive Experience Portal on the Storyblok stand at DMEXCO — a fun, branded moment that doubled as automatic, high-quality data capture.',
    '/case-studies/storyblok-hero.jpg',
    '{"plays":4200,"leads":1100,"avgDwellSec":48}'::jsonb,
    'Bright.Blue brought our DMEXCO booth to life. The interactive machine became a magnet for attendees, giving us both a fun experience and high-quality data — automatically.', 'Ioana Grapa, Head of Global Events, Storyblok',
    true, '2026-03-05T10:00:00Z'),
  ('d6d6d6d6-d6d6-4d6d-8d6d-d6d6d6d6d6d6', 'Adyen''s event gifting that ran itself', 'adyen-event-gifting',
    'Adyen', 'corporate', 'London',
    'A fully customised, unattended Experience Portal vending branded gifts across an Adyen business event — delivery, setup, and restocking all handled by Bright.Blue.',
    '/case-studies/adyen-hero.jpg',
    '{"giftsVended":1800,"interactions":3400,"satisfactionPct":97}'::jsonb,
    'We vended gifts from their unattended machine and saw fantastic attendee engagement. The team handled everything from delivery and setup to restocking — it let me focus on the event itself.', 'Brigitte Brown, Senior Event Marketing Manager, Adyen',
    true, '2026-03-18T10:00:00Z'),
  ('d4d4d4d4-d4d4-4d4d-8d4d-d4d4d4d4d4d4', 'Internal draft (do not publish)', 'draft-do-not-publish',
    null, 'activation', null,
    'Draft case study, used to test the publishing flow.',
    null, '{}'::jsonb, null, null,
    false, null)
on conflict (id) do nothing;

-- ============================================================
-- LOCATIONS (UK postcode prefix → tier mapping)
-- ============================================================
insert into locations (postcode_prefix, tier, name, region, footfall_index, media_value_multiplier, notes) values
  ('W1',  'tier_1', 'Central London — West End',    'London',      9.2, 2.20, 'Premium retail, very high footfall.'),
  ('SW1', 'tier_1', 'Westminster',                  'London',      8.5, 2.10, 'Government + tourist mix.'),
  ('EC2', 'tier_1', 'City of London',               'London',      7.8, 1.90, 'B2B-heavy weekday crowd.'),
  ('M1',  'tier_2', 'Central Manchester',           'North West',  7.2, 1.65, 'Metropolitan, strong B2C.'),
  ('B1',  'tier_2', 'Central Birmingham',           'West Midlands', 6.9, 1.55, 'Bullring + ICC.'),
  ('EH1', 'tier_2', 'Edinburgh Old Town',           'Scotland',    6.5, 1.50, 'Festival season peak.'),
  ('LS1', 'tier_3', 'Leeds City Centre',            'Yorkshire',   5.4, 1.25, 'Strong regional retail.'),
  ('CT1', 'tier_4', 'Canterbury Centre',            'South East',  3.8, 1.00, 'Smaller market, lower CPM.')
on conflict (postcode_prefix) do nothing;

-- ============================================================
-- EVENTS (spanning every lifecycle stage)
-- ============================================================
insert into events (id, account_id, name, event_type, package_type, machine_type, venue_name, venue_address, event_date_start, event_date_end, setup_date, collection_date, current_stage, health_status, created_by, created_at) values
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola Summer Festival 2026', 'vending', 'premium', 'Bright.Vend Pro', 'Hyde Park', 'London W2 2UH', '2026-07-15', '2026-07-17', '2026-07-14', '2026-07-18', 'creative_assets', 'green', '11111111-1111-1111-1111-111111111111', '2026-03-01T10:00:00Z'),
  ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Galaxy Launch Experience', 'activation', 'custom', 'Bright.Play', 'Westfield London', 'Ariel Way, London W12 7GF', '2026-05-20', '2026-05-22', null, null, 'approvals', 'amber', '11111111-1111-1111-1111-111111111111', '2026-02-15T09:00:00Z'),
  ('e3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guinness Six Nations Fan Zone', 'sampling', 'standard', 'Bright.Vend', 'Twickenham Stadium', 'Whitton Rd, Twickenham TW2 7BA', '2026-06-10', null, null, null, 'kickoff_complete', 'green', '11111111-1111-1111-1111-111111111111', '2026-03-20T11:00:00Z'),
  ('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola Christmas Market', 'vending', 'premium', 'Bright.Vend Pro', 'Birmingham Frankfurt Market', 'Victoria Square, Birmingham', '2026-11-20', '2026-12-23', null, null, 'confirmed', 'green', '11111111-1111-1111-1111-111111111111', '2026-04-01T10:00:00Z'),
  ('e5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Unpacked Pop-Up', 'activation', 'premium', 'Bright.Play', 'Battersea Power Station', 'Circus Rd W, London SW11 8DD', '2026-04-10', '2026-04-12', null, null, 'qa_readiness', 'red', '11111111-1111-1111-1111-111111111111', '2026-01-10T08:00:00Z')
on conflict (id) do nothing;

-- ============================================================
-- MILESTONES (for evt-1)
-- ============================================================
insert into milestones (event_id, name, stage, status, target_date, completed_at, sort_order) values
  ('e1111111-1111-1111-1111-111111111111', 'Event Confirmed',          'confirmed',            'complete',    '2026-05-06', '2026-03-01T10:00:00Z', 0),
  ('e1111111-1111-1111-1111-111111111111', 'Kickoff Complete',         'kickoff_complete',      'complete',    '2026-05-13', '2026-03-15T14:00:00Z', 1),
  ('e1111111-1111-1111-1111-111111111111', 'Creative Assets Received', 'creative_assets',       'in_progress', '2026-05-20', null, 2),
  ('e1111111-1111-1111-1111-111111111111', 'Creative Approved',        'approvals',             'pending',     '2026-05-27', null, 3),
  ('e1111111-1111-1111-1111-111111111111', 'Machine Configured',       'build_configuration',   'pending',     '2026-06-03', null, 4),
  ('e1111111-1111-1111-1111-111111111111', 'QA Complete',              'qa_readiness',          'pending',     '2026-06-10', null, 5),
  ('e1111111-1111-1111-1111-111111111111', 'Logistics Confirmed',      'logistics_confirmed',   'pending',     '2026-06-17', null, 6),
  ('e1111111-1111-1111-1111-111111111111', 'Event Live',               'event_live',            'pending',     '2026-06-24', null, 7),
  ('e1111111-1111-1111-1111-111111111111', 'Reporting Available',      'reporting',             'pending',     '2026-07-01', null, 8),
  ('e1111111-1111-1111-1111-111111111111', 'Event Complete',           'complete',              'pending',     '2026-07-08', null, 9);

-- ============================================================
-- TASKS (for evt-1)
-- ============================================================
insert into tasks (id, event_id, title, description, task_type, category, status, priority, assigned_to, due_date, completed_at, is_blocking, customer_visible, sort_order, assigned_role, target_path) values
  ('11111111-1111-4111-8111-111111111101', 'e1111111-1111-1111-1111-111111111111', 'Upload primary brand logo', 'SVG or PNG format, minimum 300dpi, on transparent background', 'customer_action', 'creative', 'complete', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-10', '2026-04-02T10:00:00Z', true, true, 0, 'creative_lead', 'assets'),
  ('11111111-1111-4111-8111-111111111102', 'e1111111-1111-1111-1111-111111111111', 'Add your brand kit (colours, fonts, usage)', 'Add your brand colours and fonts in a few fields — or attach a full guidelines PDF if you have one', 'customer_action', 'creative', 'in_progress', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-12', null, true, true, 1, 'creative_lead', 'assets'),
  ('11111111-1111-4111-8111-111111111103', 'e1111111-1111-1111-1111-111111111111', 'Provide webform questions', 'List of data capture questions for the consumer-facing form', 'customer_action', 'admin', 'pending', 'medium', '22222222-2222-2222-2222-222222222222', '2026-04-15', null, false, true, 2, 'events_lead', 'briefing'),
  ('11111111-1111-4111-8111-111111111104', 'e1111111-1111-1111-1111-111111111111', 'Confirm prize details and quantities', 'Product name, size, quantity, and any vending-specific requirements', 'customer_action', 'operations', 'pending', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-18', null, true, true, 3, 'operations_lead', 'configuration'),
  ('11111111-1111-4111-8111-111111111105', 'e1111111-1111-1111-1111-111111111111', 'Provide onsite contact details', 'Name, phone, and email for the person on site during the event', 'customer_action', 'logistics', 'pending', 'medium', null, '2026-05-01', null, false, true, 4, 'operations_lead', 'logistics'),
  ('11111111-1111-4111-8111-111111111106', 'e1111111-1111-1111-1111-111111111111', 'Design wrap concept', null, 'internal_action', 'creative', 'pending', 'high', '33333333-3333-3333-3333-333333333333', '2026-04-20', null, true, false, 5, 'creative_lead', 'studio'),
  ('11111111-1111-4111-8111-111111111107', 'e1111111-1111-1111-1111-111111111111', 'Configure game logic', null, 'internal_action', 'development', 'pending', 'medium', '55555555-5555-5555-5555-555555555555', '2026-05-15', null, false, false, 6, 'developer', 'configuration'),
  ('11111111-1111-4111-8111-111111111108', 'e1111111-1111-1111-1111-111111111111', 'Arrange logistics and transport', null, 'internal_action', 'logistics', 'pending', 'medium', '44444444-4444-4444-4444-444444444444', '2026-06-30', null, false, false, 7, 'operations_lead', 'logistics');

-- Generic tasks for other events
insert into tasks (event_id, title, task_type, category, status, priority, due_date, is_blocking, customer_visible, sort_order, assigned_role, target_path) values
  ('e2222222-2222-2222-2222-222222222222', 'Upload brand assets',           'customer_action', 'creative',   'pending', 'high',   '2026-04-20', true,  true, 0, 'creative_lead', 'assets'),
  ('e2222222-2222-2222-2222-222222222222', 'Complete creative briefing form','customer_action', 'admin',      'pending', 'medium', '2026-04-25', false, true, 1, 'events_lead',   'briefing'),
  ('e3333333-3333-3333-3333-333333333333', 'Upload brand assets',           'customer_action', 'creative',   'pending', 'high',   '2026-04-20', true,  true, 0, 'creative_lead', 'assets'),
  ('e3333333-3333-3333-3333-333333333333', 'Complete creative briefing form','customer_action', 'admin',      'pending', 'medium', '2026-04-25', false, true, 1, 'events_lead',   'briefing'),
  ('e4444444-4444-4444-4444-444444444444', 'Upload brand assets',           'customer_action', 'creative',   'pending', 'high',   '2026-04-20', true,  true, 0, 'creative_lead', 'assets'),
  ('e4444444-4444-4444-4444-444444444444', 'Complete creative briefing form','customer_action', 'admin',      'pending', 'medium', '2026-04-25', false, true, 1, 'events_lead',   'briefing'),
  ('e5555555-5555-5555-5555-555555555555', 'Upload brand assets',           'customer_action', 'creative',   'pending', 'high',   '2026-04-20', true,  true, 0, 'creative_lead', 'assets'),
  ('e5555555-5555-5555-5555-555555555555', 'Complete creative briefing form','customer_action', 'admin',      'pending', 'medium', '2026-04-25', false, true, 1, 'events_lead',   'briefing');

-- ============================================================
-- ASSETS — canonical "standard game flow" requirement set
-- Mirrors src/lib/asset-requirements/game-flow.ts. Applied to the two
-- Coca-Cola demo events (e1 + e4) with the rich spec columns populated so
-- the customer Assets page renders full spec cards.
-- ============================================================
insert into assets (id, event_id, name, description, asset_type, required_format, required_dimensions, required_resolution_min, required_duration_range, required_file_types, safe_zone_description, animation_requirements, is_physical, file_url, file_name, file_size, version, status, customer_visible, due_date) values
  ('a1f00000-0000-4000-8000-000000000001', 'e1111111-1111-1111-1111-111111111111', 'Primary Brand Logo', 'Main logo for the machine wrap and digital touchpoints. Supply on a transparent background — no white box.', 'logo', 'SVG or PNG (transparent, 300dpi)', 'Minimum 2000px wide', null, null, array['image/svg+xml','image/png'], null, null, false, '/uploads/coca-cola-logo.svg', 'coca-cola-primary-logo.svg', 45200, 1, 'accepted', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000002', 'e1111111-1111-1111-1111-111111111111', 'Brand Guidelines', 'Full brand guide with colour codes (HEX), typography, and usage rules so our designers stay on-brand.', 'document', 'PDF', null, null, null, array['application/pdf'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000003', 'e1111111-1111-1111-1111-111111111111', 'Machine Wrap Artwork', 'Physical wrap for the machine body. Design over our supplied dieline. CMYK, print-ready.', 'physical', 'Print-ready PDF · CMYK · 3mm bleed · 150dpi', null, null, null, null, null, null, true, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000004', 'e1111111-1111-1111-1111-111111111111', 'Payment Terminal Screen', 'Static image on the card-payment screen. It stays lit while idle, so we recommend placing your logo here.', 'imagery', 'PNG or JPG · ≤150 kb', '1080 × 1920 px', '1080x1920', null, array['image/png','image/jpeg'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000005', 'e1111111-1111-1111-1111-111111111111', 'Product Packshot', 'Clean cut-out of the product, used throughout the game flow. Leave ~30px right padding on wide items.', 'imagery', 'PNG (transparent) · ≤150 kb', '428 × 600 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000006', 'e1111111-1111-1111-1111-111111111111', 'Negative Icons (×6)', 'The six on-brand ''distractor'' icons players must avoid tapping. Relevant to the game theme.', 'imagery', 'PNG · ≤50 kb each', '300 × 300 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000007', 'e1111111-1111-1111-1111-111111111111', 'Idle Screen Advert', 'Attract-loop video that plays when the machine is idle — showcase the prizes with a clear ''play now'' CTA.', 'video', 'MP4 · 9:16 · ≤20 mb', '1080 × 1920 px', null, '15-30', array['video/mp4'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000008', 'e1111111-1111-1111-1111-111111111111', 'Game Prompt Video', 'Short animated ''play now to win'' teaser shown before the game.', 'video', 'MP4 · ≤20 mb', '900 × 1600 px', null, '5-10', array['video/mp4'], 'Keep key content within the 804 × 682 px centre safe area (49px padding).', 'Animate elements in and out to avoid screen burn-in.', false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000009', 'e1111111-1111-1111-1111-111111111111', 'Game Page Banner', 'Header strip across the top of the gameplay screen.', 'imagery', 'PNG · ≤150 kb', '1080 × 216 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a1f00000-0000-4000-8000-000000000010', 'e1111111-1111-1111-1111-111111111111', 'Home Banner Ad', 'Hero banner at the top of the storefront homepage. Keep all text and logos inside the safe area.', 'imagery', 'JPG or PNG · ≤150 kb', '2160 × 816 px (total)', null, null, array['image/png','image/jpeg'], 'Safe area 2064 × 600 px with 48px padding; outer edges may be obstructed.', null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000001', 'e4444444-4444-4444-4444-444444444444', 'Primary Brand Logo', 'Main logo for the machine wrap and digital touchpoints. Supply on a transparent background — no white box.', 'logo', 'SVG or PNG (transparent, 300dpi)', 'Minimum 2000px wide', null, null, array['image/svg+xml','image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000002', 'e4444444-4444-4444-4444-444444444444', 'Brand Guidelines', 'Full brand guide with colour codes (HEX), typography, and usage rules so our designers stay on-brand.', 'document', 'PDF', null, null, null, array['application/pdf'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000003', 'e4444444-4444-4444-4444-444444444444', 'Machine Wrap Artwork', 'Physical wrap for the machine body. Design over our supplied dieline. CMYK, print-ready.', 'physical', 'Print-ready PDF · CMYK · 3mm bleed · 150dpi', null, null, null, null, null, null, true, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000004', 'e4444444-4444-4444-4444-444444444444', 'Payment Terminal Screen', 'Static image on the card-payment screen. It stays lit while idle, so we recommend placing your logo here.', 'imagery', 'PNG or JPG · ≤150 kb', '1080 × 1920 px', '1080x1920', null, array['image/png','image/jpeg'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000005', 'e4444444-4444-4444-4444-444444444444', 'Product Packshot', 'Clean cut-out of the product, used throughout the game flow. Leave ~30px right padding on wide items.', 'imagery', 'PNG (transparent) · ≤150 kb', '428 × 600 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000006', 'e4444444-4444-4444-4444-444444444444', 'Negative Icons (×6)', 'The six on-brand ''distractor'' icons players must avoid tapping. Relevant to the game theme.', 'imagery', 'PNG · ≤50 kb each', '300 × 300 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000007', 'e4444444-4444-4444-4444-444444444444', 'Idle Screen Advert', 'Attract-loop video that plays when the machine is idle — showcase the prizes with a clear ''play now'' CTA.', 'video', 'MP4 · 9:16 · ≤20 mb', '1080 × 1920 px', null, '15-30', array['video/mp4'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000008', 'e4444444-4444-4444-4444-444444444444', 'Game Prompt Video', 'Short animated ''play now to win'' teaser shown before the game.', 'video', 'MP4 · ≤20 mb', '900 × 1600 px', null, '5-10', array['video/mp4'], 'Keep key content within the 804 × 682 px centre safe area (49px padding).', 'Animate elements in and out to avoid screen burn-in.', false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000009', 'e4444444-4444-4444-4444-444444444444', 'Game Page Banner', 'Header strip across the top of the gameplay screen.', 'imagery', 'PNG · ≤150 kb', '1080 × 216 px', null, null, array['image/png'], null, null, false, null, null, null, 1, 'required', true, '2026-06-25'),
  ('a4f00000-0000-4000-8000-000000000010', 'e4444444-4444-4444-4444-444444444444', 'Home Banner Ad', 'Hero banner at the top of the storefront homepage. Keep all text and logos inside the safe area.', 'imagery', 'JPG or PNG · ≤150 kb', '2160 × 816 px (total)', null, null, array['image/png','image/jpeg'], 'Safe area 2064 × 600 px with 48px padding; outer edges may be obstructed.', null, false, null, null, null, 1, 'required', true, '2026-06-25')
on conflict (id) do nothing;

-- Generic asset slots for the remaining active events so their "Upload brand assets"
-- task has a real destination (otherwise the Assets page reads "No assets required yet").
insert into assets (id, event_id, name, description, asset_type, required_format, required_dimensions, file_url, file_name, file_size, version, status, due_date) values
  ('a2000001-0000-4000-8000-000000000001', 'e2222222-2222-2222-2222-222222222222', 'Primary Brand Logo', 'Main logo for wrap and digital touchpoints', 'logo', 'SVG or PNG (300dpi min)', 'Minimum 2000px wide', null, null, null, 1, 'required', '2026-04-20'),
  ('a2000002-0000-4000-8000-000000000002', 'e2222222-2222-2222-2222-222222222222', 'Campaign Hero Image', 'Key visual for the activation', 'imagery', 'PNG or JPEG', '3840x2160 minimum', null, null, null, 1, 'required', '2026-04-20'),
  ('a3000001-0000-4000-8000-000000000001', 'e3333333-3333-3333-3333-333333333333', 'Primary Brand Logo', 'Main logo for wrap and digital touchpoints', 'logo', 'SVG or PNG (300dpi min)', 'Minimum 2000px wide', null, null, null, 1, 'required', '2026-04-20'),
  ('a3000002-0000-4000-8000-000000000002', 'e3333333-3333-3333-3333-333333333333', 'Campaign Hero Image', 'Key visual for the activation', 'imagery', 'PNG or JPEG', '3840x2160 minimum', null, null, null, 1, 'required', '2026-04-20'),
  ('a5000001-0000-4000-8000-000000000001', 'e5555555-5555-5555-5555-555555555555', 'Primary Brand Logo', 'Main logo for wrap and digital touchpoints', 'logo', 'SVG or PNG (300dpi min)', 'Minimum 2000px wide', null, null, null, 1, 'required', '2026-04-20'),
  ('a5000002-0000-4000-8000-000000000002', 'e5555555-5555-5555-5555-555555555555', 'Campaign Hero Image', 'Key visual for the activation', 'imagery', 'PNG or JPEG', '3840x2160 minimum', null, null, null, 1, 'required', '2026-04-20')
on conflict (id) do nothing;

-- ============================================================
-- APPROVALS (for evt-2)
-- ============================================================
insert into approvals (id, event_id, title, description, approval_type, status, preview_url, requested_by, requested_at, decided_at, feedback, revision_count) values
  ('ab111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'Wrap Design', 'Machine wrap design for the Galaxy Launch Experience', 'wrap', 'pending', '/catalog/case-studies/costa-matcha/03-prize-selection.png', '33333333-3333-3333-3333-333333333333', '2026-03-28T14:00:00Z', null, 'Previous version had incorrect blue shade. Updated to Galaxy Blue #1428A0.', 1),
  ('ab222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'Game Flow', 'Interactive game sequence for the Bright.Play activation', 'game_flow', 'approved', null, '33333333-3333-3333-3333-333333333333', '2026-03-20T10:00:00Z', '2026-03-22T16:30:00Z', null, 0),
  ('ab333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'Webform Design', 'Data capture form for lead generation', 'webform', 'pending', null, '33333333-3333-3333-3333-333333333333', '2026-03-30T09:00:00Z', null, null, 0);

-- ============================================================
-- PARTNERS + USERS
-- ============================================================
insert into partners (id, name, slug, type, contact_name, contact_email, brand_color, partner_code, status, onboarded_at) values
  ('e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0', 'Northern Events', 'northern-events', 'reseller', 'Maya Patel', 'maya@northern.events',   '#1E47F0', 'BB-NORTH001', 'active', '2026-01-10T10:00:00Z'),
  ('e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'Kings Cross Hall',  'kings-cross-hall', 'venue',  'Aaron Howe',  'aaron@kingsx.london',     '#80E8FF', 'BB-KINGS001', 'active', '2026-02-04T10:00:00Z')
on conflict (id) do nothing;

-- ============================================================
-- VENUES
-- ============================================================
insert into venues (id, partner_id, name, slug, address, postcode, location_tier, capacity, venue_type, is_active) values
  ('f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0', 'e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0', 'Manchester Pop-Up', 'manchester-pop-up', 'Spinningfields, M3 3JE', 'M3 3JE', 'tier_2', 1500, 'shopping_centre', true),
  ('f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1', 'e1e1e1e1-e1e1-4e1e-8e1e-e1e1e1e1e1e1', 'Kings Cross Hall',  'kings-cross-hall',   'York Way, N1C 4AT',     'N1C 4AT', 'tier_1', 4000, 'other',        true)
on conflict (id) do nothing;

-- ============================================================
-- MACHINE INSTANCES (tied to events)
-- ============================================================
insert into machine_instances (id, machine_type_id, serial_number, nickname, current_event_id, status, last_heartbeat, firmware_version) values
  ('1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a', 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'BVP-1024', 'Pro #1',  'e1111111-1111-1111-1111-111111111111', 'deployed', now(), '2.3.1'),
  ('1b1b1b1b-1b1b-4b1b-8b1b-1b1b1b1b1b1b', 'a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2', 'BVP-1025', 'Pro #2',  'e1111111-1111-1111-1111-111111111111', 'deployed', now(), '2.3.1'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'a3a3a3a3-a3a3-4a3a-8a3a-a3a3a3a3a3a3', 'BP-2110',  'Play #1', 'e2222222-2222-2222-2222-222222222222', 'deployed', now(), '3.1.0')
on conflict (id) do nothing;

-- ============================================================
-- BENCHMARKS (industry baselines for the recommendations + reports)
-- ============================================================
insert into benchmarks (event_type, location_tier, machine_type, metric_name, avg_value, median_value, p25_value, p75_value, sample_size) values
  ('activation',  'tier_1', 'Bright.Play',     'plays_per_day',     1850, 1700, 1400, 2150, 28),
  ('activation',  'tier_2', 'Bright.Play',     'plays_per_day',     1200, 1100, 850,  1400, 19),
  ('sampling',    'tier_1', 'Bright.Vend Pro', 'samples_per_day',   1450, 1400, 1100, 1750, 22),
  ('sampling',    'tier_2', 'Bright.Vend Pro', 'samples_per_day',    950,  900,  720, 1150, 17);

-- ============================================================
-- TELEMETRY (live dashboard demo data for evt-2)
-- ============================================================
insert into telemetry_events (machine_instance_id, event_id, event_type, payload_json, "timestamp") values
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'play_started',   '{"session":"s1"}'::jsonb, now() - interval '30 minutes'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'play_completed', '{"session":"s1","score":820}'::jsonb, now() - interval '29 minutes'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'lead_captured',  '{"session":"s1"}'::jsonb, now() - interval '28 minutes'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'play_started',   '{"session":"s2"}'::jsonb, now() - interval '14 minutes'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'play_completed', '{"session":"s2","score":640}'::jsonb, now() - interval '13 minutes'),
  ('1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'e2222222-2222-2222-2222-222222222222', 'prize_awarded',  '{"session":"s2","prize":"sample"}'::jsonb, now() - interval '12 minutes');

-- ============================================================
-- LEADS (live demo for evt-2)
-- ============================================================
insert into leads (event_id, machine_instance_id, contact_name, contact_email, custom_fields_json, source, captured_at) values
  ('e2222222-2222-2222-2222-222222222222', '1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'Casey Morgan', 'casey.morgan@example.com', '{"interest":"galaxy"}'::jsonb, 'game', now() - interval '28 minutes'),
  ('e2222222-2222-2222-2222-222222222222', '1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c', 'Reece Ellis',  'reece.ellis@example.com',  '{"interest":"trade"}'::jsonb, 'game', now() - interval '12 minutes'),
  ('e1111111-1111-1111-1111-111111111111', '1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a', 'Olivia Hart',  'olivia.hart@example.com',  '{}'::jsonb, 'game', now() - interval '6 hours');

-- ============================================================
-- QUOTES + LINE ITEMS (one of each track)
-- ============================================================
insert into quotes (id, account_id, track, status, contact_name, contact_email, company_name, event_type, postcode, location_postcode, event_date_start, event_date_end, machine_preference, game_preference, footfall_estimate_text, addons, total_amount, created_at) values
  ('21212121-2121-4121-8121-212121212121', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'book_now', 'submitted',     'James Chen',  'james.chen@cocacola.com', 'Coca-Cola UK',       'sampling',  'W1', 'W1', '2026-09-12', '2026-09-14', 'Bright.Vend Pro', 'Spin & Reveal',  '5000-10000', '["live-telemetry","sampling-unlock"]'::jsonb,  null, '2026-04-12T10:00:00Z'),
  ('22222222-2222-4222-8222-222222222220', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'proposal', 'proposal_sent', 'Aisha Khan',  'aisha@samsung.example',   'Samsung Electronics', 'activation', 'M1', 'M1', '2026-10-03', '2026-10-07', 'Bright.Play',     'Photo Booth Pro','15000-20000', '["live-telemetry","linkedin-follow","survey-layer"]'::jsonb, 2750000, '2026-03-30T14:00:00Z')
on conflict (id) do nothing;

insert into quote_line_items (quote_id, label, description, amount, category, sort_order) values
  ('22222222-2222-4222-8222-222222222220', 'Bright.Play — 5-day activation', 'Includes hardware, ops, creative production', 2200000, 'hardware', 0),
  ('22222222-2222-4222-8222-222222222220', 'Logistics + travel',             'Multi-day on-site team',                       250000, 'logistics', 1),
  ('22222222-2222-4222-8222-222222222220', 'LinkedIn follow gate',           'Pre-game lead capture',                         45000, 'mechanics', 2),
  ('22222222-2222-4222-8222-222222222220', 'Survey layer',                   'Brand-lift survey at game end',                 60000, 'mechanics', 3),
  ('22222222-2222-4222-8222-222222222220', 'Live telemetry dashboard',       '24/7 live read of the activation',              50000, 'reporting', 4),
  ('22222222-2222-4222-8222-222222222220', 'Studio creative',                'Bespoke art + animation',                      145000, 'creative', 5);

-- ============================================================
-- PARTNER ATTRIBUTIONS (Northern Events attributed to the Samsung
-- proposal)
-- ============================================================
insert into partner_attributions (partner_id, quote_id, event_id, commission_amount, commission_status) values
  ('e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0', '22222222-2222-4222-8222-222222222220', 'e5555555-5555-5555-5555-555555555555', 275000, 'pending');

-- ============================================================
-- EVENT REPORTS
-- ============================================================
insert into event_reports (id, event_id, report_type, title, metrics_json, predictions_json, comparison_json, highlights_json, share_token, is_published, published_at, generated_at) values
  ('30303030-3030-4030-8030-303030303030', 'e2222222-2222-2222-2222-222222222222', 'post_event', 'Samsung Galaxy Launch — Post-Event',
    '{"plays":18000,"leads":6200,"avgDwellSec":52,"npsScore":4.8}'::jsonb,
    '{"estimatedPlays":15000,"estimatedLeads":5000}'::jsonb,
    '{"plays":{"predicted":15000,"actual":18000,"delta":3000},"leads":{"predicted":5000,"actual":6200,"delta":1200}}'::jsonb,
    '["+20% above predicted plays","Conversion to lead 34% — top decile","Highest dwell of any Bright.Play in Q2"]'::jsonb,
    'share-samsung-launch', true, '2026-05-26T11:00:00Z', '2026-05-25T17:00:00Z');

-- ============================================================
-- BRIEFING + QA + LOGISTICS for evt-1 to make every internal
-- ops surface render with real data.
-- ============================================================
insert into briefing_responses (event_id, form_type, responses, is_submitted, submitted_by, submitted_at) values
  ('e1111111-1111-1111-1111-111111111111', 'creative', '{"primaryAudience":"Festival-goers 18-35","brandPillars":["Refresh","Optimism","Togetherness"]}'::jsonb, true, '22222222-2222-2222-2222-222222222222', '2026-03-20T15:00:00Z'),
  ('e1111111-1111-1111-1111-111111111111', 'ops',      '{"venueContact":"James Chen","onSiteHours":"08:00-22:00","accessNotes":"Vehicle entry via Park Lane gate"}'::jsonb, false, null, null);

insert into qa_items (event_id, category, title, description, status, sort_order) values
  ('e1111111-1111-1111-1111-111111111111', 'machine',     'Touchscreen calibration',         'Confirm touch accuracy after wrap install.',     'pending', 0),
  ('e1111111-1111-1111-1111-111111111111', 'game_logic',  'Lead capture form submission',    'End-to-end test of submitting a lead.',          'pending', 1),
  ('e1111111-1111-1111-1111-111111111111', 'wrap',        'Wrap colour calibration',         'Pantone match against approved sample.',         'pending', 2),
  ('e1111111-1111-1111-1111-111111111111', 'machine',     'On-site 4G fallback',             'Confirm cellular failover when wifi drops.',     'pending', 3);

insert into logistics_entries (event_id, entry_type, title, description, scheduled_date, scheduled_time, status, contact_name, contact_phone, sort_order) values
  ('e1111111-1111-1111-1111-111111111111', 'delivery', 'Hardware delivery',  'Two Bright.Vend Pro machines + wrap.',  '2026-07-14', '08:00', 'pending', 'Tom Parker', '+44 7700 900123', 0),
  ('e1111111-1111-1111-1111-111111111111', 'setup',    'On-site setup',      'Configure machines + connectivity.',     '2026-07-14', '10:00', 'pending', 'Tom Parker', '+44 7700 900123', 1),
  ('e1111111-1111-1111-1111-111111111111', 'collection', 'Hardware collection', 'Strip and return.',                  '2026-07-18', '17:00', 'pending', 'Tom Parker', '+44 7700 900123', 2);

-- ============================================================
-- STUDIO request for evt-2 (drives the Bright.Studio surface)
-- ============================================================
insert into studio_requests (id, event_id, service_type, title, description, status, estimated_days, estimated_cost, created_by, created_at) values
  ('40404040-4040-4040-8040-404040404040', 'e2222222-2222-2222-2222-222222222222', 'video', 'Hype reel for Galaxy Launch',
    'Pre-event hype reel for the social rollout. 30s, 9:16.', 'submitted', 5, 750000, '22222222-2222-2222-2222-222222222222', '2026-03-25T11:00:00Z');
