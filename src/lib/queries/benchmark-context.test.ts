/** Tests for benchmark context loading on event reports. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/observability/log-query-error", () => ({
  logQueryError: vi.fn(),
}));

const EVENT_ID = "11111111-1111-4111-8111-111111111111";
const PRIOR_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

describe("getBenchmarkContext", () => {
  it("returns last-event and venue-class verdicts when data exists", async () => {
    supabase.queueTableResponses("events", [
      {
        data: {
          id: EVENT_ID,
          account_id: "acct-1",
          event_type: "activation",
          machine_type: "Bright.Play",
          event_date_start: "2026-06-01",
          event_date_end: "2026-06-03",
          name: "Summer Show",
        },
        error: null,
      },
      {
        data: [
          {
            id: PRIOR_ID,
            name: "Spring Show",
            event_date_start: "2026-03-01",
            event_date_end: "2026-03-01",
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: [
          {
            event_id: EVENT_ID,
            snapshot_date: "2026-06-03",
            total_plays: 900,
            total_leads: 180,
            avg_dwell_time: 45,
          },
          {
            event_id: PRIOR_ID,
            snapshot_date: "2026-03-01",
            total_plays: 600,
            total_leads: 150,
            avg_dwell_time: 40,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("benchmarks", [
      {
        data: [
          {
            id: "b1",
            event_type: "activation",
            location_tier: null,
            machine_type: "Bright.Play",
            game_type: null,
            metric_name: "plays_per_day",
            avg_value: 280,
            median_value: 250,
            p25_value: 200,
            p75_value: 300,
            sample_size: 12,
            updated_at: "2026-06-01T00:00:00Z",
          },
          {
            id: "b2",
            event_type: "activation",
            location_tier: null,
            machine_type: "Bright.Play",
            game_type: null,
            metric_name: "leads_per_day",
            avg_value: 55,
            median_value: 50,
            p25_value: 40,
            p75_value: 60,
            sample_size: 12,
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
        error: null,
      },
    ]);

    const { getBenchmarkContext } = await import("./benchmark-context");
    const context = await getBenchmarkContext(EVENT_ID);

    expect(context.lastEvent?.eventName).toBe("Spring Show");
    expect(context.lastEvent?.verdicts.some((v) => v.metric === "plays")).toBe(
      true,
    );
    expect(context.venueClass?.sampleSize).toBe(12);
    expect(context.venueClass?.verdicts.some((v) => v.metric === "leads")).toBe(
      true,
    );
  });

  it("returns null groups when the event or snapshots are missing", async () => {
    supabase.queueTableResponses("events", [
      { data: null, error: { message: "not found" } },
    ]);

    const { getBenchmarkContext } = await import("./benchmark-context");
    const context = await getBenchmarkContext(EVENT_ID);

    expect(context).toEqual({ lastEvent: null, venueClass: null });
  });

  it("skips the prior-event group when no completed predecessor has a snapshot", async () => {
    supabase.queueTableResponses("events", [
      {
        data: {
          id: EVENT_ID,
          account_id: "acct-1",
          event_type: "activation",
          machine_type: "Bright.Play",
          event_date_start: "2026-06-01",
          event_date_end: "2026-06-01",
          name: "Summer Show",
        },
        error: null,
      },
      {
        data: [
          {
            id: PRIOR_ID,
            name: "Spring Show",
            event_date_start: "2026-03-01",
            event_date_end: "2026-03-01",
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: [
          {
            event_id: EVENT_ID,
            snapshot_date: "2026-06-01",
            total_plays: 300,
            total_leads: 60,
            avg_dwell_time: 30,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("benchmarks", [
      {
        data: [
          {
            id: "b1",
            event_type: "activation",
            machine_type: "Bright.Play",
            metric_name: "plays_per_day",
            median_value: 250,
            sample_size: 8,
            updated_at: "2026-06-01T00:00:00Z",
          },
        ],
        error: null,
      },
    ]);

    const { getBenchmarkContext } = await import("./benchmark-context");
    const context = await getBenchmarkContext(EVENT_ID);

    expect(context.lastEvent).toBeNull();
    expect(context.venueClass?.verdicts).toHaveLength(1);
  });
});
