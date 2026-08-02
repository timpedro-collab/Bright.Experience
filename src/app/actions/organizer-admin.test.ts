/**
 * Tests for internal organizer setup — the guards that stop a setup screen
 * quietly breaking a live show, and the row shapes the portal depends on.
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
const OTHER_PARTNER_ID = "cccccccc-2222-2222-2222-222222222222";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";
const TYPE_ID = "dddddddd-1111-1111-1111-111111111111";
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

/** The update payload recorded against a table. */
function updatePayload(client: MockSupabase, table: string) {
  const call = client.callsFor(table).find((c) => c.method === "update");
  return (call?.args[0] ?? null) as Record<string, unknown> | null;
}

describe("createOrganizerPartner", () => {
  it("refuses a user without admin rights", async () => {
    profile.role = "operations_lead";
    const { createOrganizerPartner } = await import("./organizer-admin");
    const result = await createOrganizerPartner({ name: "Informa Tech Shows" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/admin access only/);
  });

  it("rejects a name too short to identify anyone", async () => {
    const { createOrganizerPartner } = await import("./organizer-admin");
    const result = await createOrganizerPartner({ name: "I" });
    expect(result.success).toBe(false);
  });

  it("rejects a name with nothing to build a web address from", async () => {
    const { createOrganizerPartner } = await import("./organizer-admin");
    const result = await createOrganizerPartner({ name: "!!!!" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/web address/);
  });

  it("creates an active organizer with a slug taken from the name", async () => {
    supabase.queueTableResponses("partners", [
      { data: [], error: null },
      { data: { id: PARTNER_ID, slug: "informa-tech-shows" }, error: null },
    ]);
    const { createOrganizerPartner } = await import("./organizer-admin");
    const result = await createOrganizerPartner({
      name: "Informa Tech Shows",
      contactName: "Nadia Okafor",
      contactEmail: "nadia@informa.example",
    });

    expect(result.success).toBe(true);
    const payload = insertPayload(supabase, "partners")!;
    expect(payload.type).toBe("organizer");
    // Created by an admin who has already agreed the deal — no review queue.
    expect(payload.status).toBe("active");
    expect(payload.slug).toBe("informa-tech-shows");
    expect(payload.contact_email).toBe("nadia@informa.example");
    expect(payload.partner_code).toMatch(/^BB-/);
    expect(payload.onboarded_at).toBeTruthy();
  });

  it("suffixes the slug when another partner already holds it", async () => {
    supabase.queueTableResponses("partners", [
      { data: [{ slug: "informa" }], error: null },
      { data: { id: PARTNER_ID, slug: "informa-2" }, error: null },
    ]);
    const { createOrganizerPartner } = await import("./organizer-admin");
    await createOrganizerPartner({ name: "Informa" });

    expect(insertPayload(supabase, "partners")!.slug).toBe("informa-2");
  });

  it("reports a failed insert rather than claiming success", async () => {
    supabase.queueTableResponses("partners", [
      { data: [], error: null },
      { data: null, error: { message: "duplicate key" } },
    ]);
    const { createOrganizerPartner } = await import("./organizer-admin");
    const result = await createOrganizerPartner({ name: "Informa" });
    expect(result.success).toBe(false);
  });
});

describe("inviteOrganizerUser", () => {
  it("refuses a user without admin rights", async () => {
    profile.role = "qa_lead";
    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(PARTNER_ID, "nadia@informa.example", "partner_admin");
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email before touching auth", async () => {
    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(PARTNER_ID, "not-an-email", "partner_admin");
    expect(result.success).toBe(false);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("refuses a partner that isn't an organizer", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "venue", name: "The Venue" },
      error: null,
    });
    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(PARTNER_ID, "nadia@informa.example", "partner_admin");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/doesn't exist/);
  });

  it("invites a brand-new person and writes both rows the portal checks", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "organizer", name: "Informa" },
      error: null,
    });
    // No existing profile for this email.
    serviceSupabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(
      PARTNER_ID,
      "Nadia@Informa.example",
      "partner_admin"
    );

    expect(result.success).toBe(true);
    // Normalised, so a capitalised invite can't create a second account later.
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "nadia@informa.example",
      expect.anything()
    );

    const upsert = serviceSupabase
      .callsFor("profiles")
      .find((c) => c.method === "upsert")!.args[0] as Record<string, unknown>;
    expect(upsert.role).toBe("partner_admin");
    expect(upsert.email).toBe("nadia@informa.example");

    // Membership is what `requireOrganizerContext` actually reads.
    expect(insertPayload(supabase, "partner_users")).toMatchObject({
      partner_id: PARTNER_ID,
      profile_id: NEW_PROFILE_ID,
      role: "admin",
    });
  });

  it("gives a viewer the member grade", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "organizer", name: "Informa" },
      error: null,
    });
    serviceSupabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { inviteOrganizerUser } = await import("./organizer-admin");
    await inviteOrganizerUser(PARTNER_ID, "viewer@informa.example", "partner_member");

    expect(insertPayload(supabase, "partner_users")!.role).toBe("member");
  });

  it("reuses an existing account instead of inviting them again", async () => {
    supabase.setTableResponse("partners", {
      data: { id: PARTNER_ID, type: "organizer", name: "Informa" },
      error: null,
    });
    serviceSupabase.setTableResponse("profiles", {
      data: { id: "existing-user", role: "partner_member" },
      error: null,
    });
    supabase.setTableResponse("partner_users", { data: null, error: null });

    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(PARTNER_ID, "known@informa.example", "partner_admin");

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.existingUser).toBe(true);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
    expect(insertPayload(supabase, "partner_users")!.profile_id).toBe("existing-user");
  });

  it("doesn't duplicate a membership that already exists", async () => {
    supabase.queueTableResponses("partners", [
      { data: { id: PARTNER_ID, type: "organizer", name: "Informa" }, error: null },
    ]);
    serviceSupabase.setTableResponse("profiles", {
      data: { id: "existing-user", role: "partner_admin" },
      error: null,
    });
    supabase.setTableResponse("partner_users", { data: { id: "m1" }, error: null });

    const { inviteOrganizerUser } = await import("./organizer-admin");
    const result = await inviteOrganizerUser(PARTNER_ID, "known@informa.example", "partner_admin");

    expect(result.success).toBe(true);
    expect(insertPayload(supabase, "partner_users")).toBeNull();
  });
});

describe("linkShowToOrganizer", () => {
  it("refuses a show that belongs to another organizer", async () => {
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID, organizer_partner_id: OTHER_PARTNER_ID },
      error: null,
    });
    const { linkShowToOrganizer } = await import("./organizer-admin");
    const result = await linkShowToOrganizer(EVENT_ID, PARTNER_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Unlink it there first/);
  });

  it("refuses a show that doesn't exist", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { linkShowToOrganizer } = await import("./organizer-admin");
    const result = await linkShowToOrganizer(EVENT_ID, PARTNER_ID);
    expect(result.success).toBe(false);
  });

  it("links an unclaimed show", async () => {
    supabase.queueTableResponses("events", [
      { data: { id: EVENT_ID, organizer_partner_id: null }, error: null },
      { data: null, error: null },
    ]);
    const { linkShowToOrganizer } = await import("./organizer-admin");
    const result = await linkShowToOrganizer(EVENT_ID, PARTNER_ID);

    expect(result.success).toBe(true);
    expect(updatePayload(supabase, "events")).toEqual({ organizer_partner_id: PARTNER_ID });
  });

  it("is idempotent for a show already linked to the same organizer", async () => {
    supabase.queueTableResponses("events", [
      { data: { id: EVENT_ID, organizer_partner_id: PARTNER_ID }, error: null },
      { data: null, error: null },
    ]);
    const { linkShowToOrganizer } = await import("./organizer-admin");
    expect((await linkShowToOrganizer(EVENT_ID, PARTNER_ID)).success).toBe(true);
  });
});

describe("unlinkShowFromOrganizer", () => {
  it("clears the organizer off the show", async () => {
    supabase.queueTableResponses("events", [
      { data: { organizer_partner_id: PARTNER_ID }, error: null },
      { data: null, error: null },
    ]);
    const { unlinkShowFromOrganizer } = await import("./organizer-admin");
    const result = await unlinkShowFromOrganizer(EVENT_ID);

    expect(result.success).toBe(true);
    expect(updatePayload(supabase, "events")).toEqual({ organizer_partner_id: null });
  });
});

describe("createMachineInstance", () => {
  const VALID = { machineTypeId: TYPE_ID, serialNumber: "bv-2010" };

  it("rejects a serial with characters a label can't carry", async () => {
    const { createMachineInstance } = await import("./organizer-admin");
    const result = await createMachineInstance({ ...VALID, serialNumber: "BV 2010!" });
    expect(result.success).toBe(false);
  });

  it("refuses a serial that is already registered", async () => {
    supabase.setTableResponse("machine_instances", { data: { id: MACHINE_ID }, error: null });
    const { createMachineInstance } = await import("./organizer-admin");
    const result = await createMachineInstance(VALID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/BV-2010 is already registered/);
  });

  it("normalises the serial and deploys it when a show is named", async () => {
    supabase.queueTableResponses("machine_instances", [
      { data: null, error: null },
      { data: { id: MACHINE_ID }, error: null },
    ]);
    const { createMachineInstance } = await import("./organizer-admin");
    const result = await createMachineInstance({ ...VALID, eventId: EVENT_ID, nickname: "Foyer" });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.serialNumber).toBe("BV-2010");
    expect(insertPayload(supabase, "machine_instances")).toMatchObject({
      serial_number: "BV-2010",
      machine_type_id: TYPE_ID,
      nickname: "Foyer",
      current_event_id: EVENT_ID,
      status: "deployed",
    });
  });

  it("leaves a unit available when no show is named", async () => {
    supabase.queueTableResponses("machine_instances", [
      { data: null, error: null },
      { data: { id: MACHINE_ID }, error: null },
    ]);
    const { createMachineInstance } = await import("./organizer-admin");
    await createMachineInstance(VALID);

    expect(insertPayload(supabase, "machine_instances")).toMatchObject({
      current_event_id: null,
      status: "available",
    });
  });
});

describe("assignMachineToShow", () => {
  it("refuses to pull a unit off another show", async () => {
    supabase.setTableResponse("machine_instances", {
      data: {
        id: MACHINE_ID,
        serial_number: "BV-2001",
        current_event_id: "e2222222-2222-2222-2222-222222222222",
        status: "deployed",
      },
      error: null,
    });
    const { assignMachineToShow } = await import("./organizer-admin");
    const result = await assignMachineToShow(MACHINE_ID, EVENT_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Release it there first/);
  });

  it("refuses a retired unit", async () => {
    supabase.setTableResponse("machine_instances", {
      data: {
        id: MACHINE_ID,
        serial_number: "BV-1999",
        current_event_id: null,
        status: "retired",
      },
      error: null,
    });
    const { assignMachineToShow } = await import("./organizer-admin");
    const result = await assignMachineToShow(MACHINE_ID, EVENT_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/retired/);
  });

  it("refuses a unit sited on the venue estate", async () => {
    supabase.setTableResponse("machine_instances", {
      data: {
        id: MACHINE_ID,
        serial_number: "EXL-CB01",
        current_event_id: null,
        status: "deployed",
      },
      error: null,
    });
    supabase.setTableResponse("placements", { data: { id: "p1" }, error: null });
    const { assignMachineToShow } = await import("./organizer-admin");
    const result = await assignMachineToShow(MACHINE_ID, EVENT_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/sited at a venue/);
  });

  it("deploys a free unit and marks it deployed", async () => {
    supabase.queueTableResponses("machine_instances", [
      {
        data: {
          id: MACHINE_ID,
          serial_number: "BV-2001",
          current_event_id: null,
          status: "available",
        },
        error: null,
      },
      { data: null, error: null },
    ]);
    supabase.setTableResponse("placements", { data: null, error: null });
    const { assignMachineToShow } = await import("./organizer-admin");
    const result = await assignMachineToShow(MACHINE_ID, EVENT_ID);

    expect(result.success).toBe(true);
    expect(updatePayload(supabase, "machine_instances")).toEqual({
      current_event_id: EVENT_ID,
      status: "deployed",
    });
  });
});

describe("releaseMachineFromShow", () => {
  it("refuses a unit that isn't at a show", async () => {
    supabase.setTableResponse("machine_instances", {
      data: { id: MACHINE_ID, serial_number: "BV-2001", current_event_id: null },
      error: null,
    });
    const { releaseMachineFromShow } = await import("./organizer-admin");
    const result = await releaseMachineFromShow(MACHINE_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/isn't at a show/);
  });

  it("refuses while a sponsor is pointing at the unit, and names them", async () => {
    supabase.setTableResponse("machine_instances", {
      data: { id: MACHINE_ID, serial_number: "BV-2001", current_event_id: EVENT_ID },
      error: null,
    });
    supabase.setTableResponse("sponsorship_slots", {
      data: { id: "s1", sponsor_name: "Sponsor Co" },
      error: null,
    });
    const { releaseMachineFromShow } = await import("./organizer-admin");
    const result = await releaseMachineFromShow(MACHINE_ID);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Sponsor Co's sponsor slot/);
  });

  it("clears the deployment so a zone can't follow the unit to the next show", async () => {
    supabase.queueTableResponses("machine_instances", [
      {
        data: { id: MACHINE_ID, serial_number: "BV-2001", current_event_id: EVENT_ID },
        error: null,
      },
      { data: null, error: null },
    ]);
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });

    const { releaseMachineFromShow } = await import("./organizer-admin");
    const result = await releaseMachineFromShow(MACHINE_ID);

    expect(result.success).toBe(true);
    expect(updatePayload(supabase, "machine_instances")).toEqual({
      current_event_id: null,
      status: "available",
      zone: null,
      mission: null,
    });
  });
});
