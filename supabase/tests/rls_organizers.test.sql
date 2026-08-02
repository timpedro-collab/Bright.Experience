-- =====================================================================
-- RLS: organizer shows — events, machine_instances, sponsorship_slots,
--      telemetry, and the deliberate leads exclusion.
--
-- Verifies:
--   1. Organizer users see the show they run
--   2. Organizer users see no other account's events
--   3. Organizer users see the fleet deployed to their show
--   4. Organizer users see their show's sponsor slots, not venue slots
--   5. Organizer users can create a slot on their own show
--   6. Organizer users see aggregate telemetry for their show
--   7. Organizer users CANNOT see lead rows (captured contacts belong to
--      the brand, not the host) — the privacy line this feature relies on
--   8. Organizer users read the configuration running on their show (no PII)
--   9. Organizer users CANNOT write machine_instances — zone/mission go
--      through updateMachineDeployment, which authorizes then uses the
--      service role, so no UPDATE policy may exist on our hardware register
--  10. Organizer users read customer-visible creative on their own show, and
--      never the internal working files beside it
--  11. Anon sees no sponsorship slots
--  12. A live pitch token does NOT open the table to anon — the pitch page
--      resolves tokens server-side, so no policy may grant anon access
-- =====================================================================

begin;
\ir _fixtures.psql

-- Organizer persona: an Informa-style show producer running one show whose
-- delivery account is Acme. Defined locally rather than in _fixtures so the
-- shared row counts other RLS tests assert stay unchanged.
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
values
  ('00000000-0000-4000-8000-000000000040', 'shows@organizer.test', '', now(), '{}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
on conflict (id) do nothing;

insert into profiles (id, name, email, role, account_id, is_active) values
  ('00000000-0000-4000-8000-000000000040', 'Show Producer', 'shows@organizer.test', 'partner_admin', null, true)
on conflict (id) do nothing;

insert into partners (id, name, slug, type, partner_code, status) values
  ('00000000-0000-4000-8000-0000000000b3', 'Global Shows', 'global-shows', 'organizer', 'BB-SHOWS001', 'active')
on conflict (id) do nothing;

insert into partner_users (id, partner_id, profile_id, role) values
  ('00000000-0000-4000-8000-0000000000f4', '00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-000000000040', 'admin')
on conflict (id) do nothing;

-- evt_acme becomes the organizer's show; evt_other stays unrelated.
update events
  set organizer_partner_id = '00000000-0000-4000-8000-0000000000b3'
  where id = '00000000-0000-4000-8000-0000000000e1';

insert into machines (id, name, slug, is_active) values
  ('00000000-0000-4000-8000-0000000000da', 'Bright.Vend Pro', 'bright-vend-pro', true)
on conflict (id) do nothing;

insert into machine_instances (id, machine_type_id, serial_number, current_event_id, status, zone, mission) values
  ('00000000-0000-4000-8000-0000000000db', '00000000-0000-4000-8000-0000000000da', 'BV-2001', '00000000-0000-4000-8000-0000000000e1', 'deployed', 'Registration', 'welcome_gift'),
  ('00000000-0000-4000-8000-0000000000dc', '00000000-0000-4000-8000-0000000000da', 'BV-2002', '00000000-0000-4000-8000-0000000000e1', 'deployed', 'Hall 3', 'sponsor_activation'),
  ('00000000-0000-4000-8000-0000000000dd', '00000000-0000-4000-8000-0000000000da', 'BV-2003', '00000000-0000-4000-8000-0000000000e2', 'deployed', null, null)
on conflict (id) do nothing;

-- One show slot (organizer scope) and one venue slot (placement scope).
insert into placements (id, venue_id, start_date, status) values
  ('00000000-0000-4000-8000-0000000000c3', '00000000-0000-4000-8000-0000000000c1', '2026-08-01', 'planned')
on conflict (id) do nothing;

insert into sponsorship_slots (id, event_id, machine_instance_id, start_date, end_date, status, sponsor_name, pitch_token, pitch_token_expires_at) values
  ('00000000-0000-4000-8000-0000000000c7', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000dc', '2026-06-15', '2026-06-17', 'available', 'Sponsor Co', 'live-pitch-token-000000000000000001', now() + interval '30 days')
on conflict (id) do nothing;

insert into sponsorship_slots (id, placement_id, start_date, end_date, status) values
  ('00000000-0000-4000-8000-0000000000c8', '00000000-0000-4000-8000-0000000000c3', '2026-08-01', '2026-08-02', 'available')
on conflict (id) do nothing;

insert into telemetry_events (machine_instance_id, event_id, event_type) values
  ('00000000-0000-4000-8000-0000000000db', '00000000-0000-4000-8000-0000000000e1', 'play_started'),
  ('00000000-0000-4000-8000-0000000000dc', '00000000-0000-4000-8000-0000000000e1', 'lead_captured');

insert into leads (event_id, machine_instance_id, contact_email, source) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000dc', 'attendee@sponsor.test', 'game');

-- The show-wide default config plus one machine-scoped override, which is what
-- the organizer machine page reads to say what a unit is running.
insert into game_configurations (id, event_id, machine_instance_id, prize_mode, status) values
  ('00000000-0000-4000-8000-0000000000e7', '00000000-0000-4000-8000-0000000000e1', null, 'guaranteed', 'submitted'),
  ('00000000-0000-4000-8000-0000000000e8', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000dc', 'score_based', 'submitted')
on conflict (id) do nothing;

-- Creative for the show: one piece the brand shares, one internal working file
-- that must stay invisible to the host.
insert into assets (id, event_id, name, asset_type, status, customer_visible) values
  ('00000000-0000-4000-8000-0000000000e9', '00000000-0000-4000-8000-0000000000e1', 'Sponsor wrap', 'wrap', 'uploaded', true),
  ('00000000-0000-4000-8000-0000000000ea', '00000000-0000-4000-8000-0000000000e1', 'Internal print spec', 'other', 'uploaded', false)
on conflict (id) do nothing;

select plan(12);

-- (1) Organizer sees the show they run
select _rls_test_as('00000000-0000-4000-8000-000000000040');
select is(
  (select array_agg(id order by id)::uuid[] from events),
  array['00000000-0000-4000-8000-0000000000e1'::uuid],
  'organizer sees only the show they run'
);

-- (2) No access to an unrelated event
select is(
  (select count(*)::int from events where id = '00000000-0000-4000-8000-0000000000e2'),
  0,
  'organizer cannot see an unrelated event'
);

-- (3) Fleet scoped to their show
select is(
  (select array_agg(serial_number order by serial_number)::text[] from machine_instances),
  array['BV-2001', 'BV-2002']::text[],
  'organizer sees the fleet deployed to their show only'
);

-- (4) Show slots visible, venue slots not
select is(
  (select array_agg(id order by id)::uuid[] from sponsorship_slots),
  array['00000000-0000-4000-8000-0000000000c7'::uuid],
  'organizer sees their show slots and no venue slots'
);

-- (5) Can sell more inventory on their own show
insert into sponsorship_slots (event_id, machine_instance_id, start_date, end_date, status, sponsor_name)
  values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000db', '2026-06-15', '2026-06-17', 'available', 'Second Sponsor');
select is(
  (select count(*)::int from sponsorship_slots where sponsor_name = 'Second Sponsor'),
  1,
  'organizer can create a slot on their own show'
);

-- (6) Aggregate telemetry for the fleet board
select is(
  (select count(*)::int from telemetry_events),
  2,
  'organizer sees aggregate telemetry for their show'
);

-- (7) The privacy line: counts yes, contacts no
select is(
  (select count(*)::int from leads),
  0,
  'organizer cannot read lead rows for their own show'
);

-- (8) The configuration behind each unit, so "what is this machine running"
-- has an answer without exposing anything a visitor typed.
select is(
  (select count(*)::int from game_configurations
    where event_id = '00000000-0000-4000-8000-0000000000e1'),
  2,
  'organizer reads the show default and the per-machine override'
);

-- (9) Hardware stays read-only. An organizer asking for a different zone goes
-- through the server action; a policy here would hand them the whole row.
update machine_instances
  set zone = 'Hall 9'
  where id = '00000000-0000-4000-8000-0000000000db';
select is(
  (select zone from machine_instances
    where id = '00000000-0000-4000-8000-0000000000db'),
  'Registration',
  'organizer cannot rewrite a machine record directly'
);

-- (10) Creative status, so "is the sponsor's artwork in?" has an answer —
-- without exposing the files the creative team is still working on.
select is(
  (select array_agg(name order by name)::text[] from assets),
  array['Sponsor wrap']::text[],
  'organizer sees customer-visible creative on their show and nothing internal'
);

-- (11) Anon locked out of inventory
select _rls_test_anon();
select is(
  (select count(*)::int from sponsorship_slots),
  0,
  'anon sees no sponsorship slots'
);

-- (12) Holding a live pitch token buys nothing at the database layer: the
-- public page reads through the service role after validating the token.
select is(
  (select count(*)::int from sponsorship_slots
    where pitch_token = 'live-pitch-token-000000000000000001'),
  0,
  'a live pitch token does not grant anon access to the slot row'
);

select * from finish();
rollback;
