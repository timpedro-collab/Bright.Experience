/**
 * Tests for the fleet-availability read behind the pricing page module.
 * The month arithmetic lives in lib/pricing/fleet-availability; what matters
 * here is that real rows flow through and failures degrade to "no module".
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getFleetMonthAvailability", () => {
  it("returns per-month availability derived from bookings", async () => {
    supabase.setTableResponse("machine_instances", {
      data: [
        { id: "u1", current_event_id: "ev1" },
        { id: "u2", current_event_id: null },
      ],
      error: null,
    });
    supabase.setTableResponse("events", {
      data: [
        {
          id: "ev1",
          event_date_start: "2027-03-10",
          event_date_end: "2027-03-12",
          stage: "production",
        },
      ],
      error: null,
    });
    supabase.setTableResponse("placements", { data: [], error: null });

    const { getFleetMonthAvailability } = await import("./fleet-availability");
    const result = await getFleetMonthAvailability(["2027-03", "2027-04"]);

    expect(result).toEqual([
      { month: "2027-03", label: "March 2027", total: 2, booked: 1 },
      { month: "2027-04", label: "April 2027", total: 2, booked: 0 },
    ]);
  });

  it("returns nothing rather than inventing scarcity when a read fails", async () => {
    supabase.setTableResponse("machine_instances", {
      data: null,
      error: { message: "permission denied" },
    });
    supabase.setTableResponse("events", { data: [], error: null });
    supabase.setTableResponse("placements", { data: [], error: null });

    const { getFleetMonthAvailability } = await import("./fleet-availability");
    expect(await getFleetMonthAvailability(["2027-03"])).toEqual([]);
  });

  it("skips the reads entirely when no months are requested", async () => {
    const { getFleetMonthAvailability } = await import("./fleet-availability");
    expect(await getFleetMonthAvailability([])).toEqual([]);
    expect(supabase.callsFor("machine_instances")).toHaveLength(0);
  });
});
