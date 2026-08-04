/**
 * Tests for the public advertiser slot enquiry.
 *
 * It is unauthenticated and only ever moves a slot available → reserved, so
 * the status guard, the throttle, and "somebody is told" are the behaviours
 * that matter.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn(async () => []);
const rateLimitAllows = vi.fn((_identifier: string) => true);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) =>
    dispatchNotification(...(args as [])),
}));
vi.mock("@/lib/rate-limit", () => ({
  applicationLimiter: (id: string) => rateLimitAllows(id),
  getClientIp: async () => "203.0.113.30",
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/portal", () => ({
  requireVenueManager: async () => ({ supabase }),
  requireVenueManagerForPlacement: async () => ({ supabase }),
  requireVenueManagerForSlot: async () => ({ supabase }),
}));
const spawnSlotFulfilmentTasks = vi.fn(async (..._args: unknown[]) => undefined);
vi.mock("@/server/slot-fulfilment", () => ({
  spawnSlotFulfilmentTasks: (...args: unknown[]) => spawnSlotFulfilmentTasks(...args),
}));

const SLOT_ID = "bbbbbbbb-2222-2222-2222-222222222222";

const ENQUIRY = {
  company: "Acme Drinks",
  contactName: "Dana Reyes",
  email: "dana@acme.com",
  message: "Interested in the foyer screen.",
};

/** The slot row `requestVenueSlot` reads before holding the slot. */
function openSlot(overrides: Record<string, unknown> = {}) {
  return {
    game_config_json: {},
    status: "available",
    start_date: "2026-09-01",
    end_date: "2026-09-07",
    placements: { venues: { name: "Riverside Arena", slug: "riverside-arena" } },
    ...overrides,
  };
}

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockClear();
  rateLimitAllows.mockReturnValue(true);
});

describe("requestVenueSlot", () => {
  it("holds the slot and tells the venue operator", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: openSlot(),
      error: null,
    });

    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, ENQUIRY);

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ status: "reserved" });

    expect(dispatchNotification).toHaveBeenCalledWith(
      "sponsor.slot_requested",
      expect.objectContaining({
        slotId: SLOT_ID,
        sponsorName: "Acme Drinks",
        contactEmail: "dana@acme.com",
        venueName: "Riverside Arena",
        venueSlug: "riverside-arena",
        slotDates: "2026-09-01 → 2026-09-07",
      })
    );
  });

  it("records the enquiry against the slot for the operator to read", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: openSlot({ game_config_json: { notes: "Keep for Q3" } }),
      error: null,
    });

    const { requestVenueSlot } = await import("./venues");
    await requestVenueSlot(SLOT_ID, ENQUIRY);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    const config = (update?.args[0] as Record<string, unknown>)
      .game_config_json as Record<string, unknown>;
    expect(config.notes).toBe("Keep for Q3");
    expect(config.source).toBe("advertiser_request");
    expect(config.enquiry).toMatchObject({
      company: "Acme Drinks",
      email: "dana@acme.com",
      message: "Interested in the foyer screen.",
    });
  });

  it("still holds the slot when the notification fails", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: openSlot(),
      error: null,
    });
    dispatchNotification.mockRejectedValue(new Error("queue down"));

    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, ENQUIRY);

    expect(result.success).toBe(true);
  });

  it("refuses a slot somebody else has already taken", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: openSlot({ status: "reserved" }),
      error: null,
    });

    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, ENQUIRY);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/just been taken/i);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("reports a missing slot rather than pretending to hold it", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });

    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, ENQUIRY);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not found/i);
  });

  it("requires a company and an email before touching the database", async () => {
    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, { ...ENQUIRY, email: "  " });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("sponsorship_slots")).toHaveLength(0);
  });

  it("throttles a caller hammering the enquiry form", async () => {
    rateLimitAllows.mockReturnValue(false);

    const { requestVenueSlot } = await import("./venues");
    const result = await requestVenueSlot(SLOT_ID, ENQUIRY);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/too many/i);
    expect(supabase.callsFor("sponsorship_slots")).toHaveLength(0);
  });
});

const PLACEMENT_ID = "cccccccc-3333-3333-3333-333333333333";

describe("holdSlot", () => {
  it("reserves the slot under a countdown", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: SLOT_ID },
      error: null,
    });

    const { holdSlot } = await import("./venues");
    const result = await holdSlot(SLOT_ID, { sponsorName: "Acme", days: 7 });

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    const payload = update!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("reserved");
    expect(typeof payload.hold_expires_at).toBe("string");
    expect(payload.sponsor_name).toBe("Acme");
  });

  it("refuses to hold a slot that is already sold", async () => {
    // The guarded update matches no rows for an active/completed slot.
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });

    const { holdSlot } = await import("./venues");
    const result = await holdSlot(SLOT_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/open slot/i);
  });
});

describe("confirmSlot", () => {
  it("clears the hold and spawns the fulfilment checklist for a show slot", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: {
        id: SLOT_ID,
        event_id: "eeeeeeee-4444-4444-4444-444444444444",
        sponsor_name: "Acme",
        start_date: "2026-09-01",
      },
      error: null,
    });

    const { confirmSlot } = await import("./venues");
    const result = await confirmSlot(SLOT_ID);

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toMatchObject({ status: "active", hold_expires_at: null });
    expect(spawnSlotFulfilmentTasks).toHaveBeenCalledWith(
      expect.objectContaining({ slotId: SLOT_ID, sponsorName: "Acme" })
    );
  });

  it("skips fulfilment for a venue slot with no show attached", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: SLOT_ID, event_id: null, sponsor_name: null, start_date: "2026-09-01" },
      error: null,
    });

    const { confirmSlot } = await import("./venues");
    const result = await confirmSlot(SLOT_ID);

    expect(result.success).toBe(true);
    expect(spawnSlotFulfilmentTasks).not.toHaveBeenCalled();
  });

  it("refuses to confirm a slot that was never reserved", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });

    const { confirmSlot } = await import("./venues");
    const result = await confirmSlot(SLOT_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/reserved/i);
    expect(spawnSlotFulfilmentTasks).not.toHaveBeenCalled();
  });
});

describe("reserveSlot", () => {
  const SPONSOR_ID = "dddddddd-5555-5555-5555-555555555555";

  it("blocks a sponsor who already holds the placement's cap", async () => {
    supabase.queueTableResponses("sponsorship_slots", [
      {
        data: {
          placement_id: PLACEMENT_ID,
          game_config_json: {},
          placements: { max_slots_per_sponsor: 1 },
        },
        error: null,
      },
      { data: [{ id: "held-slot" }], error: null },
    ]);

    const { reserveSlot } = await import("./venues");
    const result = await reserveSlot(SLOT_ID, SPONSOR_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/capped at 1 slot/i);
    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update).toBeUndefined();
  });

  it("reserves normally when the placement carries no cap", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: {
        placement_id: PLACEMENT_ID,
        game_config_json: {},
        placements: { max_slots_per_sponsor: null },
      },
      error: null,
    });

    const { reserveSlot } = await import("./venues");
    const result = await reserveSlot(SLOT_ID, SPONSOR_ID, "Summer push");

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toMatchObject({
      sponsor_account_id: SPONSOR_ID,
      status: "reserved",
      game_config_json: { campaign: "Summer push" },
    });
  });
});

describe("updatePlacementSku", () => {
  it("saves the register fields with an uppercased code", async () => {
    supabase.setTableResponse("placements", { data: null, error: null });

    const { updatePlacementSku } = await import("./venues");
    const result = await updatePlacementSku({
      placementId: PLACEMENT_ID,
      skuCode: "wes-st-01",
      locationLabel: "The Street, ground floor",
      footfallEstimate: 40000,
      maxSlotsPerSponsor: 2,
    });

    expect(result.success).toBe(true);
    const update = supabase.callsFor("placements").find((c) => c.method === "update");
    expect(update!.args[0]).toMatchObject({
      sku_code: "WES-ST-01",
      location_label: "The Street, ground floor",
      footfall_estimate: 40000,
      max_slots_per_sponsor: 2,
    });
  });

  it("rejects a code with characters that would break links", async () => {
    const { updatePlacementSku } = await import("./venues");
    const result = await updatePlacementSku({
      placementId: PLACEMENT_ID,
      skuCode: "WES ST/01",
    });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("placements")).toHaveLength(0);
  });
});

describe("publishPlacementSku", () => {
  it("flips the approval state to live", async () => {
    supabase.setTableResponse("placements", { data: null, error: null });

    const { publishPlacementSku } = await import("./venues");
    const result = await publishPlacementSku(PLACEMENT_ID, true);

    expect(result.success).toBe(true);
    const update = supabase.callsFor("placements").find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({ sku_status: "live" });
  });
});

describe("updatePlacementPricing", () => {
  it("writes the typed model whole", async () => {
    supabase.setTableResponse("placements", { data: null, error: null });

    const { updatePlacementPricing } = await import("./venues");
    const result = await updatePlacementPricing({
      placementId: PLACEMENT_ID,
      pricing: { model: "guarantee_overage", guaranteePence: 400_000, overageRate: 0.25 },
    });

    expect(result.success).toBe(true);
    const update = supabase.callsFor("placements").find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({
      pricing_model_json: {
        model: "guarantee_overage",
        guaranteePence: 400_000,
        overageRate: 0.25,
      },
    });
  });

  it("rejects a share above 100%", async () => {
    const { updatePlacementPricing } = await import("./venues");
    const result = await updatePlacementPricing({
      placementId: PLACEMENT_ID,
      pricing: { model: "revenue_share", rate: 1.4 },
    });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("placements")).toHaveLength(0);
  });
});
