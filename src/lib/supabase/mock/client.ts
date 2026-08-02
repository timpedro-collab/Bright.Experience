/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory mock of the Supabase JS client. Implements the subset of the
 * PostgREST query builder, auth, storage and rpc surface the app uses, backed
 * by ./store. Designed to never throw: unknown shapes degrade to empty
 * results rather than crashing a page.
 *
 * Auth is cookie-based (see ./flag MOCK_COOKIE): "logging in" with any seeded
 * email sets the cookie to that profile's id; getUser() reads it back. Any
 * password is accepted.
 */

import { MOCK_COOKIE } from "./flag";
import { getRelation } from "./relationships";
import { parseSelect, projectRow, type Field } from "./select";
import { getTable, newId, type MockRow } from "./store";

const INTERNAL_DEFAULT_ID = "11111111-1111-1111-1111-111111111111"; // Tim Pedro (events_lead)

type Result = { data: any; error: any; count: number | null };

type SimpleFilter = { type: "simple"; col: string; op: string; val: any };
type InFilter = { type: "in"; col: string; vals: any[] };
type NotFilter = { type: "not"; col: string; op: string; val: any };
type OrFilter = { type: "or"; clauses: { col: string; op: string; val: string }[] };
type ContainsFilter = { type: "contains"; col: string; val: any };
type Filter = SimpleFilter | InFilter | NotFilter | OrFilter | ContainsFilter;

// ── value helpers ──────────────────────────────────────────────────────────

const OPS = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in", "cs", "cd"]);

function resolveValue(table: string, row: MockRow, path: string): any {
  if (!path.includes(".")) return row[path];
  const [rel, ...rest] = path.split(".");
  const spec = getRelation(table, rel);
  if (!spec) return undefined;
  const fr = getTable(spec.foreignTable).find((r) => r[spec.foreignKey] === row[spec.localKey]);
  return fr ? fr[rest.join(".")] : undefined;
}

function looseEq(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function cmp(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulls last
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function ilikeRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp("^" + escaped + "$", "i");
}

function parseList(raw: string): string[] {
  return String(raw)
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0);
}

function coerce(v: any): any {
  if (v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
}

function matchClause(table: string, row: MockRow, col: string, op: string, val: any): boolean {
  const a = resolveValue(table, row, col);
  switch (op) {
    case "eq":
      return looseEq(a, coerce(val));
    case "neq":
      return !looseEq(a, coerce(val));
    case "gt":
      return cmp(a, val) > 0;
    case "gte":
      return cmp(a, val) >= 0;
    case "lt":
      return cmp(a, val) < 0;
    case "lte":
      return cmp(a, val) <= 0;
    case "like":
    case "ilike":
      return a != null && ilikeRegex(String(val)).test(String(a));
    case "is": {
      const target = coerce(val);
      return target === null ? a == null : a === target;
    }
    case "in":
      return parseList(typeof val === "string" ? val : `(${(val as any[]).join(",")})`).some((v) => looseEq(a, v));
    case "cs": // contains
      return containsMatch(a, val);
    default:
      return true;
  }
}

function containsMatch(a: any, val: any): boolean {
  if (a == null) return false;
  let needle = val;
  if (typeof val === "string") {
    try {
      needle = JSON.parse(val);
    } catch {
      /* leave as string */
    }
  }
  if (Array.isArray(a)) {
    if (Array.isArray(needle)) return needle.every((n) => a.includes(n));
    return a.includes(needle);
  }
  if (typeof a === "object" && needle && typeof needle === "object") {
    return Object.entries(needle).every(([k, v]) => (a as any)[k] === v);
  }
  return false;
}

function matchFilter(table: string, row: MockRow, f: Filter): boolean {
  switch (f.type) {
    case "simple":
      return matchClause(table, row, f.col, f.op, f.val);
    case "in":
      return f.vals.some((v) => looseEq(resolveValue(table, row, f.col), v));
    case "not":
      return !matchClause(table, row, f.col, f.op, f.val);
    case "contains":
      return containsMatch(resolveValue(table, row, f.col), f.val);
    case "or":
      return f.clauses.some((c) => matchClause(table, row, c.col, c.op, c.val));
    default:
      return true;
  }
}

function parseOrClauses(input: string): { col: string; op: string; val: string }[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") {
      depth++;
      cur += ch;
    } else if (ch === ")") {
      depth--;
      cur += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) parts.push(cur);

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .map((clause) => {
      const tokens = clause.split(".");
      const opIdx = tokens.findIndex((t) => OPS.has(t));
      if (opIdx === -1) return { col: tokens[0], op: "eq", val: tokens.slice(1).join(".") };
      return {
        col: tokens.slice(0, opIdx).join("."),
        op: tokens[opIdx],
        val: tokens.slice(opIdx + 1).join("."),
      };
    });
}

// ── query builder ────────────────────────────────────────────────────────────

class MockQuery implements PromiseLike<Result> {
  private table: string;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: any = null;
  private fields: Field[] | null = null;
  private filters: Filter[] = [];
  private orders: { col: string; ascending: boolean }[] = [];
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private limitN: number | null = null;
  private countExact = false;
  private head = false;
  private _single = false;
  private _maybeSingle = false;
  private selectRequested = false;
  private upsertOnConflict?: string;
  private upsertIgnoreDuplicates = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    this.fields = parseSelect(cols || "*");
    if (opts?.count) this.countExact = true;
    if (opts?.head) this.head = true;
    if (this.op !== "select") this.selectRequested = true;
    return this;
  }

  insert(payload: any) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  upsert(payload: any, opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.op = "upsert";
    this.payload = payload;
    this.upsertOnConflict = opts?.onConflict;
    this.upsertIgnoreDuplicates = opts?.ignoreDuplicates ?? false;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "eq", val });
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "neq", val });
    return this;
  }
  gt(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "gt", val });
    return this;
  }
  gte(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "gte", val });
    return this;
  }
  lt(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "lt", val });
    return this;
  }
  lte(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "lte", val });
    return this;
  }
  like(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "like", val });
    return this;
  }
  ilike(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "ilike", val });
    return this;
  }
  is(col: string, val: any) {
    this.filters.push({ type: "simple", col, op: "is", val });
    return this;
  }
  in(col: string, vals: any[]) {
    this.filters.push({ type: "in", col, vals });
    return this;
  }
  contains(col: string, val: any) {
    this.filters.push({ type: "contains", col, val });
    return this;
  }
  not(col: string, op: string, val: any) {
    this.filters.push({ type: "not", col, op, val });
    return this;
  }
  or(filterStr: string) {
    this.filters.push({ type: "or", clauses: parseOrClauses(filterStr) });
    return this;
  }
  filter(col: string, op: string, val: any) {
    this.filters.push({ type: "simple", col, op, val });
    return this;
  }
  match(criteria: Record<string, any>) {
    for (const [col, val] of Object.entries(criteria)) {
      this.filters.push({ type: "simple", col, op: "eq", val });
    }
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending !== false });
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this._single = true;
    return this;
  }
  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  private matched(): MockRow[] {
    const arr = getTable(this.table);
    if (this.filters.length === 0) return arr.slice();
    return arr.filter((r) => this.filters.every((f) => matchFilter(this.table, r, f)));
  }

  private finishSelect(): Result {
    let rows = this.matched();
    const total = rows.length;
    for (const o of [...this.orders].reverse()) {
      rows.sort((a, b) => cmp(resolveValue(this.table, a, o.col), resolveValue(this.table, b, o.col)) * (o.ascending ? 1 : -1));
    }
    if (this.rangeFrom != null) rows = rows.slice(this.rangeFrom, (this.rangeTo ?? rows.length) + 1);
    if (this.limitN != null) rows = rows.slice(0, this.limitN);

    const fields = this.fields ?? [{ kind: "col", name: "*" } as Field];
    const data = this.head ? null : rows.map((r) => projectRow(this.table, r, fields, getTable));

    if (this._single || this._maybeSingle) {
      const first = (data && data[0]) || null;
      const error = !first && this._single ? { message: "No rows found", code: "PGRST116" } : null;
      return { data: first, error, count: this.countExact ? total : null };
    }
    return { data: data ?? [], error: null, count: this.countExact ? total : null };
  }

  private doWrite(): MockRow[] {
    const arr = getTable(this.table);
    const now = new Date().toISOString();

    if (this.op === "insert" || this.op === "upsert") {
      const rows: MockRow[] = Array.isArray(this.payload) ? this.payload : [this.payload];
      const keys = (this.upsertOnConflict ?? "id").split(",").map((s) => s.trim());
      const affected: MockRow[] = [];
      for (const p of rows) {
        if (this.op === "upsert") {
          // NULL conflict keys match each other here, which mirrors the
          // `nulls not distinct` indexes we actually upsert against
          // (benchmarks). A plain unique index treats NULLs as distinct, so
          // any caller relying on that must pass a non-null key — the
          // telemetry ingest always does.
          const existing = arr.find((r) => keys.every((k) => r[k] === (p as any)[k]));
          if (existing) {
            // ignoreDuplicates is PostgREST's `do nothing`: the stored row wins.
            if (!this.upsertIgnoreDuplicates) Object.assign(existing, p, { updated_at: now });
            affected.push(existing);
            continue;
          }
        }
        const row: MockRow = { ...p };
        if (row.id == null) row.id = newId();
        if (!("created_at" in row)) row.created_at = now;
        if (!("updated_at" in row)) row.updated_at = now;
        arr.push(row);
        affected.push(row);
      }
      return affected;
    }

    if (this.op === "update") {
      const affected: MockRow[] = [];
      for (const r of arr) {
        if (this.filters.length && this.filters.every((f) => matchFilter(this.table, r, f))) {
          Object.assign(r, this.payload, { updated_at: now });
          affected.push(r);
        }
      }
      return affected;
    }

    if (this.op === "delete") {
      if (this.filters.length === 0) return []; // never wipe a whole table
      const removed: MockRow[] = [];
      const keep: MockRow[] = [];
      for (const r of arr) {
        if (this.filters.every((f) => matchFilter(this.table, r, f))) removed.push(r);
        else keep.push(r);
      }
      arr.length = 0;
      arr.push(...keep);
      return removed;
    }

    return [];
  }

  private settle(): Result {
    try {
      if (this.op === "select") return this.finishSelect();
      const affected = this.doWrite();
      if (this.selectRequested) {
        const fields = this.fields ?? [{ kind: "col", name: "*" } as Field];
        const projected = affected.map((r) => projectRow(this.table, r, fields, getTable));
        if (this._single || this._maybeSingle) {
          return { data: projected[0] ?? null, error: null, count: projected.length };
        }
        return { data: projected, error: null, count: projected.length };
      }
      return { data: null, error: null, count: affected.length };
    } catch (e) {
      return { data: null, error: { message: String(e) }, count: null };
    }
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.settle()).then(onfulfilled, onrejected);
  }
}

// ── rpc ────────────────────────────────────────────────────────────────────

class MockRpc implements PromiseLike<{ data: any; error: any }> {
  constructor(private name: string, private args: any) {}
  select() {
    return this;
  }
  private run(): { data: any; error: any } {
    if (this.name === "count_by_account") {
      const ids: string[] = this.args?.account_ids ?? [];
      const rows = getTable(this.args?.table_name ?? "");
      const data = ids.map((id) => ({ account_id: id, cnt: rows.filter((r) => r.account_id === id).length }));
      return { data, error: null };
    }
    return { data: [], error: null };
  }
  then<T = { data: any; error: any }, E = never>(
    onfulfilled?: ((value: { data: any; error: any }) => T | PromiseLike<T>) | null,
    onrejected?: ((reason: any) => E | PromiseLike<E>) | null,
  ): Promise<T | E> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

// ── auth ─────────────────────────────────────────────────────────────────────

interface CookieAdapter {
  get(): string | null;
  set(v: string): void;
  clear(): void;
}

function makeAuth(adapter: CookieAdapter | null, defaultId: string | null) {
  function currentUser() {
    const id = (adapter ? adapter.get() : null) ?? defaultId;
    if (!id) return null;
    const p = getTable("profiles").find((r) => r.id === id);
    if (!p) return null;
    return {
      id: p.id,
      email: p.email,
      user_metadata: { name: p.name, full_name: p.name, role: p.role, account_id: p.account_id },
      app_metadata: {},
    };
  }

  return {
    async getUser() {
      const user = currentUser();
      return { data: { user }, error: user ? null : { message: "Auth session missing" } };
    },
    async getSession() {
      const user = currentUser();
      return { data: { session: user ? { access_token: "mock", user } : null }, error: null };
    },
    async signInWithPassword({ email }: { email: string; password?: string }) {
      const p = getTable("profiles").find((r) => String(r.email).toLowerCase() === String(email).toLowerCase());
      if (!p) return { data: { user: null, session: null }, error: { message: "Invalid login credentials" } };
      adapter?.set(String(p.id));
      return { data: { user: { id: p.id, email: p.email }, session: { access_token: "mock" } }, error: null };
    },
    async signOut() {
      adapter?.clear();
      return { error: null };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: null };
    },
    async updateUser() {
      return { data: { user: currentUser() }, error: null };
    },
    async exchangeCodeForSession() {
      return { data: { session: null, user: currentUser() }, error: null };
    },
    admin: {
      async inviteUserByEmail(email: string) {
        return { data: { user: { id: newId(), email } }, error: null };
      },
    },
  };
}

// ── storage ────────────────────────────────────────────────────────────────

function makeStorage() {
  return {
    from() {
      return {
        async upload() {
          return { data: { path: "mock/path" }, error: null };
        },
        async createSignedUrl(path: string) {
          return { data: { signedUrl: /^https?:|^\//.test(path) ? path : `/${path}` }, error: null };
        },
        async createSignedUploadUrl(path: string) {
          return { data: { signedUrl: "/mock-upload", token: "mock-token", path }, error: null };
        },
        async list() {
          return { data: [], error: null };
        },
        async remove() {
          return { data: [], error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: /^https?:|^\//.test(path) ? path : `/${path}` } };
        },
      };
    },
  };
}

// ── client factory ────────────────────────────────────────────────────────────

function makeClient(adapter: CookieAdapter | null, defaultId: string | null) {
  return {
    from(table: string) {
      return new MockQuery(table);
    },
    rpc(name: string, args?: any) {
      return new MockRpc(name, args);
    },
    auth: makeAuth(adapter, defaultId),
    storage: makeStorage(),
  };
}

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, opts?: Record<string, unknown>): void;
};

export function createMockServerClient(cookieStore: CookieStore) {
  const adapter: CookieAdapter = {
    get: () => {
      try {
        return cookieStore.get(MOCK_COOKIE)?.value ?? null;
      } catch {
        return null;
      }
    },
    set: (v) => {
      try {
        cookieStore.set(MOCK_COOKIE, v, { path: "/", maxAge: 60 * 60 * 24 * 30 });
      } catch {
        /* read-only context (Server Component) — ignore */
      }
    },
    clear: () => {
      try {
        cookieStore.set(MOCK_COOKIE, "", { path: "/", maxAge: 0 });
      } catch {
        /* ignore */
      }
    },
  };
  return makeClient(adapter, null);
}

export function createMockBrowserClient() {
  const adapter: CookieAdapter = {
    get: () => readBrowserCookie(MOCK_COOKIE),
    set: (v) => {
      document.cookie = `${MOCK_COOKIE}=${encodeURIComponent(v)};path=/;max-age=${60 * 60 * 24 * 30}`;
    },
    clear: () => {
      document.cookie = `${MOCK_COOKIE}=;path=/;max-age=0`;
    },
  };
  return makeClient(adapter, null);
}

export function createMockServiceClient() {
  return makeClient(null, INTERNAL_DEFAULT_ID);
}
