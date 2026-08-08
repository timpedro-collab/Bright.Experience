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
  it("sums daily snapshots into event-to-date totals per event", async () => {
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

    expect(map.get("e1")).toEqual({ totalPlays: 910, totalLeads: 252 });
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

describe("getEventMetricTotals", () => {
  it("sums plays/leads across days and reads stock from the latest day", async () => {
    supabase.setTableResponse("event_metrics_snapshot", {
      data: [
        {
          snapshot_date: "2026-08-01",
          total_plays: 400,
          total_interactions: 800,
          total_leads: 90,
          total_prizes: 40,
          avg_dwell_time: 60,
          peak_hour: 13,
          stock_remaining: 300,
          stock_capacity: 500,
        },
        {
          snapshot_date: "2026-08-02",
          total_plays: 500,
          total_interactions: 1000,
          total_leads: 110,
          total_prizes: 50,
          avg_dwell_time: 80,
          peak_hour: 15,
          stock_remaining: 120,
          stock_capacity: 500,
        },
      ],
      error: null,
    });

    const { getEventMetricTotals } = await import("./event-metrics");
    const totals = await getEventMetricTotals("e1");

    expect(totals).toEqual({
      totalPlays: 900,
      totalLeads: 200,
      totalInteractions: 1800,
      totalPrizes: 90,
      avgDwellTime: 70,
      stockRemaining: 120,
      stockCapacity: 500,
      peakHour: 15,
      snapshotCount: 2,
    });
  });

  it("returns null when the event has no snapshots yet", async () => {
    supabase.setTableResponse("event_metrics_snapshot", {
      data: [],
      error: null,
    });

    const { getEventMetricTotals } = await import("./event-metrics");
    expect(await getEventMetricTotals("e1")).toBeNull();
  });

  it("returns null on query error", async () => {
    supabase.setTableResponse("event_metrics_snapshot", {
      data: null,
      error: { message: "boom" },
    });

    const { getEventMetricTotals } = await import("./event-metrics");
    expect(await getEventMetricTotals("e1")).toBeNull();
  });
});
