-- =====================================================================
-- RLS: the event-scoped collaboration tables.
--
-- milestones, briefing_responses, comments, event_team_members,
-- asset_versions, asset_annotations, hourly_metrics and audit_entries all
-- hang off an event and all follow the same rule: a customer sees the rows
-- for events their account owns and nothing else. They had no pgTAP cover,
-- so a regression in any one of them (a `using (true)`, a dropped account
-- scope) would leak one customer's brief, comments, creative feedback or
-- performance numbers to another.
--
-- audit_entries is deliberately different — it is an internal trail, so
-- customers may write to it but never read it.
--
-- Each assertion is scoped to fixture rows so it survives the demo seed.
-- =====================================================================

begin;
\ir _fixtures.psql

-- Two of everything: one row on the Acme event, one on the OtherCo event.
insert into milestones (id, event_id, name, stage, status) values
  ('00000000-0000-4000-8000-000000000a01', '00000000-0000-4000-8000-0000000000e1', 'Acme kickoff', 'confirmed', 'pending'),
  ('00000000-0000-4000-8000-000000000a02', '00000000-0000-4000-8000-0000000000e2', 'Other kickoff', 'confirmed', 'pending')
on conflict (id) do nothing;

insert into briefing_responses (id, event_id, form_type, responses) values
  ('00000000-0000-4000-8000-000000000a03', '00000000-0000-4000-8000-0000000000e1', 'customer', '{"goal":"acme secret"}'),
  ('00000000-0000-4000-8000-000000000a04', '00000000-0000-4000-8000-0000000000e2', 'customer', '{"goal":"other secret"}')
on conflict (id) do nothing;

insert into assets (id, event_id, name, asset_type) values
  ('00000000-0000-4000-8000-000000000a05', '00000000-0000-4000-8000-0000000000e1', 'Acme artwork', 'image'),
  ('00000000-0000-4000-8000-000000000a06', '00000000-0000-4000-8000-0000000000e2', 'Other artwork', 'image')
on conflict (id) do nothing;

insert into asset_versions (id, asset_id, event_id, version, file_path) values
  ('00000000-0000-4000-8000-000000000a07', '00000000-0000-4000-8000-000000000a05', '00000000-0000-4000-8000-0000000000e1', 1, 'acme/v1.png'),
  ('00000000-0000-4000-8000-000000000a08', '00000000-0000-4000-8000-000000000a06', '00000000-0000-4000-8000-0000000000e2', 1, 'other/v1.png')
on conflict (id) do nothing;

insert into asset_annotations (id, asset_id, event_id, author_id, x, y, body) values
  ('00000000-0000-4000-8000-000000000a09', '00000000-0000-4000-8000-000000000a05', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000012', 10, 10, 'Acme feedback'),
  ('00000000-0000-4000-8000-000000000a0a', '00000000-0000-4000-8000-000000000a06', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000012', 10, 10, 'Other feedback')
on conflict (id) do nothing;

insert into comments (id, event_id, author_id, body) values
  ('00000000-0000-4000-8000-000000000a0b', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000020', 'Acme comment'),
  ('00000000-0000-4000-8000-000000000a0c', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000021', 'Other comment')
on conflict (id) do nothing;

insert into event_team_members (id, event_id, email, role_label) values
  ('00000000-0000-4000-8000-000000000a0d', '00000000-0000-4000-8000-0000000000e1', 'crew@acme.test', 'Stand lead'),
  ('00000000-0000-4000-8000-000000000a0e', '00000000-0000-4000-8000-0000000000e2', 'crew@other.test', 'Stand lead')
on conflict (id) do nothing;

insert into hourly_metrics (id, event_id, snapshot_date, hour, plays, leads) values
  ('00000000-0000-4000-8000-000000000a0f', '00000000-0000-4000-8000-0000000000e1', '2026-06-15', 10, 120, 30),
  ('00000000-0000-4000-8000-000000000a10', '00000000-0000-4000-8000-0000000000e2', '2026-07-01', 10, 90, 12)
on conflict (id) do nothing;

insert into audit_entries (id, event_id, actor_id, action, entity_type, entity_id) values
  ('00000000-0000-4000-8000-000000000a11', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000011', 'stage.advanced', 'event', '00000000-0000-4000-8000-0000000000e1')
on conflict (id) do nothing;

select plan(21);

-- ── (1-8) The Acme customer sees only Acme rows ──────────────────────
select _rls_test_as('00000000-0000-4000-8000-000000000020');

select is(
  (select count(*)::int from milestones where id in ('00000000-0000-4000-8000-000000000a01','00000000-0000-4000-8000-000000000a02')),
  1, 'a customer sees milestones for their own event only');

select is(
  (select count(*)::int from briefing_responses where id in ('00000000-0000-4000-8000-000000000a03','00000000-0000-4000-8000-000000000a04')),
  1, 'a customer sees briefing responses for their own event only');

select is(
  (select count(*)::int from asset_versions where id in ('00000000-0000-4000-8000-000000000a07','00000000-0000-4000-8000-000000000a08')),
  1, 'a customer sees asset versions for their own event only');

select is(
  (select count(*)::int from asset_annotations where id in ('00000000-0000-4000-8000-000000000a09','00000000-0000-4000-8000-000000000a0a')),
  1, 'a customer sees asset annotations for their own event only');

select is(
  (select count(*)::int from comments where id in ('00000000-0000-4000-8000-000000000a0b','00000000-0000-4000-8000-000000000a0c')),
  1, 'a customer sees comments on their own event only');

select is(
  (select count(*)::int from event_team_members where id in ('00000000-0000-4000-8000-000000000a0d','00000000-0000-4000-8000-000000000a0e')),
  1, 'a customer sees team members on their own event only');

select is(
  (select count(*)::int from hourly_metrics where id in ('00000000-0000-4000-8000-000000000a0f','00000000-0000-4000-8000-000000000a10')),
  1, 'a customer sees hourly metrics for their own event only');

select is(
  (select count(*)::int from audit_entries where id = '00000000-0000-4000-8000-000000000a11'),
  0, 'a customer cannot read the internal audit trail');

-- ── (9-11) Writes stay inside the account boundary ───────────────────
select lives_ok(
  $$insert into comments (event_id, author_id, body)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000020', 'own event')$$,
  'a customer can comment on their own event');

select throws_ok(
  $$insert into comments (event_id, author_id, body)
    values ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-000000000020', 'someone else event')$$,
  '42501',
  null,
  'a customer cannot comment on another account''s event');

select throws_ok(
  $$insert into event_team_members (event_id, email, role_label)
    values ('00000000-0000-4000-8000-0000000000e2', 'sneaky@acme.test', 'Stand lead')$$,
  '42501',
  null,
  'a customer cannot add themselves to another account''s event team');

-- ── (12) Customers may write audit entries (the app logs their actions) ─
select lives_ok(
  $$insert into audit_entries (event_id, actor_id, action, entity_type, entity_id)
    values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000020',
            'asset.uploaded', 'asset', '00000000-0000-4000-8000-000000000a05')$$,
  'a customer action can still be recorded in the audit trail');

-- ── (13-20) Internal staff see both events ───────────────────────────
select _rls_test_as('00000000-0000-4000-8000-000000000011');

select is((select count(*)::int from milestones where id in ('00000000-0000-4000-8000-000000000a01','00000000-0000-4000-8000-000000000a02')), 2,
  'internal staff see milestones across accounts');
select is((select count(*)::int from briefing_responses where id in ('00000000-0000-4000-8000-000000000a03','00000000-0000-4000-8000-000000000a04')), 2,
  'internal staff see briefing responses across accounts');
select is((select count(*)::int from asset_versions where id in ('00000000-0000-4000-8000-000000000a07','00000000-0000-4000-8000-000000000a08')), 2,
  'internal staff see asset versions across accounts');
select is((select count(*)::int from asset_annotations where id in ('00000000-0000-4000-8000-000000000a09','00000000-0000-4000-8000-000000000a0a')), 2,
  'internal staff see asset annotations across accounts');
select is((select count(*)::int from comments where id in ('00000000-0000-4000-8000-000000000a0b','00000000-0000-4000-8000-000000000a0c')), 2,
  'internal staff see comments across accounts');
select is((select count(*)::int from event_team_members where id in ('00000000-0000-4000-8000-000000000a0d','00000000-0000-4000-8000-000000000a0e')), 2,
  'internal staff see event team members across accounts');
select is((select count(*)::int from hourly_metrics where id in ('00000000-0000-4000-8000-000000000a0f','00000000-0000-4000-8000-000000000a10')), 2,
  'internal staff see hourly metrics across accounts');
select is((select count(*)::int from audit_entries where id = '00000000-0000-4000-8000-000000000a11'), 1,
  'internal staff read the audit trail');

-- ── (21) Anonymous callers see none of it ────────────────────────────
select _rls_test_anon();
select is(
  (select
     (select count(*) from milestones)
   + (select count(*) from briefing_responses)
   + (select count(*) from comments)
   + (select count(*) from event_team_members)
   + (select count(*) from asset_versions)
   + (select count(*) from asset_annotations)
   + (select count(*) from hourly_metrics)
   + (select count(*) from audit_entries))::int,
  0,
  'anon reads nothing from the event collaboration tables');

select * from finish();
rollback;
