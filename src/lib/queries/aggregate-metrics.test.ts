/**
 * Tests for cross-event aggregate metrics.
 *
 * The critical invariant: daily snapshots are CUMULATIVE running totals, so the
 * aggregate must take only each event's latest snapshot — never sum every row
 * (which previously triple-counted a 3-day event, e.g. 1950+4180+6120 = 12,250
 * instead of the true 6,120 / now 665).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getAggregateMetrics", () => {
  it("uses each event's latest cumulative snapshot, not the sum of all snapshots", async () => {
    supabase.setTableResponse("events", {
      data: [{ id: "evt-1" }],
      error: null,
    });
    supabase.setTableResponse("event_metrics_snapshot", {
      data: [
        { event_id: "evt-1", snapshot_date: "2026-03-20", total_plays: 215, total_leads: 72, total_interactions: 290 },
        { event_id: "evt-1", snapshot_date: "2026-03-21", total_plays: 445, total_leads: 148, total_interactions: 600 },
        { event_id: "evt-1", snapshot_date: "2026-03-22", total_plays: 665, total_leads: 222, total_interactions: 898 },
      ],
      error: null,
    });

    const { getAggregateMetrics } = await import("./aggregate-metrics");
    const result = await getAggregateMetrics("acc-1", "2026-01-01", "2026-12-31");

    expect(result.totalEvents).toBe(1);
    expect(result.totalPlays).toBe(665);
    expect(result.totalLeads).toBe(222);
    expect(result.totalInteractions).toBe(898);
  });

  it("sums the latest snapshot across multiple events", async () => {
    supabase.setTableResponse("events", {
      data: [{ id: "evt-1" }, { id: "evt-2" }],
      error: null,
    });
    supabase.setTableResponse("event_metrics_snapshot", {
      data: [
        { event_id: "evt-1", snapshot_date: "2026-03-20", total_plays: 215, total_leads: 72, total_interactions: 290 },
        { event_id: "evt-1", snapshot_date: "2026-03-22", total_plays: 665, total_leads: 222, total_interactions: 898 },
        { event_id: "evt-2", snapshot_date: "2026-04-12", total_plays: 705, total_leads: 235, total_interactions: 952 },
      ],
      error: null,
    });

    const { getAggregateMetrics } = await import("./aggregate-metrics");
    const result = await getAggregateMetrics("acc-1", "2026-01-01", "2026-12-31");

    expect(result.totalEvents).toBe(2);
    expect(result.totalPlays).toBe(665 + 705);
    expect(result.totalLeads).toBe(222 + 235);
    expect(result.totalInteractions).toBe(898 + 952);
  });

  it("returns zeroes when the account has no events in range", async () => {
    supabase.setTableResponse("events", { data: [], error: null });

    const { getAggregateMetrics } = await import("./aggregate-metrics");
    const result = await getAggregateMetrics("acc-1", "2026-01-01", "2026-12-31");

    expect(result).toEqual({
      totalPlays: 0,
      totalLeads: 0,
      totalEvents: 0,
      avgCostPerLead: null,
      totalInteractions: 0,
    });
  });
});
