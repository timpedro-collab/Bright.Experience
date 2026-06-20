/**
 * In-memory store for the mock Supabase client. Loads the seeded dataset once
 * and hands out mutable arrays, so writes during a session (approve an asset,
 * submit a form) persist and show up across views — exactly like a real DB,
 * until the server restarts.
 */

import { MOCK_TABLES } from "./dataset";
import { EXTRA_TABLES } from "./extra";

export type MockRow = Record<string, unknown>;
type DB = Record<string, MockRow[]>;

let _db: DB | null = null;

/**
 * Merge the supplemental rows in `extra.ts` on top of the generated base
 * dataset. Tables present in both are concatenated (base rows first), so the
 * extra module can both extend existing tables (e.g. add partner-portal
 * profiles) and populate ones the base seed left empty.
 */
function mergeSeed(): DB {
  const merged: DB = {};
  for (const [table, rows] of Object.entries(MOCK_TABLES as DB)) {
    merged[table] = [...rows];
  }
  for (const [table, rows] of Object.entries(EXTRA_TABLES as DB)) {
    merged[table] = [...(merged[table] ?? []), ...rows];
  }
  return merged;
}

export function db(): DB {
  if (!_db) {
    // Deep clone so the original seed module stays pristine and the working
    // copy is freely mutable.
    const seed = mergeSeed();
    _db =
      typeof structuredClone === "function"
        ? (structuredClone(seed) as DB)
        : (JSON.parse(JSON.stringify(seed)) as DB);
  }
  return _db;
}

export function getTable(name: string): MockRow[] {
  const d = db();
  if (!d[name]) d[name] = [];
  return d[name];
}

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return "mock-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}
