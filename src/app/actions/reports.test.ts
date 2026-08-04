/** Tests for report server actions, including benchmark recalculation. */
import { describe, it, expect, beforeEach, vi } from "vitest";

import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const requireInternalUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireInternalUser: (...args: unknown[]) => requireInternalUser(...args),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  requireInternalUser.mockReset().mockResolvedValue({
    supabase,
    profile: { id: "u1", role: "events_lead" },
  });
});

describe("updateBenchmarks", () => {
  it("upserts p25/p75 values and per-day metric rows", async () => {
    supabase.queueTableResponses("events", [
      {
        data: [
          {
            id: "evt-1",
            event_type: "activation",
            machine_type: "Bright.Play",
            event_date_start: "2026-06-01",
            event_date_end: "2026-06-03",
          },
          {
            id: "evt-2",
            event_type: "activation",
            machine_type: "Bright.Play",
            event_date_start: "2026-06-10",
            event_date_end: "2026-06-11",
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: [
          {
            event_id: "evt-1",
            snapshot_date: "2026-06-03",
            total_plays: 900,
            total_leads: 180,
            total_interactions: 720,
            avg_dwell_time: 42,
          },
          {
            event_id: "evt-1",
            snapshot_date: "2026-06-02",
            total_plays: 400,
            total_leads: 80,
            total_interactions: 300,
            avg_dwell_time: 40,
          },
          {
            event_id: "evt-2",
            snapshot_date: "2026-06-11",
            total_plays: 400,
            total_leads: 100,
            total_interactions: 320,
            avg_dwell_time: 38,
          },
        ],
        error: null,
      },
    ]);
    supabase.setTableResponse("benchmarks", { data: null, error: null });

    const { updateBenchmarks } = await import("./reports");
    const result = await updateBenchmarks();

    expect(result.success).toBe(true);

    const upsert = supabase
      .callsFor("benchmarks")
      .find((call) => call.method === "upsert");
    const rows = upsert?.args[0] as Array<Record<string, unknown>>;

    const totalPlays = rows.find((row) => row.metric_name === "total_plays");
    expect(totalPlays?.p25_value).toBeTypeOf("number");
    expect(totalPlays?.p75_value).toBeTypeOf("number");
    expect(totalPlays?.p25_value).not.toBeNull();
    expect(totalPlays?.p75_value).not.toBeNull();

    const playsPerDay = rows.find((row) => row.metric_name === "plays_per_day");
    const leadsPerDay = rows.find((row) => row.metric_name === "leads_per_day");
    expect(playsPerDay).toMatchObject({
      avg_value: 250,
      median_value: 250,
      sample_size: 2,
    });
    expect(leadsPerDay).toMatchObject({
      avg_value: 55,
      median_value: 55,
      sample_size: 2,
    });
  });

  it("sets p25 and p75 equal to the sole value for a single-event group", async () => {
    supabase.queueTableResponses("events", [
      {
        data: [
          {
            id: "evt-1",
            event_type: "activation",
            machine_type: "Bright.Play",
            event_date_start: "2026-06-01",
            event_date_end: "2026-06-01",
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: [
          {
            event_id: "evt-1",
            snapshot_date: "2026-06-01",
            total_plays: 500,
            total_leads: 50,
            total_interactions: 400,
            avg_dwell_time: 35,
          },
        ],
        error: null,
      },
    ]);
    supabase.setTableResponse("benchmarks", { data: null, error: null });

    const { updateBenchmarks } = await import("./reports");
    await updateBenchmarks();

    const upsert = supabase
      .callsFor("benchmarks")
      .find((call) => call.method === "upsert");
    const rows = upsert?.args[0] as Array<Record<string, unknown>>;
    const totalPlays = rows.find((row) => row.metric_name === "total_plays");

    expect(totalPlays).toMatchObject({
      avg_value: 500,
      median_value: 500,
      p25_value: 500,
      p75_value: 500,
      sample_size: 1,
    });
  });

  it("refuses non-commercial roles", async () => {
    requireInternalUser.mockResolvedValue({
      supabase,
      profile: { id: "u2", role: "creative_lead" },
    });

    const { updateBenchmarks } = await import("./reports");
    const result = await updateBenchmarks();

    expect(result).toEqual({
      success: false,
      error: "Only commercial staff can update benchmarks",
    });
  });
});

describe("publishReport", () => {
  it("sets brand_partner_id when a partner id is supplied", async () => {
    supabase.setTableResponse("event_reports", {
      data: { event_id: "evt-1" },
      error: null,
    });

    const { publishReport } = await import("./reports");
    const result = await publishReport("rep-1", {
      brandPartnerId: "partner-1",
    });

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("event_reports")
      .find((call) => call.method === "update");
    expect(update?.args[0]).toMatchObject({
      is_published: true,
      brand_partner_id: "partner-1",
    });
  });

  it("clears brand_partner_id when null is supplied", async () => {
    supabase.setTableResponse("event_reports", {
      data: { event_id: "evt-1" },
      error: null,
    });

    const { publishReport } = await import("./reports");
    await publishReport("rep-1", { brandPartnerId: null });

    const update = supabase
      .callsFor("event_reports")
      .find((call) => call.method === "update");
    expect(update?.args[0]).toMatchObject({ brand_partner_id: null });
  });

  it("leaves brand_partner_id out of the payload when opts are omitted", async () => {
    supabase.setTableResponse("event_reports", {
      data: { event_id: "evt-1" },
      error: null,
    });

    const { publishReport } = await import("./reports");
    await publishReport("rep-1");

    const update = supabase
      .callsFor("event_reports")
      .find((call) => call.method === "update");
    expect(update?.args[0]).not.toHaveProperty("brand_partner_id");
  });
});
