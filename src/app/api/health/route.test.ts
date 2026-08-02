/**
 * Tests for /api/health.
 *
 * Two contracts matter: an unreachable database must return 503 (that is what
 * an uptime monitor pages on), and the detailed payload — migration version,
 * job list, commit — must stay behind the CRON_SECRET bearer.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase & { rpc?: ReturnType<typeof vi.fn> };

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/health", { headers });
}

beforeEach(() => {
  vi.stubEnv("CRON_SECRET", "test-cron-secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
  supabase = createMockSupabase();
  supabase.rpc = vi.fn(async () => ({ data: "20260728000004", error: null }));
  supabase.setTableResponse("events", { data: [], error: null });
  supabase.setTableResponse("cron_runs", { data: [], error: null });
});

describe("GET /api/health", () => {
  it("returns 200 and a summary with no credentials", async () => {
    const { GET } = await import("./route");

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database).toBe("ok");
    expect(body.detail).toBeUndefined();
  });

  it("returns 503 when the database is unreachable", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "connection refused" },
    });
    const { GET } = await import("./route");

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database).toBe("unreachable");
  });

  it("withholds the detail block from an unauthenticated caller", async () => {
    const { GET } = await import("./route");

    const body = await (await GET(request())).json();

    expect(body).not.toHaveProperty("detail");
  });

  it("returns migration version and job detail for the cron bearer", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      request({ authorization: "Bearer test-cron-secret" })
    );
    const body = await response.json();

    expect(body.detail.migrationVersion).toBe("20260728000004");
    expect(body.detail.jobs).toHaveLength(5);
  });

  it("rejects a wrong bearer as if it were absent", async () => {
    const { GET } = await import("./route");

    const body = await (
      await GET(request({ authorization: "Bearer wrong" }))
    ).json();

    expect(body).not.toHaveProperty("detail");
  });

  it("reports degraded when a job has gone stale", async () => {
    const longAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    supabase.setTableResponse("cron_runs", {
      data: [
        {
          job: "digest",
          last_run_at: longAgo,
          last_status: "ok",
          last_detail: {},
          run_count: 3,
          consecutive_failures: 0,
        },
      ],
      error: null,
    });
    const { GET } = await import("./route");

    const response = await GET(request());
    const body = await response.json();

    // Still serving, so still 200 — the body is what you alert on.
    expect(response.status).toBe(200);
    expect(body.status).toBe("degraded");
    expect(body.checks.cron).toBe("degraded");
  });

  it("never caches, so a monitor always sees live state", async () => {
    const { GET } = await import("./route");

    const response = await GET(request());

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
