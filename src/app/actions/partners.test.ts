/**
 * Tests for the public partner application action.
 *
 * The application is anonymous, so the rate limit and the "somebody is told"
 * notification are the two behaviours worth pinning down.
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
  getClientIp: async () => "203.0.113.20",
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const VALID_APPLICATION = {
  name: "Expo Group",
  contactName: "Dana Reyes",
  contactEmail: "dana@expogroup.com",
  type: "agency" as const,
  companyName: "Expo Group Ltd",
};

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockClear();
  rateLimitAllows.mockReturnValue(true);
});

describe("applyAsPartner", () => {
  it("creates a pending partner and tells the internal team", async () => {
    supabase.setTableResponse("partners", {
      data: { id: "p1", partner_code: "EXPO-1234" },
      error: null,
    });

    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner(VALID_APPLICATION);

    expect(result.success).toBe(true);
    const insert = supabase.callsFor("partners").find((c) => c.method === "insert");
    expect(insert?.args[0]).toMatchObject({
      status: "pending",
      type: "agency",
      name: "Expo Group Ltd",
    });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "partner.application_received",
      expect.objectContaining({
        partnerName: "Expo Group Ltd",
        partnerType: "agency",
        contactEmail: "dana@expogroup.com",
        entityId: "p1",
      })
    );
  });

  it("accepts the referral tier the join form defaults to", async () => {
    supabase.setTableResponse("partners", {
      data: { id: "p2", partner_code: "EXPO-9999" },
      error: null,
    });

    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner({ ...VALID_APPLICATION, type: "referral" });

    expect(result.success).toBe(true);
    const insert = supabase.callsFor("partners").find((c) => c.method === "insert");
    expect(insert?.args[0]).toMatchObject({ type: "referral" });
  });

  it("refuses an applicant who asks to be an organizer partner", async () => {
    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner({
      ...VALID_APPLICATION,
      // Organizer partners get show and slot tooling — internal setup only.
      type: "organizer" as unknown as typeof VALID_APPLICATION.type,
    });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("partners")).toHaveLength(0);
  });

  it("still accepts the application when the notification fails", async () => {
    supabase.setTableResponse("partners", {
      data: { id: "p1", partner_code: "EXPO-1234" },
      error: null,
    });
    dispatchNotification.mockRejectedValue(new Error("queue down"));

    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner(VALID_APPLICATION);

    expect(result.success).toBe(true);
  });

  it("does not notify when the insert fails", async () => {
    supabase.setTableResponse("partners", {
      data: null,
      error: { message: "duplicate slug" },
    });

    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner(VALID_APPLICATION);

    expect(result.success).toBe(false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("throttles a burst from one connection before touching the database", async () => {
    rateLimitAllows.mockReturnValue(false);

    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner(VALID_APPLICATION);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/too many/i);
    expect(supabase.callsFor("partners")).toHaveLength(0);
  });
});
