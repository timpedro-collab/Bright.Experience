/** Tests for partner-pricing page actions. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let serviceSupabase: MockSupabase;
const getUser = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => serviceSupabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));

const PAGE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

const VALID_CONFIG = {
  currency: "USD" as const,
  split: { brightBlue: 0.7, partner: 0.3 },
  commitment: {
    pilotMinUnits: 12,
    pilotMaxUnits: 15,
    maxUnits: 50,
    cutoffWeeks: 25,
  },
  levers: [
    {
      key: "single",
      label: "Single placements",
      unitsPerItem: 1,
      retail: { min: 45_000, max: 70_000, suggested: 50_000, step: 1_000 },
    },
  ],
  floorTiers: [
    { label: "Pilot", minUnits: 1, maxUnits: 15, floor: 15_000 },
  ],
};

const VALID_INPUT = {
  partnerName: "Informa Tech",
  showLabel: "CES 2026",
  config: VALID_CONFIG,
};

beforeEach(() => {
  serviceSupabase = createMockSupabase();
  getUser.mockReset();
  vi.resetModules();
});

describe("createPartnerPricingPage", () => {
  it("rejects a non-commercial user", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "ops" });

    const { createPartnerPricingPage } = await import("./partner-pricing");
    const result = await createPartnerPricingPage(VALID_INPUT);

    expect(result).toEqual({ success: false, error: "Not authorized" });
    expect(serviceSupabase.from).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "events_lead" });

    const { createPartnerPricingPage } = await import("./partner-pricing");

    const emptyName = await createPartnerPricingPage({
      ...VALID_INPUT,
      partnerName: "",
    });
    expect(emptyName.success).toBe(false);

    const badRetail = await createPartnerPricingPage({
      ...VALID_INPUT,
      config: {
        ...VALID_CONFIG,
        levers: [
          {
            ...VALID_CONFIG.levers[0],
            retail: {
              min: 70_000,
              max: 45_000,
              suggested: 50_000,
              step: 1_000,
            },
          },
        ],
      },
    });
    expect(badRetail.success).toBe(false);
    if (!badRetail.success) {
      expect(badRetail.error).toMatch(/between min and max/i);
    }
  });

  it("creates a live page with a minted slug on the happy path", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "admin" });
    serviceSupabase.setTableResponse("partner_pricing_pages", {
      data: { id: PAGE_ID, slug: "informa-tech-deadbeefcafe" },
      error: null,
    });

    const { createPartnerPricingPage } = await import("./partner-pricing");
    const result = await createPartnerPricingPage(VALID_INPUT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(PAGE_ID);
      expect(result.data.slug).toMatch(/^[a-z0-9-]+-[0-9a-f]{12}$/);
    }

    const insert = serviceSupabase
      .callsFor("partner_pricing_pages")
      .find((c) => c.method === "insert");
    expect(insert?.args[0]).toMatchObject({
      partner_name: "Informa Tech",
      show_label: "CES 2026",
      status: "live",
      template: "generic",
      config: VALID_CONFIG,
      created_by: "u1",
    });
    expect(String((insert?.args[0] as Record<string, unknown>).slug)).toMatch(
      /^informa-tech-[0-9a-f]{12}$/,
    );
  });
});

describe("revokePartnerPricingPage", () => {
  it("rejects a non-UUID id", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "admin" });

    const { revokePartnerPricingPage } = await import("./partner-pricing");
    const result = await revokePartnerPricingPage("not-a-uuid");

    expect(result.success).toBe(false);
    expect(serviceSupabase.from).not.toHaveBeenCalled();
  });

  it("rejects a non-authorized user", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "creative_lead" });

    const { revokePartnerPricingPage } = await import("./partner-pricing");
    const result = await revokePartnerPricingPage(PAGE_ID);

    expect(result).toEqual({ success: false, error: "Not authorized" });
    expect(serviceSupabase.from).not.toHaveBeenCalled();
  });

  it("sets status to revoked on the happy path", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "events_lead" });
    serviceSupabase.setTableResponse("partner_pricing_pages", {
      data: null,
      error: null,
    });

    const { revokePartnerPricingPage } = await import("./partner-pricing");
    const result = await revokePartnerPricingPage(PAGE_ID);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe(PAGE_ID);

    const update = serviceSupabase
      .callsFor("partner_pricing_pages")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({ status: "revoked" });
  });
});
