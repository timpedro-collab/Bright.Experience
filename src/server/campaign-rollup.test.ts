/** Tests for the campaign metric roll-up. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const CAMPAIGN_ID = "aaaaaaaa-1111-1111-1111-111111111111";

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

describe("refreshCampaignMetrics", () => {
  it("sums the latest snapshot per event and writes the aggregate", async () => {
    supabase.setTableResponse("campaign_events", {
      data: [{ event_id: "e1" }, { event_id: "e2" }],
      error: null,
    });
    // Ordered newest-first, with an older e1 row that must be ignored.
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: [
          {
            event_id: "e1",
            snapshot_date: "2026-08-02",
            total_plays: 1000,
            total_interactions: 1500,
            total_leads: 300,
            total_prizes: 200,
            avg_dwell_time: 60,
          },
          {
            event_id: "e2",
            snapshot_date: "2026-08-01",
            total_plays: 500,
            total_interactions: 700,
            total_leads: 100,
            total_prizes: 80,
            avg_dwell_time: 30,
          },
          {
            event_id: "e1",
            snapshot_date: "2026-07-01",
            total_plays: 1,
            total_interactions: 1,
            total_leads: 1,
            total_prizes: 1,
            avg_dwell_time: 1,
          },
        ],
        error: null,
      },
    ]);
    supabase.setTableResponse("campaigns", { data: null, error: null });

    const { refreshCampaignMetrics } = await import("./campaign-rollup");
    const aggregate = await refreshCampaignMetrics(CAMPAIGN_ID);

    expect(aggregate).toMatchObject({
      totalPlays: 1500,
      totalInteractions: 2200,
      totalLeads: 400,
      totalPrizes: 280,
      eventCount: 2,
    });
    // Weighted dwell: (1000×60 + 500×30) / 1500 = 50s → 1500×50/60 = 1250 min
    expect(aggregate!.engagedMinutes).toBe(1250);

    const write = supabase
      .callsFor("campaigns")
      .find((c) => c.method === "update");
    expect(write).toBeDefined();
    const payload = write!.args[0] as { aggregate_metrics_json: unknown };
    expect(payload.aggregate_metrics_json).toMatchObject({ totalPlays: 1500 });
  });

  it("resets the column when the campaign has no member events", async () => {
    supabase.setTableResponse("campaign_events", { data: [], error: null });
    supabase.setTableResponse("campaigns", { data: null, error: null });

    const { refreshCampaignMetrics } = await import("./campaign-rollup");
    const aggregate = await refreshCampaignMetrics(CAMPAIGN_ID);

    expect(aggregate).toBeNull();
    const write = supabase
      .callsFor("campaigns")
      .find((c) => c.method === "update");
    expect((write!.args[0] as Record<string, unknown>).aggregate_metrics_json).toBeNull();
  });

  it("returns null without writing on load error", async () => {
    supabase.setTableResponse("campaign_events", {
      data: null,
      error: { message: "boom" },
    });

    const { refreshCampaignMetrics } = await import("./campaign-rollup");
    const aggregate = await refreshCampaignMetrics(CAMPAIGN_ID);

    expect(aggregate).toBeNull();
    expect(supabase.callsFor("campaigns")).toHaveLength(0);
  });
});

describe("refreshCampaignsForEvent", () => {
  it("refreshes every campaign containing the event", async () => {
    supabase.queueTableResponses("campaign_events", [
      // campaigns containing the event
      { data: [{ campaign_id: "c1" }, { campaign_id: "c2" }], error: null },
      // member lookups inside each refresh (empty → reset path)
      { data: [], error: null },
      { data: [], error: null },
    ]);
    supabase.setTableResponse("campaigns", { data: null, error: null });

    const { refreshCampaignsForEvent } = await import("./campaign-rollup");
    await refreshCampaignsForEvent("e1");

    const updates = supabase
      .callsFor("campaigns")
      .filter((c) => c.method === "update");
    expect(updates).toHaveLength(2);
  });
});
