/**
 * Tests for deal-registration actions — register guards, duplicate and
 * cross-channel claims, the review verdicts, and reverse lead pushes.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
let serviceSupabase: MockSupabase;

const requirePartnerForSlug = vi.fn(async () => ({
  supabase,
  partnerId: PARTNER_ID,
}));
const requireInternalUser = vi.fn(async () => ({
  supabase,
  profile: { id: "internal-1", role: "admin" },
}));
const dispatchNotification = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock("@/lib/auth/portal", () => ({
  requirePartnerForSlug: () => requirePartnerForSlug(),
}));
vi.mock("@/lib/auth", () => ({
  requireInternalUser: () => requireInternalUser(),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => serviceSupabase,
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const PARTNER_ID = "aaaaaaaa-1111-1111-1111-111111111111";
const REGISTRATION_ID = "bbbbbbbb-1111-1111-1111-111111111111";
const QUOTE_ID = "cccccccc-1111-1111-1111-111111111111";

const VALID_INPUT = {
  partnerSlug: "informa",
  sponsorCompany: "Monster Energy",
  estimatedValue: 15000,
};

const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  requirePartnerForSlug.mockClear();
  requireInternalUser.mockClear();
  dispatchNotification.mockClear();
});

describe("registerDeal", () => {
  it("registers a new claim and tells the review queue", async () => {
    supabase.queueTableResponses("deal_registrations", [
      { data: [], error: null }, // own-claim lookup
      { data: { id: REGISTRATION_ID }, error: null }, // insert
    ]);
    supabase.setTableResponse("partners", {
      data: { name: "Informa" },
      error: null,
    });
    serviceSupabase.setTableResponse("deal_registrations", {
      data: [],
      error: null,
    });

    const { registerDeal } = await import("./deal-registrations");
    const result = await registerDeal(VALID_INPUT);

    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "deal.registered",
      expect.objectContaining({
        sponsorCompany: "Monster Energy",
        partnerName: "Informa",
      })
    );

    const insert = supabase
      .callsFor("deal_registrations")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.partner_id).toBe(PARTNER_ID);
    expect(payload.status).toBe("pending");
    expect(payload.source).toBe("organizer");
    // Whole pounds from the form arrive as integer minor units.
    expect(payload.estimated_value).toBe(1_500_000);
  });

  it("hands back the existing claim instead of stacking duplicates", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: [
        {
          id: REGISTRATION_ID,
          sponsor_company: "MONSTER ENERGY LTD",
          status: "approved",
          exclusivity_expires_at: FUTURE,
        },
      ],
      error: null,
    });

    const { registerDeal } = await import("./deal-registrations");
    const result = await registerDeal(VALID_INPUT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.alreadyRegistered).toBe(true);
      expect(result.data.id).toBe(REGISTRATION_ID);
    }
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("blocks a claim another channel already holds", async () => {
    supabase.setTableResponse("deal_registrations", { data: [], error: null });
    serviceSupabase.setTableResponse("deal_registrations", {
      data: [
        {
          partner_id: "other-partner",
          sponsor_company: "Monster Energy Inc",
          status: "pending",
          exclusivity_expires_at: null,
        },
      ],
      error: null,
    });

    const { registerDeal } = await import("./deal-registrations");
    const result = await registerDeal(VALID_INPUT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/already registered to another channel/i);
    }
  });

  it("rejects nonsense input before touching the database", async () => {
    const { registerDeal } = await import("./deal-registrations");
    const result = await registerDeal({
      ...VALID_INPUT,
      sponsorCompany: "x",
    });

    expect(result.success).toBe(false);
    expect(requirePartnerForSlug).not.toHaveBeenCalled();
  });
});

describe("approveDealRegistration", () => {
  it("starts the exclusivity window and tells the organizer", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: { id: REGISTRATION_ID },
      error: null,
    });
    serviceSupabase.setTableResponse("deal_registrations", {
      data: {
        sponsor_company: "Monster Energy",
        partners: { slug: "informa" },
      },
      error: null,
    });

    const { approveDealRegistration } = await import("./deal-registrations");
    const result = await approveDealRegistration(REGISTRATION_ID);

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("deal_registrations")
      .find((c) => c.method === "update");
    const payload = update!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("approved");
    expect(typeof payload.exclusivity_expires_at).toBe("string");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "deal.approved",
      expect.objectContaining({
        organizerSlug: "informa",
        sponsorCompany: "Monster Energy",
      })
    );
  });

  it("refuses to approve anything that isn't pending", async () => {
    supabase.setTableResponse("deal_registrations", { data: null, error: null });

    const { approveDealRegistration } = await import("./deal-registrations");
    const result = await approveDealRegistration(REGISTRATION_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/pending/i);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("refuses non-commercial internal roles", async () => {
    requireInternalUser.mockResolvedValueOnce({
      supabase,
      profile: { id: "internal-2", role: "qa_lead" },
    });

    const { approveDealRegistration } = await import("./deal-registrations");
    await expect(approveDealRegistration(REGISTRATION_ID)).rejects.toThrow(
      /commercial access only/i
    );
  });
});

describe("rejectDealRegistration", () => {
  it("stores the reason and sends it to the organizer verbatim", async () => {
    supabase.setTableResponse("deal_registrations", {
      data: { id: REGISTRATION_ID },
      error: null,
    });
    serviceSupabase.setTableResponse("deal_registrations", {
      data: {
        sponsor_company: "Monster Energy",
        partners: { slug: "informa" },
      },
      error: null,
    });

    const { rejectDealRegistration } = await import("./deal-registrations");
    const result = await rejectDealRegistration(
      REGISTRATION_ID,
      "We're already mid-conversation with them"
    );

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("deal_registrations")
      .find((c) => c.method === "update");
    expect((update!.args[0] as Record<string, unknown>).rejected_reason).toBe(
      "We're already mid-conversation with them"
    );
    expect(dispatchNotification).toHaveBeenCalledWith(
      "deal.rejected",
      expect.objectContaining({
        reason: "We're already mid-conversation with them",
      })
    );
  });
});

describe("pushLeadToOrganizer", () => {
  it("creates a pre-approved reverse shell from the quote", async () => {
    supabase.setTableResponse("quotes", {
      data: {
        id: QUOTE_ID,
        company_name: "Duracell",
        contact_name: "Dana",
        contact_email: "dana@duracell.test",
        total_amount: 1_200_000,
      },
      error: null,
    });
    supabase.setTableResponse("deal_registrations", {
      data: { id: REGISTRATION_ID },
      error: null,
    });
    serviceSupabase.setTableResponse("deal_registrations", {
      data: [],
      error: null,
    });

    const { pushLeadToOrganizer } = await import("./deal-registrations");
    const result = await pushLeadToOrganizer({
      quoteId: QUOTE_ID,
      partnerId: PARTNER_ID,
    });

    expect(result.success).toBe(true);
    const insert = supabase
      .callsFor("deal_registrations")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.source).toBe("reverse");
    expect(payload.status).toBe("approved");
    expect(payload.sponsor_company).toBe("Duracell");
    expect(typeof payload.exclusivity_expires_at).toBe("string");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "deal.lead_pushed",
      expect.objectContaining({ sponsorCompany: "Duracell" })
    );
  });

  it("fails cleanly when the quote does not exist", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });

    const { pushLeadToOrganizer } = await import("./deal-registrations");
    const result = await pushLeadToOrganizer({
      quoteId: QUOTE_ID,
      partnerId: PARTNER_ID,
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/quote not found/i);
  });
});
