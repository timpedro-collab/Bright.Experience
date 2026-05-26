# RLS policy tests (pgTAP)

These files exercise the Row-Level Security policies declared in
`supabase/migrations/`. Each test is a self-contained transaction —
fixtures are seeded inside the `begin;` block and rolled back at
the end, so the tests can run repeatedly against a single database
and leave no trace.

## Conventions

- Every file starts with `\i tests/_fixtures.sql` to seed the shared
  set of accounts, profiles and events.
- `_rls_test_as(user_id)` switches the active JWT to mimic a logged-in
  user. The fixture file defines five canonical personas — see the
  header comment in `_fixtures.sql`.
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
2. Open a `begin;` transaction and `\i tests/_fixtures.sql`.
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
