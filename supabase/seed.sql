-- ============================================================
-- Bright.Experience — Seed Data
-- ============================================================
-- This seed creates accounts, events, milestones, tasks, assets,
-- and approvals matching the original mock data.
--
-- Auth users must be created separately via the auth admin API
-- (see seed-users.ts). This seed references the UUIDs assigned there.
-- ============================================================

-- Fixed UUIDs for predictable references
-- Users (must match auth.users created by seed-users.ts)
-- u1: Sarah Mitchell (events_lead) = 11111111-1111-1111-1111-111111111111
-- u2: James Chen (customer_admin) = 22222222-2222-2222-2222-222222222222
-- u3: Emma Wright (creative_lead) = 33333333-3333-3333-3333-333333333333
-- u4: Tom Parker (operations_lead) = 44444444-4444-4444-4444-444444444444
-- u5: Alex Rivera (qa_lead)        = 55555555-5555-5555-5555-555555555555

-- ============================================================
-- ACCOUNTS
-- ============================================================

insert into accounts (id, name, slug) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola UK', 'coca-cola-uk'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Electronics', 'samsung'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Diageo', 'diageo');

-- ============================================================
-- PROFILES (inserted after auth users are created)
-- ============================================================

insert into profiles (id, name, email, role, account_id) values
  ('11111111-1111-1111-1111-111111111111', 'Sarah Mitchell', 'sarah@brightblue.co.uk', 'events_lead', null),
  ('22222222-2222-2222-2222-222222222222', 'James Chen', 'james.chen@cocacola.com', 'customer_admin', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('33333333-3333-3333-3333-333333333333', 'Emma Wright', 'emma@brightblue.co.uk', 'creative_lead', null),
  ('44444444-4444-4444-4444-444444444444', 'Tom Parker', 'tom@brightblue.co.uk', 'operations_lead', null),
  ('55555555-5555-5555-5555-555555555555', 'Alex Rivera', 'alex@brightblue.co.uk', 'qa_lead', null);

-- ============================================================
-- EVENTS
-- ============================================================

insert into events (id, account_id, name, event_type, package_type, machine_type, venue_name, venue_address, event_date_start, event_date_end, setup_date, collection_date, current_stage, health_status, created_by, created_at) values
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola Summer Festival 2026', 'vending', 'premium', 'Bright.Vend Pro', 'Hyde Park', 'London W2 2UH', '2026-07-15', '2026-07-17', '2026-07-14', '2026-07-18', 'creative_assets', 'green', '11111111-1111-1111-1111-111111111111', '2026-03-01T10:00:00Z'),
  ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Galaxy Launch Experience', 'activation', 'custom', 'Bright.Play', 'Westfield London', 'Ariel Way, London W12 7GF', '2026-05-20', '2026-05-22', null, null, 'approvals', 'amber', '11111111-1111-1111-1111-111111111111', '2026-02-15T09:00:00Z'),
  ('e3333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guinness Six Nations Fan Zone', 'sampling', 'standard', 'Bright.Vend', 'Twickenham Stadium', 'Whitton Rd, Twickenham TW2 7BA', '2026-06-10', null, null, null, 'kickoff_complete', 'green', '11111111-1111-1111-1111-111111111111', '2026-03-20T11:00:00Z'),
  ('e4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coca-Cola Christmas Market', 'vending', 'premium', 'Bright.Vend Pro', 'Birmingham Frankfurt Market', 'Victoria Square, Birmingham', '2026-11-20', '2026-12-23', null, null, 'confirmed', 'green', '11111111-1111-1111-1111-111111111111', '2026-04-01T10:00:00Z'),
  ('e5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samsung Unpacked Pop-Up', 'activation', 'premium', 'Bright.Play', 'Battersea Power Station', 'Circus Rd W, London SW11 8DD', '2026-04-10', '2026-04-12', null, null, 'qa_readiness', 'red', '11111111-1111-1111-1111-111111111111', '2026-01-10T08:00:00Z');

-- ============================================================
-- MILESTONES (for evt-1: Coca-Cola Summer Festival, stage = creative_assets = index 2)
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

insert into tasks (id, event_id, title, description, task_type, category, status, priority, assigned_to, due_date, completed_at, is_blocking, customer_visible, sort_order) values
  ('t1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Upload primary brand logo', 'SVG or PNG format, minimum 300dpi, on transparent background', 'customer_action', 'creative', 'complete', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-10', '2026-04-02T10:00:00Z', true, true, 0),
  ('t2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Upload brand guidelines document', 'PDF with colour codes, font specifications, and usage rules', 'customer_action', 'creative', 'in_progress', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-12', null, true, true, 1),
  ('t3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Provide webform questions', 'List of data capture questions for the consumer-facing form', 'customer_action', 'creative', 'pending', 'medium', '22222222-2222-2222-2222-222222222222', '2026-04-15', null, false, true, 2),
  ('t4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'Confirm prize details and quantities', 'Product name, size, quantity, and any vending-specific requirements', 'customer_action', 'operations', 'pending', 'high', '22222222-2222-2222-2222-222222222222', '2026-04-18', null, true, true, 3),
  ('t5555555-5555-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111', 'Provide onsite contact details', 'Name, phone, and email for the person on site during the event', 'customer_action', 'logistics', 'pending', 'medium', null, '2026-05-01', null, false, true, 4),
  ('t6666666-6666-6666-6666-666666666666', 'e1111111-1111-1111-1111-111111111111', 'Design wrap concept', null, 'internal_action', 'creative', 'pending', 'high', '33333333-3333-3333-3333-333333333333', '2026-04-20', null, true, false, 5),
  ('t7777777-7777-7777-7777-777777777777', 'e1111111-1111-1111-1111-111111111111', 'Configure game logic', null, 'internal_action', 'development', 'pending', 'medium', '55555555-5555-5555-5555-555555555555', '2026-05-15', null, false, false, 6),
  ('t8888888-8888-8888-8888-888888888888', 'e1111111-1111-1111-1111-111111111111', 'Arrange logistics and transport', null, 'internal_action', 'logistics', 'pending', 'medium', '44444444-4444-4444-4444-444444444444', '2026-06-30', null, false, false, 7);

-- Generic tasks for other events
insert into tasks (event_id, title, task_type, category, status, priority, due_date, is_blocking, customer_visible, sort_order) values
  ('e2222222-2222-2222-2222-222222222222', 'Upload brand assets', 'customer_action', 'creative', 'pending', 'high', '2026-04-20', true, true, 0),
  ('e2222222-2222-2222-2222-222222222222', 'Complete creative briefing form', 'customer_action', 'creative', 'pending', 'medium', '2026-04-25', false, true, 1),
  ('e3333333-3333-3333-3333-333333333333', 'Upload brand assets', 'customer_action', 'creative', 'pending', 'high', '2026-04-20', true, true, 0),
  ('e3333333-3333-3333-3333-333333333333', 'Complete creative briefing form', 'customer_action', 'creative', 'pending', 'medium', '2026-04-25', false, true, 1),
  ('e4444444-4444-4444-4444-444444444444', 'Upload brand assets', 'customer_action', 'creative', 'pending', 'high', '2026-04-20', true, true, 0),
  ('e4444444-4444-4444-4444-444444444444', 'Complete creative briefing form', 'customer_action', 'creative', 'pending', 'medium', '2026-04-25', false, true, 1),
  ('e5555555-5555-5555-5555-555555555555', 'Upload brand assets', 'customer_action', 'creative', 'pending', 'high', '2026-04-20', true, true, 0),
  ('e5555555-5555-5555-5555-555555555555', 'Complete creative briefing form', 'customer_action', 'creative', 'pending', 'medium', '2026-04-25', false, true, 1);

-- ============================================================
-- ASSETS (for evt-1: Coca-Cola Summer Festival)
-- ============================================================

insert into assets (id, event_id, name, description, asset_type, required_format, required_dimensions, file_url, file_name, file_size, version, status, due_date) values
  ('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Primary Brand Logo', 'Main logo for wrap and digital touchpoints', 'logo', 'SVG or PNG (300dpi min)', 'Minimum 2000px wide', '/uploads/coca-cola-logo.svg', 'coca-cola-primary-logo.svg', 45200, 1, 'accepted', '2026-04-10'),
  ('a2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Brand Guidelines', 'Full brand guide with colour codes, typography, and usage rules', 'brand_guidelines', 'PDF', null, null, null, null, 1, 'required', '2026-04-12'),
  ('a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Campaign Hero Image', 'Key visual for the Summer Festival campaign', 'imagery', 'PNG or JPEG', '3840x2160 minimum', null, null, null, 1, 'required', '2026-04-15'),
  ('a4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'Product Photography', 'High-res product shots for digital displays', 'imagery', 'PNG (transparent background)', '2000x2000 minimum', null, null, null, 1, 'required', '2026-04-18');

-- ============================================================
-- APPROVALS (for evt-2: Samsung Galaxy Launch)
-- ============================================================

insert into approvals (id, event_id, title, description, approval_type, status, preview_url, requested_by, requested_at, decided_at, feedback, revision_count) values
  ('ap111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 'Wrap Design', 'Machine wrap design for the Galaxy Launch Experience', 'wrap', 'pending', '/previews/samsung-wrap-v2.png', '33333333-3333-3333-3333-333333333333', '2026-03-28T14:00:00Z', null, 'Previous version had incorrect blue shade. Updated to Galaxy Blue #1428A0.', 1),
  ('ap222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'Game Flow', 'Interactive game sequence for the Bright.Play activation', 'game_flow', 'approved', null, '33333333-3333-3333-3333-333333333333', '2026-03-20T10:00:00Z', '2026-03-22T16:30:00Z', null, 0),
  ('ap333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'Webform Design', 'Data capture form for lead generation', 'webform', 'pending', null, '33333333-3333-3333-3333-333333333333', '2026-03-30T09:00:00Z', null, null, 0);
