# RLS policy tests (pgTAP)

These files exercise the Row-Level Security policies declared in
`supabase/migrations/`. Each test is a self-contained transaction —
fixtures are seeded inside the `begin;` block and rolled back at
the end, so the tests can run repeatedly against a single database
and leave no trace.

## Conventions

- Every file starts with `\ir _fixtures.psql` to seed the shared
  set of accounts, profiles and events. (`\ir` resolves relative to the
  test file, and the `.psql` extension keeps the shared include from being
  picked up as a standalone test by `supabase test db`.)
- `_rls_test_as(user_id)` switches the active JWT to mimic a logged-in
  user. The fixture file defines five canonical personas — see the
  header comment in `_fixtures.psql`.
- Each file calls `plan(N)` up front and `finish()` at the end so
  pgTAP can report a structured TAP stream.
- All fixture UUIDs are deterministic so assertions can reference
  them by literal.

## Running locally

The Supabase CLI ships a `test db` command that starts a temporary
Postgres, applies every migration, and then runs every `.sql` file
under `supabase/tests/`. From the repo root:

```bash
npm run test:rls
```

Requirements:

- Docker (the CLI starts an ephemeral Postgres container)
- `supabase` CLI 1.140+

## Adding a new test file

1. Pick a table or policy you want to cover.
2. Open a `begin;` transaction and `\ir _fixtures.psql`.
3. Insert any extra fixture rows your scenario needs.
4. Switch personas with `_rls_test_as(user_id)`.
5. Use pgTAP assertions: `is`, `ok`, `throws_ok`, `results_eq`, etc.
6. Always finish with `select * from finish();` and `rollback;`.

## What we cover today

| File                                  | Tables                                                |
| ------------------------------------- | ----------------------------------------------------- |
| `rls_events.sql`                      | `events` (read + write)                               |
| `rls_assets.sql`                      | `assets`                                              |
| `rls_approvals.sql`                   | `approvals` (read + customer update)                  |
| `rls_tasks.sql`                       | `tasks`                                               |
| `rls_notifications.sql`               | `notifications`                                       |
| `rls_notification_preferences.sql`    | `notification_preferences`                            |
| `rls_pipedrive.sql`                   | `pipedrive_outbox`, `pipedrive_config`                |
| `rls_profiles.sql`                    | `profiles`, `accounts`                                |
| `rls_partners.sql`                    | `partners`, `partner_users`, `partner_attributions`   |
| `rls_venues.sql`                      | `venues`, `placements`, `sponsorship_slots`           |
| `rls_quotes.sql`                      | `quotes`, `quote_line_items`                          |
| `rls_catalog.sql`                     | `machines`, `games`, `packages`, `case_studies`       |
| `rls_reports.sql`                     | `event_reports`, `benchmarks`                         |
| `rls_telemetry.sql`                   | `machine_instances`, `telemetry_events`, `leads`, `event_metrics_snapshot` |
| `rls_storage_objects.test.sql`        | `storage.objects` (event-assets, briefings, reports, studio-deliverables) |
| `rls_prospect_sessions.test.sql`      | `prospect_sessions`                                   |
| `rls_helpers.test.sql`                | `is_internal_user()`, `user_account_id()`, `user_partner_id()` |
| `profile_bootstrap.test.sql`          | `handle_new_auth_user()` role/account source          |
| `rls_event_collab.test.sql`           | `milestones`, `briefing_responses`, `comments`, `event_team_members`, `asset_versions`, `asset_annotations`, `hourly_metrics`, `audit_entries` |
| `rls_account_scoped.test.sql`         | `campaigns`, `campaign_events`, `client_compliance_requirements`, `account_payment_preferences`, `api_keys`, `webhook_subscriptions`, `notification_user_settings` |
| `rls_internal_and_public.test.sql`    | `event_templates`, `notification_reminders`, `cron_runs` (internal-only) and `locations`, `machine_games`, `studio_pricing`, `recommendations` (deliberately public) |

Coverage is enforced: `node scripts/check-policy-tests.mjs` (run in CI) fails
when a migration adds a policy to a table no test file mentions. See
`.policy-coverage-baseline` for the accepted-debt escape hatch.

## Writing assertions that survive seed data

`supabase test db` runs against a database that has the demo seed applied, so
never assert on an unqualified `count(*)`. Scope every count to the fixture
rows (`where event_id in (...)`, `where id = '...'`) — an assertion like
`select is((select count(*) from tasks), 3, ...)` passes on an empty database
and fails the moment anyone seeds a row.
