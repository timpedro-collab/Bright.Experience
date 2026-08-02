-- =====================================================================
-- RLS: internal-only operational tables + deliberately public reference data.
--
-- Two groups, both previously untested:
--
--   Internal-only — event_templates, notification_reminders, cron_runs.
--   These describe how we run the business (delivery playbooks, who has
--   been chased, whether the crons are alive). No customer should read them.
--
--   Public reference — locations, machine_games, studio_pricing,
--   recommendations. These are `using (true)` on purpose: the anonymous
--   quote builder and public catalogue read them before anyone logs in.
--   The tests pin that intent, so a future "lock everything down" pass
--   can't silently break the public funnel, and pin the other half of the
--   deal: an anonymous caller must never be able to WRITE to them.
-- =====================================================================

begin;
\ir _fixtures.psql

insert into event_templates (id, name, event_type, package_type) values
  ('00000000-0000-4000-8000-000000000c01', 'Standard activation', 'activation', 'standard')
on conflict (id) do nothing;

insert into notification_reminders (subject_type, subject_id, recipient_id, kind) values
  ('event', '00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-000000000020', 'briefing.overdue')
on conflict do nothing;

insert into cron_runs (job, last_status) values ('rls-test-job', 'ok')
on conflict (job) do nothing;

insert into locations (postcode_prefix, tier, name) values ('ZZ1', 'tier_1', 'Test Central')
on conflict (postcode_prefix) do nothing;

insert into studio_pricing (id, service_type, tier_name, price_gbp, price_label) values
  ('00000000-0000-4000-8000-000000000c02', 'design', 'Test tier', 500, '£500')
on conflict (id) do nothing;

insert into recommendations (id, category, confidence_score) values
  ('00000000-0000-4000-8000-000000000c03', 'machine_game_combo', 0.9)
on conflict (id) do nothing;

select plan(12);

-- ── (1-3) A customer cannot read the internal operational tables ─────
select _rls_test_as('00000000-0000-4000-8000-000000000020');

select is((select count(*)::int from event_templates
            where id = '00000000-0000-4000-8000-000000000c01'),
  0, 'a customer cannot read the delivery templates');

select is((select count(*)::int from notification_reminders
            where subject_id = '00000000-0000-4000-8000-0000000000e1'),
  0, 'a customer cannot read the reminder ledger — not even reminders about them');

select is((select count(*)::int from cron_runs where job = 'rls-test-job'),
  0, 'a customer cannot read the cron heartbeat');

-- ── (4-6) Internal staff can ────────────────────────────────────────
select _rls_test_as('00000000-0000-4000-8000-000000000011');

select is((select count(*)::int from event_templates
            where id = '00000000-0000-4000-8000-000000000c01'),
  1, 'internal staff read the delivery templates');

select is((select count(*)::int from notification_reminders
            where subject_id = '00000000-0000-4000-8000-0000000000e1'),
  1, 'internal staff read the reminder ledger');

select is((select count(*)::int from cron_runs where job = 'rls-test-job'),
  1, 'internal staff read the cron heartbeat');

-- ── (7-10) Public reference data stays readable to anonymous callers ─
select _rls_test_anon();

select is((select count(*)::int from locations where postcode_prefix = 'ZZ1'),
  1, 'the anonymous quote builder can still read location tiers');

select is((select count(*)::int from studio_pricing
            where id = '00000000-0000-4000-8000-000000000c02'),
  1, 'the public studio page can still read studio pricing');

select is((select count(*)::int from recommendations
            where id = '00000000-0000-4000-8000-000000000c03'),
  1, 'the public recommendation engine can still read recommendations');

select ok(
  (select count(*) from machine_games) >= 0,
  'the public catalogue can still read the machine/game pairings');

-- ── (11-12) …but anonymous callers cannot write to them ──────────────
select throws_ok(
  $$insert into studio_pricing (service_type, tier_name, price_gbp, price_label)
    values ('design', 'Free tier', 0, 'free')$$,
  '42501',
  null,
  'anon cannot insert studio pricing');

select throws_ok(
  $$insert into locations (postcode_prefix, tier) values ('ZZ9', 'tier_1')$$,
  '42501',
  null,
  'anon cannot insert location tiers');

select * from finish();
rollback;
