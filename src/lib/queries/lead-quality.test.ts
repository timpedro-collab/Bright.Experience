/** Tests for lead quality summary roll-ups. */
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

describe("getLeadQualitySummary", () => {
  it("buckets verified, unchecked, disposable, invalid, and repeat players", async () => {
    supabase.queueTableResponses("leads", [
      {
        data: [
          { email_status: "verified", is_repeat_player: false },
          { email_status: "verified", is_repeat_player: true },
          { email_status: "unchecked", is_repeat_player: false },
          { email_status: "disposable", is_repeat_player: false },
          { email_status: "invalid", is_repeat_player: false },
        ],
        error: null,
      },
    ]);

    const { getLeadQualitySummary } = await import("./lead-quality");
    const summary = await getLeadQualitySummary("event-1");

    expect(summary).toEqual({
      total: 5,
      verified: 1,
      unchecked: 1,
      disposable: 1,
      invalid: 1,
      repeatPlayers: 1,
    });
  });

  it("returns an all-zero summary when the query fails", async () => {
    supabase.queueTableResponses("leads", [
      { data: null, error: { message: "boom" } },
    ]);

    const { getLeadQualitySummary } = await import("./lead-quality");
    const summary = await getLeadQualitySummary("event-1");

    expect(summary).toEqual({
      total: 0,
      verified: 0,
      unchecked: 0,
      disposable: 0,
      invalid: 0,
      repeatPlayers: 0,
    });
  });

  it("returns an all-zero summary when the event has no leads", async () => {
    supabase.queueTableResponses("leads", [{ data: [], error: null }]);

    const { getLeadQualitySummary } = await import("./lead-quality");
    const summary = await getLeadQualitySummary("event-empty");

    expect(summary).toEqual({
      total: 0,
      verified: 0,
      unchecked: 0,
      disposable: 0,
      invalid: 0,
      repeatPlayers: 0,
    });
  });
});
