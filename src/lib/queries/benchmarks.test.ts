/**
 * Tests for the benchmark read used by pre-show expectations.
 *
 * The matching rules live in lib/metrics/expected-performance, so what matters
 * here is that the query hands that module every row for the event type and
 * never throws a missing table at a page that is only decorating a card.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

const ROW = {
  id: "b1",
  event_type: "trade_show",
  location_tier: "tier_1",
  machine_type: "Bright.Play",
  metric_name: "plays_per_day",
  avg_value: 240,
  median_value: 235,
  p25_value: 180,
  p75_value: 300,
  sample_size: 12,
  updated_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getBenchmarksForEventType", () => {
  it("returns camelCase benchmarks for the event type", async () => {
    supabase.setTableResponse("benchmarks", { data: [ROW], error: null });
    const { getBenchmarksForEventType } = await import("./benchmarks");

    const rows = await getBenchmarksForEventType("trade_show");

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      machineType: "Bright.Play",
      metricName: "plays_per_day",
      p25Value: 180,
      p75Value: 300,
      sampleSize: 12,
    });
  });

  it("filters on event type only, so machine fallback still has rows to use", async () => {
    supabase.setTableResponse("benchmarks", { data: [ROW], error: null });
    const { getBenchmarksForEventType } = await import("./benchmarks");

    await getBenchmarksForEventType("trade_show");

    const filters = supabase
      .callsFor("benchmarks")
      .filter((c) => c.method === "eq")
      .map((c) => c.args);
    expect(filters).toEqual([["event_type", "trade_show"]]);
  });

  it("returns nothing rather than throwing when the read fails", async () => {
    supabase.setTableResponse("benchmarks", {
      data: null,
      error: { message: "permission denied" },
    });
    const { getBenchmarksForEventType } = await import("./benchmarks");

    expect(await getBenchmarksForEventType("trade_show")).toEqual([]);
  });
});
