/** Tests for co-brand-safe partner lookups and default brand resolution. */
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

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  vi.resetModules();
});

describe("getPartnerBrandById", () => {
  it("returns mapped brand fields for an active partner", async () => {
    serviceSupabase.setTableResponse("partners", {
      data: {
        id: "partner-1",
        name: "Agency X",
        logo_url: "https://cdn.example/logo.png",
        brand_color: "#112233",
      },
      error: null,
    });

    const { getPartnerBrandById } = await import("./partner-brand");
    const brand = await getPartnerBrandById("partner-1");

    expect(brand).toEqual({
      id: "partner-1",
      name: "Agency X",
      logoUrl: "https://cdn.example/logo.png",
      brandColor: "#112233",
    });
  });

  it("returns null for inactive or missing partners", async () => {
    serviceSupabase.setTableResponse("partners", { data: null, error: null });

    const { getPartnerBrandById } = await import("./partner-brand");
    const brand = await getPartnerBrandById("missing");

    expect(brand).toBeNull();
  });

  it("returns null when the query errors", async () => {
    serviceSupabase.setTableResponse("partners", {
      data: null,
      error: { message: "boom" },
    });

    const { getPartnerBrandById } = await import("./partner-brand");
    const brand = await getPartnerBrandById("partner-1");

    expect(brand).toBeNull();
  });
});

describe("getDefaultBrandPartnerForEvent", () => {
  it("prefers organizer_partner_id over attribution", async () => {
    supabase.queueTableResponses("events", [
      { data: { organizer_partner_id: "org-partner" }, error: null },
    ]);

    const { getDefaultBrandPartnerForEvent } = await import("./partner-brand");
    const partnerId = await getDefaultBrandPartnerForEvent("evt-1");

    expect(partnerId).toBe("org-partner");
    expect(supabase.callsFor("partner_attributions")).toHaveLength(0);
  });

  it("falls back to the most recent partner attribution", async () => {
    supabase.queueTableResponses("events", [
      { data: { organizer_partner_id: null }, error: null },
    ]);
    supabase.setTableResponse("partner_attributions", {
      data: { partner_id: "attr-partner" },
      error: null,
    });

    const { getDefaultBrandPartnerForEvent } = await import("./partner-brand");
    const partnerId = await getDefaultBrandPartnerForEvent("evt-2");

    expect(partnerId).toBe("attr-partner");
  });
});
