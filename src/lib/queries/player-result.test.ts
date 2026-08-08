/** Tests for the player result read — capability UUID, narrow fields. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

const LEAD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getPlayerResult", () => {
  it("rejects non-UUID ids without touching the database", async () => {
    const { getPlayerResult } = await import("./player-result");
    expect(await getPlayerResult("1 OR 1=1")).toBeNull();
    expect(supabase.callsFor("leads")).toHaveLength(0);
  });

  it("returns the player's score and the day's scored plays", async () => {
    supabase.setTableResponse("leads", {
      data: {
        id: LEAD_ID,
        event_id: "ev-1",
        contact_name: "Priya Shah",
        custom_fields_json: { score: 710 },
        captured_at: "2026-08-01T14:00:00Z",
      },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { name: "Acme Launch" },
      error: null,
    });
    supabase.setTableResponse("telemetry_events", {
      data: [
        { event_type: "play_completed", payload_json: { score: 710 } },
        { event_type: "play_completed", payload_json: { score: 300 } },
        { event_type: "play_completed", payload_json: {} },
      ],
      error: null,
    });

    const { getPlayerResult } = await import("./player-result");
    const result = await getPlayerResult(LEAD_ID);
    expect(result).toMatchObject({
      firstNameSource: "Priya Shah",
      eventName: "Acme Launch",
      score: 710,
      dayScores: [710, 300],
      dayPlays: 3,
    });
  });

  it("returns null when the lead does not exist", async () => {
    supabase.setTableResponse("leads", { data: null, error: null });
    const { getPlayerResult } = await import("./player-result");
    expect(await getPlayerResult(LEAD_ID)).toBeNull();
  });
});
