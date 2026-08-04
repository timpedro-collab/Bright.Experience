/**
 * Tests for organizer-scoped slot collateral reads.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

const PARTNER_ID = "partner-1";
const SLOT_ID = "slot-1";
const EVENT_ID = "evt-1";

function slotRow(overrides: Record<string, unknown> = {}) {
  return {
    id: SLOT_ID,
    sponsor_name: "Acme Corp",
    status: "available",
    start_date: "2026-09-15",
    end_date: "2026-09-17",
    price: 250000,
    machine_instances: {
      id: "mi-1",
      serial_number: "BB-001",
      nickname: "North gate",
      zone: "Hall A",
      mission: "lead_gen",
      machines: {
        name: "Pulse",
        slug: "pulse",
        tagline: "Crowd magnet",
        capacity_label: "500 samples",
        mechanisms: ["spiral"],
        dispenses: ["samples"],
        features: ["touchscreen"],
        best_for: ["trade shows"],
        hero_image_url: "https://cdn.example/pulse.jpg",
        footprint_mm: "800 × 800 mm",
        weight_kg: 120,
        power_spec: "230V / 13A",
        connectivity: "4G",
        clearance_notes: "800 mm rear",
      },
    },
    events: {
      id: EVENT_ID,
      name: "Retail Expo",
      venue_name: "NEC Birmingham",
      event_date_start: "2026-09-15",
      event_date_end: "2026-09-17",
      event_type: "trade_show",
      machine_type: "pulse",
      organizer_partner_id: PARTNER_ID,
    },
    ...overrides,
  };
}

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getSlotCollateral", () => {
  it("returns the mapped collateral shape for a matching partner", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: slotRow(), error: null });
    const { getSlotCollateral } = await import("./slot-collateral");
    const result = await getSlotCollateral(SLOT_ID, PARTNER_ID);

    expect(result).not.toBeNull();
    expect(result!.slot).toEqual({
      id: SLOT_ID,
      sponsorName: "Acme Corp",
      status: "available",
      startDate: "2026-09-15",
      endDate: "2026-09-17",
      pricePence: 250000,
      zone: "Hall A",
      mission: "lead_gen",
      machineLabel: "North gate",
    });
    expect(result!.show).toEqual({
      id: EVENT_ID,
      name: "Retail Expo",
      venueName: "NEC Birmingham",
      eventDateStart: "2026-09-15",
      eventDateEnd: "2026-09-17",
      eventType: "trade_show",
    });
    expect(result!.spec?.name).toBe("Pulse");
    expect(result!.spec?.footprintMm).toBe("800 × 800 mm");
  });

  it("returns null when the show belongs to another partner", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: slotRow({
        events: {
          ...slotRow().events,
          organizer_partner_id: "other-partner",
        },
      }),
      error: null,
    });
    const { getSlotCollateral } = await import("./slot-collateral");
    expect(await getSlotCollateral(SLOT_ID, PARTNER_ID)).toBeNull();
  });

  it("returns null when the slot row is missing", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });
    const { getSlotCollateral } = await import("./slot-collateral");
    expect(await getSlotCollateral(SLOT_ID, PARTNER_ID)).toBeNull();
  });
});
