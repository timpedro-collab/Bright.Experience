/**
 * Supabase test double.
 *
 * `createMockSupabase()` returns an object that responds to the same
 * chainable API the real client uses — `.from().select().eq().single()`
 * etc — but every chain method just records what was called and
 * resolves to the response you queued.
 *
 * Design notes:
 *   - Every chain method returns the same recorder, so chains of any
 *     depth resolve at the end with `.then(...)` (i.e. when awaited)
 *   - You queue responses *per-table* via `mock.setTableResponse("events",
 *     { data: [...], error: null })` — the recorder reads them on the
 *     final await
 *   - For `.maybeSingle()` and `.single()` we honour the queue identically
 *     and let the calling code decide what to do with array vs single
 *
 * This is deliberately *lightweight*. We are not re-implementing
 * PostgREST. We are giving you a way to drive code paths and assert on
 * the recorded chain calls.
 */

import { vi } from "vitest";

type QueryResult = { data?: unknown; error?: unknown; count?: number | null };

export interface MockSupabase {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  storage: {
    from: ReturnType<typeof vi.fn>;
  };
  /** Queue a default response for any table not explicitly set. */
  setDefaultResponse: (response: QueryResult) => void;
  /** Queue a response for a specific table. */
  setTableResponse: (table: string, response: QueryResult) => void;
  /**
   * Queue responses for consecutive queries against one table, in call order.
   * For actions that read a table and then write it (look up a clash, then
   * insert), where a single per-table response can't describe both.
   *
   * Once the list is exhausted the last entry repeats, so a trailing
   * revalidation read doesn't fall off the end.
   */
  queueTableResponses: (table: string, responses: QueryResult[]) => void;
  /** Queue an authenticated user for `auth.getUser()`. */
  setUser: (user: { id: string; email?: string } | null) => void;
  /** Inspect the chain calls made on a particular table. */
  callsFor: (table: string) => Array<{ method: string; args: unknown[] }>;
}

export function createMockSupabase(): MockSupabase {
  let defaultResponse: QueryResult = { data: null, error: null };
  const tableResponses = new Map<string, QueryResult>();
  const tableQueues = new Map<string, QueryResult[]>();
  const tableCalls = new Map<string, Array<{ method: string; args: unknown[] }>>();
  let currentUser: { id: string; email?: string } | null = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "test@brightblue.test",
  };

  /**
   * The response for the next settled query on a table: the head of its queue
   * if one was set (keeping the last entry once drained), else its single
   * response, else the default.
   */
  function nextResponse(table: string): QueryResult {
    const queue = tableQueues.get(table);
    if (queue && queue.length > 0) {
      return queue.length === 1 ? queue[0] : (queue.shift() as QueryResult);
    }
    return tableResponses.get(table) ?? defaultResponse;
  }

  function builderFor(table: string) {
    if (!tableCalls.has(table)) tableCalls.set(table, []);
    const calls = tableCalls.get(table)!;

    const builder: Record<string, unknown> = {};
    const chainMethods = [
      "select", "insert", "update", "upsert", "delete",
      "eq", "neq", "gt", "gte", "lt", "lte",
      "like", "ilike", "is", "in", "contains", "containedBy",
      "rangeGt", "rangeGte", "rangeLt", "rangeLte", "rangeAdjacent",
      "overlaps", "textSearch", "match", "not", "or", "filter",
      "order", "limit", "range", "abortSignal", "explain",
      "csv", "geojson", "returns", "throwOnError",
    ];
    for (const method of chainMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      });
    }

    const settleMethods = ["single", "maybeSingle"];
    for (const method of settleMethods) {
      builder[method] = vi.fn((...args: unknown[]) => {
        calls.push({ method, args });
        return Promise.resolve(nextResponse(table));
      });
    }

    // Awaiting the builder itself resolves with the queued response.
    builder.then = (resolve: (value: QueryResult) => unknown) =>
      Promise.resolve(nextResponse(table)).then(resolve);

    return builder;
  }

  const from = vi.fn((table: string) => builderFor(table));

  const storageBuilder = {
    upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
    download: vi.fn().mockResolvedValue({ data: null, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    list: vi.fn().mockResolvedValue({ data: [], error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.local/file" } }),
    createSignedUrl: vi.fn().mockResolvedValue({
      data: { signedUrl: "https://test.local/signed" },
      error: null,
    }),
  };

  return {
    from,
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: currentUser },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    storage: {
      from: vi.fn(() => storageBuilder),
    },
    setDefaultResponse(response) {
      defaultResponse = response;
    },
    setTableResponse(table, response) {
      tableResponses.set(table, response);
    },
    queueTableResponses(table, responses) {
      tableQueues.set(table, [...responses]);
    },
    setUser(user) {
      currentUser = user;
    },
    callsFor(table) {
      return tableCalls.get(table) ?? [];
    },
  };
}
