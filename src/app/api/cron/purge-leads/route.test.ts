/**
 * Tests for the lead retention purge cron — auth, per-event windows, and the
 * default sweep for unconfigured events.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const SECRET = "test-cron-secret";

function cronRequest(auth?: string) {
  return new Request("http://localhost/api/cron/purge-leads", {
    headers: auth ? { authorization: auth } : {},
  });
}

beforeEach(() => {
  supabase = createMockSupabase();
  process.env.CRON_SECRET = SECRET;
});

describe("GET /api/cron/purge-leads", () => {
  it("rejects a caller without the cron bearer", async () => {
    const { GET } = await import("./route");
    const res = await GET(cronRequest());
    expect(res.status).toBe(401);
  });

  it("rejects a caller with the wrong bearer", async () => {
    const { GET } = await import("./route");
    const res = await GET(cronRequest("Bearer wrong"));
    expect(res.status).toBe(401);
  });

  it("purges leads past a configured event's own retention window", async () => {
    supabase.setTableResponse("game_configurations", {
      data: [{ event_id: "e1", retention_days: 30 }],
      error: null,
    });
    supabase.setTableResponse("leads", {
      data: [{ id: "l1", event_id: "e1" }],
      error: null,
    });

    const { GET } = await import("./route");
    const res = await GET(cronRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.purged).toBeGreaterThanOrEqual(1);

    const calls = supabase.callsFor("leads");
    expect(calls.find((c) => c.method === "delete")).toBeDefined();
    // The cutoff must reflect the event's 30-day window, not the default 60.
    const lt = calls.find((c) => c.method === "lt" && c.args[0] === "captured_at");
    expect(lt).toBeDefined();
    const cutoffMs = new Date(lt!.args[1] as string).getTime();
    const expected = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoffMs - expected)).toBeLessThan(60_000);
  });

  it("skips configured events in the default sweep so longer windows hold", async () => {
    // e1 keeps leads for 365 days — its stale-by-default-window lead must
    // NOT be deleted by the fallback sweep.
    supabase.setTableResponse("game_configurations", {
      data: [{ event_id: "e1", retention_days: 365 }],
      error: null,
    });
    supabase.setTableResponse("leads", {
      data: [{ id: "l1", event_id: "e1" }],
      error: null,
    });

    const { GET } = await import("./route");
    const res = await GET(cronRequest(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);

    // The default sweep deletes by id batch (`in`); the only lead belongs to
    // a configured event, so no id-batch delete may be issued.
    const inCall = supabase
      .callsFor("leads")
      .find((c) => c.method === "in" && c.args[0] === "id");
    expect(inCall).toBeUndefined();
  });

  it("purges unconfigured events on the default window", async () => {
    supabase.setTableResponse("game_configurations", { data: [], error: null });
    supabase.setTableResponse("leads", {
      data: [{ id: "l9", event_id: "e-unconfigured" }],
      error: null,
    });

    const { GET } = await import("./route");
    const res = await GET(cronRequest(`Bearer ${SECRET}`));
    const body = await res.json();
    expect(body.purged).toBe(1);

    const inCall = supabase
      .callsFor("leads")
      .find((c) => c.method === "in" && c.args[0] === "id");
    expect(inCall).toBeDefined();
    expect(inCall!.args[1]).toEqual(["l9"]);
  });
});
