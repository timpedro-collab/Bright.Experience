/**
 * Tests for the sponsor pitch-token boundary.
 *
 * This is the only place in the product where an anonymous caller reaches
 * event data, so the checks it makes are load-bearing: the token must match,
 * it must still be live, and nothing lead-shaped may come back.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 60 * 1000).toISOString();
const TOKEN = "11111111-2222-3333-4444-555555555555";

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getSlotByPitchToken", () => {
  it("returns the slot for a live token", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: "slot-1", pitch_token: TOKEN, pitch_token_expires_at: FUTURE },
      error: null,
    });
    const { getSlotByPitchToken } = await import("./organizers");
    const slot = await getSlotByPitchToken(TOKEN);
    expect(slot?.id).toBe("slot-1");
  });

  it("refuses an expired token even though the row still matches", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: "slot-1", pitch_token: TOKEN, pitch_token_expires_at: PAST },
      error: null,
    });
    const { getSlotByPitchToken } = await import("./organizers");
    expect(await getSlotByPitchToken(TOKEN)).toBeNull();
  });

  it("refuses a row with no expiry rather than treating it as eternal", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: "slot-1", pitch_token: TOKEN, pitch_token_expires_at: null },
      error: null,
    });
    const { getSlotByPitchToken } = await import("./organizers");
    expect(await getSlotByPitchToken(TOKEN)).toBeNull();
  });

  it("rejects a short token without querying at all", async () => {
    const { getSlotByPitchToken } = await import("./organizers");
    expect(await getSlotByPitchToken("abc")).toBeNull();
    expect(supabase.callsFor("sponsorship_slots")).toHaveLength(0);
  });

  it("never selects a lead-bearing column", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: "slot-1", pitch_token: TOKEN, pitch_token_expires_at: FUTURE },
      error: null,
    });
    const { getSlotByPitchToken } = await import("./organizers");
    await getSlotByPitchToken(TOKEN);

    const select = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "select");
    const columns = String(select!.args[0]);
    expect(columns).not.toMatch(/leads|contact_email|contact_name/);
  });
});

describe("getSlotPerformance", () => {
  it("reduces raw telemetry to sponsor-safe counters", async () => {
    supabase.setTableResponse("telemetry_events", {
      data: [
        { event_type: "play_started" },
        { event_type: "play_started" },
        { event_type: "lead_captured" },
        { event_type: "prize_awarded" },
        { event_type: "heartbeat" },
      ],
      error: null,
    });
    const { getSlotPerformance } = await import("./organizers");
    const performance = await getSlotPerformance("evt-1", "m1", "2026-09-15", "2026-09-17");
    expect(performance).toEqual({ plays: 2, leads: 1, prizes: 1, optInRate: 50 });
  });

  it("scopes the read to the sponsor's own machine and dates", async () => {
    supabase.setTableResponse("telemetry_events", { data: [], error: null });
    const { getSlotPerformance } = await import("./organizers");
    await getSlotPerformance("evt-1", "m1", "2026-09-15", "2026-09-17");

    const filters = supabase
      .callsFor("telemetry_events")
      .filter((c) => c.method === "eq")
      .map((c) => c.args);
    expect(filters).toContainEqual(["event_id", "evt-1"]);
    expect(filters).toContainEqual(["machine_instance_id", "m1"]);
  });
});
