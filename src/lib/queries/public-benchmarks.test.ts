/** Tests for the public Bright Index benchmark read model. */
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

describe("getPublicBenchmarks", () => {
  it("maps rows to camelCase with nulls preserved", async () => {
    supabase.queueTableResponses("benchmarks", [
      {
        data: [
          {
            event_type: "activation",
            location_tier: "tier_1",
            machine_type: "Bright.Play",
            metric_name: "plays_per_day",
            median_value: 270,
            p25_value: 250,
            p75_value: 300,
            sample_size: 28,
            updated_at: "2026-08-01T00:00:00Z",
          },
          {
            event_type: "activation",
            location_tier: null,
            machine_type: null,
            metric_name: "leads_per_day",
            median_value: 208,
            p25_value: null,
            p75_value: null,
            sample_size: 12,
            updated_at: "2026-08-01T00:00:00Z",
          },
        ],
        error: null,
      },
    ]);

    const { getPublicBenchmarks } = await import("./public-benchmarks");
    const rows = await getPublicBenchmarks();

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      eventType: "activation",
      locationTier: "tier_1",
      medianValue: 270,
      p25Value: 250,
      sampleSize: 28,
    });
    expect(rows[1]).toMatchObject({
      locationTier: null,
      machineType: null,
      p25Value: null,
    });
  });

  it("returns an empty array on query error", async () => {
    supabase.queueTableResponses("benchmarks", [
      { data: null, error: { message: "boom" } },
    ]);

    const { getPublicBenchmarks } = await import("./public-benchmarks");
    expect(await getPublicBenchmarks()).toEqual([]);
  });
});
