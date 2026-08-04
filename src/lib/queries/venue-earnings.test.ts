/** Tests for venue placement earnings roll-ups. */
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

describe("getEarningsByVenue", () => {
  it("buckets booked vs open money and computes the share per model", async () => {
    supabase.queueTableResponses("placements", [
      {
        data: [
          {
            id: "pl-share",
            pricing_model_json: { model: "revenue_share", rate: 0.2 },
            notes: null,
            sku_code: "WES-ST-01",
            location_label: "The Street, ground floor",
          },
          {
            id: "pl-fee",
            pricing_model_json: { model: "fixed_fee", feePence: 50_000 },
            notes: "Lobby kiosk",
            sku_code: null,
            location_label: null,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("sponsorship_slots", [
      {
        data: [
          {
            id: "slot-1",
            placement_id: "pl-share",
            price: 10_000,
            status: "reserved",
          },
          {
            id: "slot-2",
            placement_id: "pl-share",
            price: 5_000,
            status: "active",
          },
          {
            id: "slot-3",
            placement_id: "pl-share",
            price: 8_000,
            status: "available",
          },
          {
            id: "slot-4",
            placement_id: "pl-fee",
            price: 200_000,
            status: "completed",
          },
        ],
        error: null,
      },
    ]);

    const { getEarningsByVenue } = await import("./venue-earnings");
    const earnings = await getEarningsByVenue("venue-1");

    expect(earnings.bookedPence).toBe(215_000);
    expect(earnings.sharePence).toBe(53_000);
    expect(earnings.openPence).toBe(8_000);
    expect(earnings.unconfiguredCount).toBe(0);
    expect(earnings.placements).toHaveLength(2);

    const sharePlacement = earnings.placements.find(
      (p) => p.placementId === "pl-share",
    );
    expect(sharePlacement?.label).toBe(
      "WES-ST-01 · The Street, ground floor",
    );
    expect(sharePlacement?.bookedPence).toBe(15_000);
    expect(sharePlacement?.openPence).toBe(8_000);
    expect(sharePlacement?.sharePence).toBe(3_000);
    expect(sharePlacement?.modelLabel).toBe("20% of booked revenue");

    const feePlacement = earnings.placements.find(
      (p) => p.placementId === "pl-fee",
    );
    expect(feePlacement?.label).toBe("Lobby kiosk");
    expect(feePlacement?.bookedPence).toBe(200_000);
    expect(feePlacement?.sharePence).toBe(50_000);
    expect(feePlacement?.modelLabel).toBe("£500 flat");
  });

  it("counts unconfigured placements but still totals booked money", async () => {
    supabase.queueTableResponses("placements", [
      {
        data: [
          {
            id: "pl-bad",
            pricing_model_json: { model: "invalid" },
            notes: "Unconfigured spot",
            sku_code: null,
            location_label: null,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("sponsorship_slots", [
      {
        data: [
          {
            id: "slot-1",
            placement_id: "pl-bad",
            price: 10_000,
            status: "active",
          },
        ],
        error: null,
      },
    ]);

    const { getEarningsByVenue } = await import("./venue-earnings");
    const earnings = await getEarningsByVenue("venue-1");

    expect(earnings.bookedPence).toBe(10_000);
    expect(earnings.sharePence).toBe(0);
    expect(earnings.unconfiguredCount).toBe(1);
    expect(earnings.placements[0].sharePence).toBeNull();
    expect(earnings.placements[0].modelLabel).toBeNull();
  });

  it("returns an empty earnings shape when the venue has no placements", async () => {
    supabase.queueTableResponses("placements", [{ data: [], error: null }]);

    const { getEarningsByVenue } = await import("./venue-earnings");
    const earnings = await getEarningsByVenue("venue-1");

    expect(earnings).toEqual({
      placements: [],
      bookedPence: 0,
      sharePence: 0,
      openPence: 0,
      unconfiguredCount: 0,
    });
    expect(supabase.from).not.toHaveBeenCalledWith("sponsorship_slots");
  });
});
