/** Tests for the multi-event metrics comparison read. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

describe("getLatestMetricsForEvents", () => {
  it("keeps only the latest snapshot per event", async () => {
    supabase.setTableResponse("event_metrics_snapshot", {
      data: [
        { event_id: "e1", snapshot_date: "2026-08-02", total_plays: 900, total_leads: 250 },
        { event_id: "e2", snapshot_date: "2026-08-01", total_plays: 400, total_leads: 90 },
        { event_id: "e1", snapshot_date: "2026-07-01", total_plays: 10, total_leads: 2 },
      ],
      error: null,
    });

    const { getLatestMetricsForEvents } = await import("./event-metrics");
    const map = await getLatestMetricsForEvents(["e1", "e2"]);

    expect(map.get("e1")).toEqual({ totalPlays: 900, totalLeads: 250 });
    expect(map.get("e2")).toEqual({ totalPlays: 400, totalLeads: 90 });
  });

  it("returns an empty map without querying when no ids are given", async () => {
    const { getLatestMetricsForEvents } = await import("./event-metrics");
    const map = await getLatestMetricsForEvents([]);

    expect(map.size).toBe(0);
    expect(supabase.callsFor("event_metrics_snapshot")).toHaveLength(0);
  });

  it("returns an empty map on query error", async () => {
    supabase.setTableResponse("event_metrics_snapshot", {
      data: null,
      error: { message: "boom" },
    });

    const { getLatestMetricsForEvents } = await import("./event-metrics");
    const map = await getLatestMetricsForEvents(["e1"]);
    expect(map.size).toBe(0);
  });
});
