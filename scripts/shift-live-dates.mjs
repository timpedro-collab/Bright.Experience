#!/usr/bin/env node
/**
 * Keep the live demo database evergreen by shifting every date forward.
 *
 * The seed data (supabase/seed.sql + the organizer world) is authored around
 * a fixed "today" — ANCHOR, the same date as AUTHORED_NOW in the mock
 * dataset's shift-dates engine (src/lib/supabase/mock/shift-dates.ts). As
 * real time moves past the anchor the demo rots: "live" events end, deadlines
 * blow through, dashboards show a museum. This script advances every date /
 * timestamp / timestamptz column in the public schema by the number of days
 * between the anchor and today, preserving all relative spacing (a report
 * published 3 days after an event stays 3 days after it).
 *
 * Idempotent: progress is tracked in public.demo_meta (created here), so
 * running it daily, weekly, or after months all land the data on "today".
 *
 * Usage:
 *   SUPABASE_PROJECT_REF=<ref> SUPABASE_ACCESS_TOKEN=<token> \
 *     node scripts/shift-live-dates.mjs [--dry-run]
 *
 * The token is a Supabase personal access token (management API), NOT the
 * service-role key — arbitrary SQL needs the management endpoint.
 */

const ANCHOR = "2026-06-18"; // Mirrors AUTHORED_NOW in the mock dataset.

/**
 * Columns that may legitimately sit in the future (deadlines, event dates,
 * expiries). Every other shifted column is "something that already happened",
 * so any value the shift pushes past now() must have been authored relative
 * to real time (e.g. seed rows using now() - interval) — those get pulled
 * back by the same delta, restoring their original recency.
 */
const FUTURE_ALLOWED = new Set([
  "event_date_start",
  "event_date_end",
  "setup_date",
  "collection_date",
  "start_date",
  "end_date",
  "due_date",
  "due_at",
  "target_date",
  "scheduled_date",
  "snoozed_until",
  "next_send_at",
]);
const isFutureAllowed = (col) => FUTURE_ALLOWED.has(col) || col.endsWith("expires_at");

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF ?? "";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN ?? "";
const DRY_RUN = process.argv.includes("--dry-run");

if (!PROJECT_REF || !ACCESS_TOKEN) {
  console.error(
    "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN. Both are required."
  );
  process.exit(1);
}

/** Run one SQL batch through the Supabase management API. */
async function query(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/** Whole days elapsed from the anchor to now (UTC midnights). */
function daysSinceAnchor() {
  const anchor = Date.UTC(
    Number(ANCHOR.slice(0, 4)),
    Number(ANCHOR.slice(5, 7)) - 1,
    Number(ANCHOR.slice(8, 10))
  );
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - anchor) / 86_400_000);
}

async function main() {
  // 1. Meta table: single row recording how far the data has been shifted.
  await query(`
    create table if not exists public.demo_meta (
      id int primary key check (id = 1),
      anchor_date date not null,
      shifted_days int not null default 0,
      last_shifted_at timestamptz
    );
    insert into public.demo_meta (id, anchor_date, shifted_days)
    values (1, '${ANCHOR}', 0)
    on conflict (id) do nothing;
  `);

  const meta = await query(`select shifted_days from public.demo_meta where id = 1;`);
  const shiftedDays = Number(meta?.[0]?.shifted_days ?? 0);
  const targetDays = daysSinceAnchor();
  const delta = targetDays - shiftedDays;

  console.log(
    `Anchor ${ANCHOR} · already shifted ${shiftedDays}d · target ${targetDays}d · delta ${delta}d`
  );
  if (delta <= 0) {
    console.log("Live data is already up to date — nothing to shift.");
    return;
  }

  // 2. Every shiftable temporal column in the public schema. Generated and
  //    read-only columns are excluded; demo_meta bookkeeping stays fixed.
  const columns = await query(`
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.table_name <> 'demo_meta'
      and c.is_generated = 'NEVER'
      and c.is_updatable = 'YES'
      and c.data_type in ('date', 'timestamp with time zone', 'timestamp without time zone')
    order by c.table_name, c.ordinal_position;
  `);

  const byTable = new Map();
  for (const row of columns) {
    const list = byTable.get(row.table_name) ?? [];
    list.push(row.column_name);
    byTable.set(row.table_name, list);
  }

  console.log(
    `Shifting ${columns.length} columns across ${byTable.size} tables by ${delta} day(s)…`
  );
  if (DRY_RUN) {
    for (const [table, cols] of byTable) console.log(`  ${table}: ${cols.join(", ")}`);
    console.log("Dry run — no changes made.");
    return;
  }

  // 3. One transaction: triggers off (so updated_at stamps and notification
  //    triggers don't fire on a bulk bookkeeping move), shift everything,
  //    clamp already-happened columns back out of the future, record progress.
  const updates = [...byTable.entries()]
    .map(
      ([table, cols]) =>
        `update public."${table}" set ${cols
          .map((c) => `"${c}" = "${c}" + interval '${delta} days'`)
          .join(", ")};`
    )
    .join("\n");

  const clamps = [...byTable.entries()]
    .flatMap(([table, cols]) =>
      cols
        .filter((c) => !isFutureAllowed(c))
        .map(
          (c) =>
            `update public."${table}" set "${c}" = "${c}" - interval '${delta} days' where "${c}" > now();`
        )
    )
    .join("\n");

  await query(`
    begin;
    set local session_replication_role = replica;
    ${updates}
    ${clamps}
    update public.demo_meta
      set shifted_days = ${targetDays}, last_shifted_at = now()
      where id = 1;
    commit;
  `);

  console.log(`Done — live demo data now reads as authored ${targetDays} day(s) later.`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
