/** Tests for deal-registration reads — organizer board + review queue. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

function dealRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "d1",
    partner_id: "p1",
    event_id: null,
    quote_id: null,
    sponsor_company: "Acme",
    sponsor_contact_name: null,
    sponsor_contact_email: null,
    estimated_value: 500_000,
    notes: null,
    status: "pending",
    exclusivity_expires_at: null,
    source: "organizer",
    rejected_reason: null,
    approved_at: null,
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

describe("getDealsByPartner", () => {
  it("maps rows to the DealRegistration shape", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: [dealRow()],
      error: null,
    });

    const { getDealsByPartner } = await import("./deal-registrations");
    const deals = await getDealsByPartner("p1");

    expect(deals).toHaveLength(1);
    expect(deals[0].sponsorCompany).toBe("Acme");
    expect(deals[0].estimatedValue).toBe(500_000);
    expect(deals[0].status).toBe("pending");
  });

  it("reads a lapsed approval as expired", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: [
        dealRow({ status: "approved", exclusivity_expires_at: PAST }),
        dealRow({ id: "d2", status: "approved", exclusivity_expires_at: FUTURE }),
      ],
      error: null,
    });

    const { getDealsByPartner } = await import("./deal-registrations");
    const deals = await getDealsByPartner("p1");

    expect(deals[0].status).toBe("expired");
    expect(deals[1].status).toBe("approved");
  });

  it("returns an empty list on query failure", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: null,
      error: { message: "boom" },
    });

    const { getDealsByPartner } = await import("./deal-registrations");
    expect(await getDealsByPartner("p1")).toEqual([]);
  });
});

describe("getDealRegistrationsForAdmin", () => {
  it("carries the partner name and puts pending registrations first", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: [
        dealRow({
          id: "d-approved",
          status: "approved",
          exclusivity_expires_at: FUTURE,
          partners: { name: "Informa", slug: "informa" },
        }),
        dealRow({
          id: "d-pending",
          partners: { name: "Clarion", slug: "clarion" },
        }),
      ],
      error: null,
    });

    const { getDealRegistrationsForAdmin } = await import("./deal-registrations");
    const rows = await getDealRegistrationsForAdmin();

    expect(rows[0].id).toBe("d-pending");
    expect(rows[0].partnerName).toBe("Clarion");
    expect(rows[1].partnerSlug).toBe("informa");
  });
});
