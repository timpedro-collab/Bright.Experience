#!/usr/bin/env node
/**
 * Fails when a table carrying an RLS policy has no pgTAP coverage.
 *
 * The failure mode this guards against: someone adds `create policy` in a
 * migration, the policy is subtly wrong (a `using (true)`, a missing account
 * scope), and nothing in CI notices because RLS is only exercised by the
 * handful of tables that already have tests. Every policy is an access-control
 * decision, so every table that has one needs a test that fails when it breaks.
 *
 * A table counts as covered when its name appears anywhere in a file under
 * `supabase/tests/` — one file often covers a domain (`rls_telemetry.sql`
 * covers four tables), so filename matching would be too strict.
 *
 * Tables listed in `supabase/tests/.policy-coverage-baseline` are known,
 * accepted debt. The list may only shrink: adding to it is a deliberate act
 * that shows up in review.
 *
 * Usage: node scripts/check-policy-tests.mjs
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const testsDir = join(root, "supabase", "tests");
const baselineFile = join(testsDir, ".policy-coverage-baseline");

/** Every table named by a `create policy ... on <table>` in the migrations. */
function tablesWithPolicies() {
  const tables = new Map(); // table -> first migration that gave it a policy
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    // `create policy "name" on public.foo` / `on foo` / `on storage.objects`
    const re = /create\s+policy\s+(?:"[^"]+"|[a-z0-9_]+)\s+on\s+([a-z0-9_."]+)/gi;
    for (const match of sql.matchAll(re)) {
      const qualified = match[1].replace(/"/g, "").toLowerCase();
      const [schema, name] = qualified.includes(".")
        ? qualified.split(".")
        : ["public", qualified];
      // storage.objects policies are covered by rls_storage_objects.test.sql,
      // which talks about buckets rather than the table name.
      const table = schema === "public" ? name : `${schema}.${name}`;
      if (!tables.has(table)) tables.set(table, file);
    }
  }
  return tables;
}

/** Concatenated text of every pgTAP test, lower-cased for matching. */
function testCorpus() {
  if (!existsSync(testsDir)) return "";
  return readdirSync(testsDir)
    .filter((f) => f.endsWith(".sql") || f.endsWith(".psql"))
    .map((f) => readFileSync(join(testsDir, f), "utf8"))
    .join("\n")
    .toLowerCase();
}

function readBaseline() {
  if (!existsSync(baselineFile)) return new Set();
  return new Set(
    readFileSync(baselineFile, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
  );
}

const policies = tablesWithPolicies();
const corpus = testCorpus();
const baseline = readBaseline();

const uncovered = [];
const coveredButBaselined = [];

for (const [table, migration] of policies) {
  const needle = table.includes(".") ? table.split(".")[1] : table;
  // Word-boundary match so `leads` doesn't match `sales_leads_archive`.
  const covered = new RegExp(`\\b${needle}\\b`).test(corpus);
  if (covered && baseline.has(table)) coveredButBaselined.push(table);
  if (!covered && !baseline.has(table)) uncovered.push({ table, migration });
}

if (coveredButBaselined.length > 0) {
  console.log(
    `${coveredButBaselined.length} table(s) now have pgTAP coverage and can be removed ` +
      `from supabase/tests/.policy-coverage-baseline:\n  ` +
      coveredButBaselined.join("\n  ")
  );
}

if (uncovered.length > 0) {
  console.error(
    `\n${uncovered.length} table(s) carry an RLS policy with no pgTAP test:\n` +
      uncovered.map((u) => `  ${u.table}  (policy added in ${u.migration})`).join("\n") +
      `\n\nAdd assertions to a file under supabase/tests/ that fail when the policy ` +
      `is broken — see supabase/tests/README.md. Do not add to the baseline unless ` +
      `you are deliberately accepting the risk.\n`
  );
  process.exit(1);
}

console.log(
  `RLS policy coverage OK — ${policies.size} table(s) with policies, ` +
    `${baseline.size} on the accepted-debt baseline.`
);
