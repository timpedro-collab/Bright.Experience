/** Tests for organizer sponsorship earnings roll-ups. */
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

describe("getEarningsByOrganizer", () => {
  it("buckets sold and pipeline margins separately", async () => {
    supabase.queueTableResponses("events", [
      {
        data: [{ id: "show-a", name: "Show A" }],
        error: null,
      },
    ]);
    supabase.queueTableResponses("sponsorship_slots", [
      {
        data: [
          {
            id: "slot-1",
            event_id: "show-a",
            sponsor_name: "Acme",
            status: "completed",
            start_date: "2026-09-01",
            end_date: "2026-09-03",
            price: 2_000_000,
            wholesale_price: 1_500_000,
          },
          {
            id: "slot-2",
            event_id: "show-a",
            sponsor_name: "Beta",
            status: "active",
            start_date: "2026-09-04",
            end_date: "2026-09-06",
            price: 1_000_000,
            wholesale_price: 700_000,
          },
          {
            id: "slot-3",
            event_id: "show-a",
            sponsor_name: "Gamma",
            status: "reserved",
            start_date: "2026-09-07",
            end_date: "2026-09-09",
            price: 1_200_000,
            wholesale_price: 900_000,
          },
          {
            id: "slot-4",
            event_id: "show-a",
            sponsor_name: null,
            status: "available",
            start_date: "2026-09-10",
            end_date: "2026-09-12",
            price: 800_000,
            wholesale_price: 600_000,
          },
        ],
        error: null,
      },
    ]);

    const { getEarningsByOrganizer } = await import("./organizer-earnings");
    const earnings = await getEarningsByOrganizer("partner-1");

    expect(earnings.soldMarginPence).toBe(800_000);
    expect(earnings.pipelineMarginPence).toBe(300_000);
    expect(earnings.soldCount).toBe(2);
    expect(earnings.pipelineCount).toBe(1);
    expect(earnings.slots).toHaveLength(4);
    expect(earnings.slots[0].showName).toBe("Show A");
  });

  it("treats null wholesale as zero margin in totals", async () => {
    supabase.queueTableResponses("events", [
      {
        data: [{ id: "show-a", name: "Show A" }],
        error: null,
      },
    ]);
    supabase.queueTableResponses("sponsorship_slots", [
      {
        data: [
          {
            id: "slot-1",
            event_id: "show-a",
            sponsor_name: "Acme",
            status: "active",
            start_date: "2026-09-01",
            end_date: "2026-09-03",
            price: 800_000,
            wholesale_price: null,
          },
          {
            id: "slot-2",
            event_id: "show-a",
            sponsor_name: "Beta",
            status: "reserved",
            start_date: "2026-09-04",
            end_date: "2026-09-06",
            price: 500_000,
            wholesale_price: null,
          },
        ],
        error: null,
      },
    ]);

    const { getEarningsByOrganizer } = await import("./organizer-earnings");
    const earnings = await getEarningsByOrganizer("partner-1");

    expect(earnings.soldMarginPence).toBe(0);
    expect(earnings.pipelineMarginPence).toBe(0);
    expect(earnings.soldCount).toBe(1);
    expect(earnings.pipelineCount).toBe(1);
    expect(earnings.slots[0].marginPence).toBeNull();
  });

  it("returns an empty earnings shape when the organizer has no shows", async () => {
    supabase.queueTableResponses("events", [{ data: [], error: null }]);

    const { getEarningsByOrganizer } = await import("./organizer-earnings");
    const earnings = await getEarningsByOrganizer("partner-1");

    expect(earnings).toEqual({
      slots: [],
      soldMarginPence: 0,
      pipelineMarginPence: 0,
      soldCount: 0,
      pipelineCount: 0,
    });
  });
});
