/**
 * Tests for the public sponsor-pitch conversion action.
 *
 * The action is unauthenticated, so the guards (token validity, slot status,
 * rate limit) carry the security weight and get a case each.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let serviceSupabase: MockSupabase;
const getSlotByPitchToken = vi.fn();
const dispatchNotification = vi.fn(async () => []);
const rateLimitAllows = vi.fn((_identifier: string) => true);

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => serviceSupabase,
}));
vi.mock("@/lib/queries/organizers", () => ({
  getSlotByPitchToken: (...args: unknown[]) =>
    getSlotByPitchToken(...(args as [])),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) =>
    dispatchNotification(...(args as [])),
}));
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => (id: string) => rateLimitAllows(id),
  getClientIp: async () => "203.0.113.10",
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const TOKEN = "pitch-token-abcdefghijklmnop";
const SLOT_ID = "bbbbbbbb-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const VALID_INPUT = {
  token: TOKEN,
  contactName: "Dana Reyes",
  email: "dana@sponsor.com",
  company: "Sponsor Co",
  message: "Can we send our own wrap artwork?",
};

/** The shape `getSlotByPitchToken` returns for a live, open slot. */
function openSlot(overrides: Record<string, unknown> = {}) {
  return {
    id: SLOT_ID,
    event_id: EVENT_ID,
    status: "available",
    sponsor_name: null,
    ...overrides,
  };
}

beforeEach(() => {
  serviceSupabase = createMockSupabase();
  getSlotByPitchToken.mockReset();
  dispatchNotification.mockClear();
  rateLimitAllows.mockReturnValue(true);
});

describe("expressSponsorInterest", () => {
  it("reserves the slot and notifies the organizer", async () => {
    getSlotByPitchToken.mockResolvedValue(openSlot());
    serviceSupabase.setTableResponse("sponsorship_slots", {
      data: { game_config_json: { campaign: "Existing" } },
      error: null,
    });
    serviceSupabase.setTableResponse("events", {
      data: { name: "Tech Summit", partners: { slug: "expo-group" } },
      error: null,
    });

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest(VALID_INPUT);

    expect(result.success).toBe(true);
    const update = serviceSupabase.callsFor("sponsorship_slots").find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({
      status: "reserved",
      sponsor_name: "Sponsor Co",
    });

    expect(dispatchNotification).toHaveBeenCalledWith(
      "sponsor.interest_received",
      expect.objectContaining({
        eventId: EVENT_ID,
        eventName: "Tech Summit",
        sponsorName: "Sponsor Co",
        contactEmail: "dana@sponsor.com",
        organizerSlug: "expo-group",
      }),
      expect.anything()
    );
  });

  it("keeps the enquiry alongside any existing slot config", async () => {
    getSlotByPitchToken.mockResolvedValue(openSlot());
    serviceSupabase.setTableResponse("sponsorship_slots", {
      data: { game_config_json: { campaign: "Existing" } },
      error: null,
    });
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    await expressSponsorInterest(VALID_INPUT);

    const update = serviceSupabase.callsFor("sponsorship_slots").find((c) => c.method === "update");
    const config = (update?.args[0] as Record<string, unknown>)
      .game_config_json as Record<string, unknown>;
    expect(config.campaign).toBe("Existing");
    expect(config.source).toBe("sponsor_pitch");
    expect(config.enquiry).toMatchObject({
      contactName: "Dana Reyes",
      email: "dana@sponsor.com",
      message: "Can we send our own wrap artwork?",
    });
  });

  it("keeps the name the slot was pitched under", async () => {
    getSlotByPitchToken.mockResolvedValue(
      openSlot({ sponsor_name: "Named Sponsor" })
    );
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    await expressSponsorInterest(VALID_INPUT);

    const update = serviceSupabase.callsFor("sponsorship_slots").find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ sponsor_name: "Named Sponsor" });
  });

  it("falls back to the contact name when no company is given", async () => {
    getSlotByPitchToken.mockResolvedValue(openSlot());
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    await expressSponsorInterest({ ...VALID_INPUT, company: undefined });

    const update = serviceSupabase.callsFor("sponsorship_slots").find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ sponsor_name: "Dana Reyes" });
  });

  it("rejects an expired or unknown token", async () => {
    getSlotByPitchToken.mockResolvedValue(null);

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/expired/i);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("refuses a slot that has already been sold", async () => {
    getSlotByPitchToken.mockResolvedValue(openSlot({ status: "active" }));

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/no longer open/i);
  });

  it("rejects an invalid email before touching the database", async () => {
    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest({
      ...VALID_INPUT,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(getSlotByPitchToken).not.toHaveBeenCalled();
  });

  it("rate-limits a caller hammering the link", async () => {
    rateLimitAllows.mockReturnValue(false);

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/too many/i);
    expect(getSlotByPitchToken).not.toHaveBeenCalled();
  });

  it("reports a failed write instead of claiming the slot is held", async () => {
    getSlotByPitchToken.mockResolvedValue(openSlot());
    serviceSupabase.setTableResponse("sponsorship_slots", {
      data: null,
      error: { message: "permission denied" },
    });

    const { expressSponsorInterest } = await import("./sponsor-pitch");
    const result = await expressSponsorInterest(VALID_INPUT);

    expect(result.success).toBe(false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});
