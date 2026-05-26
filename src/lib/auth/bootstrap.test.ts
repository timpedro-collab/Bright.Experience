import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

const getPartnerForUser = vi.fn();

vi.mock("@/lib/queries/partners", () => ({
  getPartnerForUser: (...args: unknown[]) => getPartnerForUser(...args),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  getPartnerForUser.mockReset();
});

describe("ensureProfile", () => {
  it("returns existing profile role + accountId without an insert", async () => {
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead", account_id: null },
      error: null,
    });
    const { ensureProfile } = await import("./bootstrap");
    const result = await ensureProfile(
      supabase as unknown as Parameters<typeof ensureProfile>[0],
      { id: "u1", email: "ae@x.com" }
    );
    expect(result).toEqual({ role: "events_lead", accountId: null });
    const inserts = supabase
      .callsFor("profiles")
      .filter((c) => c.method === "insert");
    expect(inserts).toHaveLength(0);
  });

  it("creates a customer_user profile when none exists", async () => {
    supabase.setTableResponse("profiles", { data: null, error: null });
    const { ensureProfile } = await import("./bootstrap");
    const result = await ensureProfile(
      supabase as unknown as Parameters<typeof ensureProfile>[0],
      {
        id: "u2",
        email: "casey@brand.com",
        user_metadata: { name: "Casey Customer" },
      }
    );
    expect(result.role).toBe("customer_user");
    const inserts = supabase
      .callsFor("profiles")
      .filter((c) => c.method === "insert");
    expect(inserts).toHaveLength(1);
    const row = inserts[0].args[0] as Record<string, unknown>;
    expect(row.id).toBe("u2");
    expect(row.role).toBe("customer_user");
    expect(row.name).toBe("Casey Customer");
  });

  it("falls back to the email prefix when user_metadata.name is missing", async () => {
    supabase.setTableResponse("profiles", { data: null, error: null });
    const { ensureProfile } = await import("./bootstrap");
    await ensureProfile(
      supabase as unknown as Parameters<typeof ensureProfile>[0],
      { id: "u3", email: "anon@brand.com" }
    );
    const inserts = supabase
      .callsFor("profiles")
      .filter((c) => c.method === "insert");
    const row = inserts[0].args[0] as Record<string, unknown>;
    expect(row.name).toBe("anon");
  });
});

describe("resolveLandingPath", () => {
  it("partner_admin lands on partner dashboard", async () => {
    getPartnerForUser.mockResolvedValue({
      slug: "acme-events",
      type: "reseller",
    });
    const { resolveLandingPath } = await import("./bootstrap");
    const landing = await resolveLandingPath(
      supabase as unknown as Parameters<typeof resolveLandingPath>[0],
      "partner_admin",
      "u1",
      "/"
    );
    expect(landing).toBe("/partners/acme-events/dashboard");
  });

  it("partner with type=venue lands on the venue dashboard", async () => {
    getPartnerForUser.mockResolvedValue({
      slug: "kings-cross",
      type: "venue",
    });
    const { resolveLandingPath } = await import("./bootstrap");
    const landing = await resolveLandingPath(
      supabase as unknown as Parameters<typeof resolveLandingPath>[0],
      "partner_member",
      "u1",
      "/"
    );
    expect(landing).toBe("/venues/kings-cross/dashboard");
  });

  it("customer_admin uses the supplied next path", async () => {
    const { resolveLandingPath } = await import("./bootstrap");
    const landing = await resolveLandingPath(
      supabase as unknown as Parameters<typeof resolveLandingPath>[0],
      "customer_admin",
      "u1",
      "/events/x"
    );
    expect(landing).toBe("/events/x");
  });

  it("never honours a /login back-redirect for any role", async () => {
    const { resolveLandingPath } = await import("./bootstrap");
    const landing = await resolveLandingPath(
      supabase as unknown as Parameters<typeof resolveLandingPath>[0],
      "events_lead",
      "u1",
      "/login"
    );
    expect(landing).toBe("/");
  });

  it("partner without a partner record falls through to the default landing", async () => {
    getPartnerForUser.mockResolvedValue(null);
    const { resolveLandingPath } = await import("./bootstrap");
    const landing = await resolveLandingPath(
      supabase as unknown as Parameters<typeof resolveLandingPath>[0],
      "partner_member",
      "u1",
      "/"
    );
    expect(landing).toBe("/");
  });
});
