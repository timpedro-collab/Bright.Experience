/**
 * In-memory store for the mock Supabase client. Loads the seeded dataset once
 * and hands out mutable arrays, so writes during a session (approve an asset,
 * submit a form) persist and show up across views — exactly like a real DB,
 * until the server restarts.
 */

import { MOCK_TABLES } from "./dataset";

export type MockRow = Record<string, unknown>;
type DB = Record<string, MockRow[]>;

let _db: DB | null = null;

export function db(): DB {
  if (!_db) {
    // Deep clone so the original seed module stays pristine and the working
    // copy is freely mutable.
    _db =
      typeof structuredClone === "function"
        ? (structuredClone(MOCK_TABLES) as DB)
        : (JSON.parse(JSON.stringify(MOCK_TABLES)) as DB);
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
