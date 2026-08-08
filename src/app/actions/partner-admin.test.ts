/**
 * Tests for the generic partner invite — the guard that keeps it internal,
 * and the two rows (profile + membership) every partner portal checks.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
let serviceSupabase: MockSupabase;
const inviteUserByEmail = vi.fn(async (email: string) => ({
  data: { user: { id: NEW_PROFILE_ID, email } },
  error: null,
}));
const profile = { id: "u1", role: "admin" };

vi.mock("@/lib/auth", () => ({
  requireInternalUser: vi.fn(async () => ({ supabase, profile })),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => serviceSupabase,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const PARTNER_ID = "cccccccc-1111-1111-1111-111111111111";
const NEW_PROFILE_ID = "ffffffff-1111-1111-1111-111111111111";

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  serviceSupabase.auth = {
    ...serviceSupabase.auth,
    // The real client exposes the invite under `auth.admin`; the shared double
    // only models the session surface, so extend it here.
    admin: { inviteUserByEmail },
  } as unknown as MockSupabase["auth"];
  inviteUserByEmail.mockClear();
  profile.role = "admin";
});

/** The insert payload recorded against a table. */
function insertPayload(client: MockSupabase, table: string) {
  const call = client.callsFor(table).find((c) => c.method === "insert");
  return (call?.args[0] ?? null) as Record<string, unknown> | null;
}

describe("invitePartnerUser", () => {
  it("refuses a user without admin rights", async () => {
    profile.role = "qa_lead";
    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "dana@venue.example", "partner_admin");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/admin access only/);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed email before touching auth", async () => {
    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "not-an-email", "partner_admin");
    expect(result.success).toBe(false);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("refuses a partner that doesn't exist", async () => {
    supabase.setTableResponse("partners", { data: null, error: null });
    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "dana@venue.example", "partner_admin");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/doesn't exist/);
  });

  it("invites a brand-new person to any partner type and writes both rows the portal checks", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "venue", name: "Riverside Arena" },
      error: null,
    });
    // No existing profile for this email.
    serviceSupabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "Dana@Venue.example", "partner_admin");

    expect(result.success).toBe(true);
    // Normalised, so a capitalised invite can't create a second account later.
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "dana@venue.example",
      expect.anything()
    );

    const upsert = serviceSupabase
      .callsFor("profiles")
      .find((c) => c.method === "upsert")!.args[0] as Record<string, unknown>;
    expect(upsert.role).toBe("partner_admin");
    expect(upsert.email).toBe("dana@venue.example");

    // Membership is what the partner portal guards actually read.
    expect(insertPayload(supabase, "partner_users")).toMatchObject({
      partner_id: PARTNER_ID,
      profile_id: NEW_PROFILE_ID,
      role: "admin",
    });
  });

  it("gives a viewer the member grade", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "agency", name: "Bright Agency" },
      error: null,
    });
    serviceSupabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { invitePartnerUser } = await import("./partner-admin");
    await invitePartnerUser(PARTNER_ID, "viewer@agency.example", "partner_member");

    expect(insertPayload(supabase, "partner_users")!.role).toBe("member");
  });

  it("reuses an existing account instead of inviting them again", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "venue", name: "Riverside Arena" },
      error: null,
    });
    serviceSupabase.setTableResponse("profiles", {
      data: { id: "existing-user", role: "partner_member" },
      error: null,
    });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "known@venue.example", "partner_admin");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.existingUser).toBe(true);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
    expect(insertPayload(supabase, "partner_users")!.profile_id).toBe("existing-user");
  });

  it("doesn't duplicate a membership that already exists", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "venue", name: "Riverside Arena" },
      error: null,
    });
    serviceSupabase.setTableResponse("profiles", {
      data: { id: "existing-user", role: "partner_admin" },
      error: null,
    });
    supabase.setTableResponse("partner_users", { data: { id: "m1" }, error: null });

    const { invitePartnerUser } = await import("./partner-admin");
    const result = await invitePartnerUser(PARTNER_ID, "known@venue.example", "partner_admin");

    expect(result.success).toBe(true);
    expect(insertPayload(supabase, "partner_users")).toBeNull();
  });
});
