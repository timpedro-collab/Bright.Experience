/** Tests for the anonymous live-dashboard read model. */
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

const TOKEN = "11111111-1111-4111-8111-111111111111";
const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST = "2020-01-01T00:00:00.000Z";

const EVENT_ROW = {
  id: "evt-1",
  name: "Summer Launch",
  venue_name: "Westfield Stratford",
  event_date_start: "2026-08-01",
  event_date_end: "2026-08-04",
  live_share_expires_at: FUTURE,
};

describe("getPublicLiveSnapshot", () => {
  it("returns headline totals for a valid, unexpired token", async () => {
    supabase.queueTableResponses("events", [{ data: EVENT_ROW, error: null }]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      {
        data: {
          total_plays: 420,
          total_interactions: 380,
          total_leads: 95,
          total_prizes: 88,
          avg_dwell_time: 32,
        },
        error: null,
      },
    ]);

    const { getPublicLiveSnapshot } = await import("./public-live");
    const snap = await getPublicLiveSnapshot(TOKEN);

    expect(snap).toMatchObject({
      eventName: "Summer Launch",
      venueName: "Westfield Stratford",
      totals: {
        plays: 420,
        interactions: 380,
        leads: 95,
        prizes: 88,
      },
      avgDwellSeconds: 32,
      expiresAt: FUTURE,
    });
    expect(typeof snap?.isLive).toBe("boolean");
  });

  it("returns null for an expired token", async () => {
    supabase.queueTableResponses("events", [
      {
        data: { ...EVENT_ROW, live_share_expires_at: PAST },
        error: null,
      },
    ]);

    const { getPublicLiveSnapshot } = await import("./public-live");
    expect(await getPublicLiveSnapshot(TOKEN)).toBeNull();
  });

  it("returns null for junk tokens without querying the database", async () => {
    const { getPublicLiveSnapshot } = await import("./public-live");
    expect(await getPublicLiveSnapshot("not-a-uuid")).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns zero totals when no snapshot exists yet", async () => {
    supabase.queueTableResponses("events", [{ data: EVENT_ROW, error: null }]);
    supabase.queueTableResponses("event_metrics_snapshot", [
      { data: null, error: null },
    ]);

    const { getPublicLiveSnapshot } = await import("./public-live");
    const snap = await getPublicLiveSnapshot(TOKEN);

    expect(snap?.totals).toEqual({
      plays: 0,
      interactions: 0,
      leads: 0,
      prizes: 0,
    });
    expect(snap?.avgDwellSeconds).toBeNull();
  });
});
