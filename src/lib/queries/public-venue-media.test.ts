/** Tests for the anonymous venue advertise/widget read model. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

const VENUE = {
  id: "venue-1",
  name: "Westfield Stratford",
  slug: "westfield-stratford",
  capacity: 5000,
  is_active: true,
};

describe("getPublicVenueMedia", () => {
  it("returns live placements, open slots and packages for an active venue", async () => {
    supabase.queueTableResponses("venues", [{ data: VENUE, error: null }]);
    supabase.queueTableResponses("placements", [
      {
        data: [
          {
            id: "pl-live",
            status: "active",
            sku_status: "live",
            location_label: "The Street, ground floor",
            notes: null,
            pricing_model_json: { model: "revenue_share", rate: 0.2 },
            machine_instances: { nickname: "Street Portal" },
          },
          {
            id: "pl-draft",
            status: "active",
            sku_status: "draft",
            location_label: null,
            notes: "Not approved yet",
            pricing_model_json: null,
            machine_instances: null,
          },
          {
            id: "pl-legacy",
            status: "planned",
            sku_status: null,
            location_label: null,
            notes: "Pre-register row",
            pricing_model_json: { format: "Digital 6-sheet" },
            machine_instances: null,
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
            placement_id: "pl-live",
            start_date: "2026-09-01",
            end_date: "2026-09-07",
            price: 420_000,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("venue_packages", [
      {
        data: [
          {
            id: "pkg-1",
            name: "Flagship Week",
            description: "Seven days on The Street",
            price: 1_450_000,
            includes_bright_blue: true,
          },
        ],
        error: null,
      },
    ]);

    const { getPublicVenueMedia } = await import("./public-venue-media");
    const media = await getPublicVenueMedia("westfield-stratford");

    expect(media?.venue).toEqual({
      id: "venue-1",
      name: "Westfield Stratford",
      slug: "westfield-stratford",
      capacity: 5000,
    });
    // Draft SKU is excluded; legacy row without sku_status reads as live.
    expect(media?.placements.map((p) => p.id)).toEqual(["pl-live", "pl-legacy"]);
    expect(media?.placements[0]).toEqual({
      id: "pl-live",
      format: null,
      unitName: "Street Portal",
      locationNote: "The Street, ground floor",
    });
    expect(media?.placements[1].format).toBe("Digital 6-sheet");
    expect(media?.openSlots).toEqual([
      {
        id: "slot-1",
        placementId: "pl-live",
        startDate: "2026-09-01",
        endDate: "2026-09-07",
        pricePence: 420_000,
      },
    ]);
    expect(media?.packages).toEqual([
      {
        id: "pkg-1",
        name: "Flagship Week",
        description: "Seven days on The Street",
        pricePence: 1_450_000,
        includesBrightBlue: true,
      },
    ]);
  });

  it("never exposes the venue's commercial terms", async () => {
    supabase.queueTableResponses("venues", [{ data: VENUE, error: null }]);
    supabase.queueTableResponses("placements", [
      {
        data: [
          {
            id: "pl-live",
            status: "active",
            sku_status: "live",
            location_label: null,
            notes: null,
            pricing_model_json: { model: "revenue_share", rate: 0.35 },
            machine_instances: null,
          },
        ],
        error: null,
      },
    ]);
    supabase.queueTableResponses("sponsorship_slots", [{ data: [], error: null }]);
    supabase.queueTableResponses("venue_packages", [{ data: [], error: null }]);

    const { getPublicVenueMedia } = await import("./public-venue-media");
    const media = await getPublicVenueMedia("westfield-stratford");

    expect(JSON.stringify(media)).not.toContain("0.35");
    expect(JSON.stringify(media)).not.toContain("revenue_share");
  });

  it("returns null for an unknown slug", async () => {
    supabase.queueTableResponses("venues", [{ data: null, error: null }]);

    const { getPublicVenueMedia } = await import("./public-venue-media");
    expect(await getPublicVenueMedia("nope")).toBeNull();
  });

  it("returns null for a deactivated venue", async () => {
    supabase.queueTableResponses("venues", [
      { data: { ...VENUE, is_active: false }, error: null },
    ]);

    const { getPublicVenueMedia } = await import("./public-venue-media");
    expect(await getPublicVenueMedia("westfield-stratford")).toBeNull();
  });

  it("skips the slot query when no live placements exist", async () => {
    supabase.queueTableResponses("venues", [{ data: VENUE, error: null }]);
    supabase.queueTableResponses("placements", [{ data: [], error: null }]);
    supabase.queueTableResponses("venue_packages", [{ data: [], error: null }]);

    const { getPublicVenueMedia } = await import("./public-venue-media");
    const media = await getPublicVenueMedia("westfield-stratford");

    expect(media?.openSlots).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalledWith("sponsorship_slots");
  });
});
