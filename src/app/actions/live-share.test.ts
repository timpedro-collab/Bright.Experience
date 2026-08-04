/** Tests for live-dashboard share-link actions. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
let serviceSupabase: MockSupabase;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => serviceSupabase),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "eeeeeeee-1111-4111-8111-111111111111";

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  supabase.setUser({ id: "u1" });
  vi.resetModules();
});

describe("issueLiveShareLink", () => {
  it("returns a token and expiry on the happy path", async () => {
    supabase.queueTableResponses("events", [
      { data: { id: EVENT_ID, live_share_token: null }, error: null },
    ]);
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { issueLiveShareLink } = await import("./live-share");
    const result = await issueLiveShareLink(EVENT_ID, 7);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(new Date(result.data.expiresAt).getTime()).toBeGreaterThan(
        Date.now(),
      );
    }

    const update = serviceSupabase
      .callsFor("events")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({
      live_share_token: expect.any(String),
      live_share_expires_at: expect.any(String),
    });
  });

  it("clamps days into the 1–30 window", async () => {
    supabase.queueTableResponses("events", [
      { data: { id: EVENT_ID, live_share_token: null }, error: null },
    ]);
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { issueLiveShareLink } = await import("./live-share");
    const result = await issueLiveShareLink(EVENT_ID, 999);

    expect(result.success).toBe(true);
    if (result.success) {
      const ms =
        new Date(result.data.expiresAt).getTime() - Date.now();
      expect(ms).toBeLessThanOrEqual(31 * 24 * 60 * 60 * 1000);
      expect(ms).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    }
  });

  it("rejects callers who cannot reach the event", async () => {
    supabase.queueTableResponses("events", [{ data: null, error: null }]);

    const { issueLiveShareLink } = await import("./live-share");
    const result = await issueLiveShareLink(EVENT_ID);

    expect(result).toEqual({
      success: false,
      error: "You don't have access to this event.",
    });
    expect(serviceSupabase.from).not.toHaveBeenCalled();
  });
});

describe("revokeLiveShareLink", () => {
  it("clears the token and expiry", async () => {
    supabase.queueTableResponses("events", [
      {
        data: { id: EVENT_ID, live_share_token: "old-token" },
        error: null,
      },
    ]);
    serviceSupabase.setTableResponse("events", { data: null, error: null });

    const { revokeLiveShareLink } = await import("./live-share");
    const result = await revokeLiveShareLink(EVENT_ID);

    expect(result.success).toBe(true);
    const update = serviceSupabase
      .callsFor("events")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      live_share_token: null,
      live_share_expires_at: null,
      updated_at: expect.any(String),
    });
  });
});
