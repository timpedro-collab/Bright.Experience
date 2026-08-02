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
