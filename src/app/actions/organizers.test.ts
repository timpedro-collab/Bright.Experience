/**
 * Tests for organizer show actions — slot creation guards, pitch-link
 * lifecycle, and per-machine deployment updates.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
/**
 * Deployment writes go through the service-role client (see
 * `updateMachineDeployment`), so it is a separate double here — asserting on
 * the session client would silently pass even if the write moved back to a
 * path RLS blocks.
 */
let serviceSupabase: MockSupabase;
const requireOrganizerForShow = vi.fn(async () => ({ supabase }));
const requireVenueManagerForSlot = vi.fn(async () => ({ supabase }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => serviceSupabase,
}));
vi.mock("@/lib/auth/portal", () => ({
  requireOrganizerForShow: (...args: unknown[]) => requireOrganizerForShow(...(args as [])),
  requireVenueManagerForSlot: (...args: unknown[]) =>
    requireVenueManagerForSlot(...(args as [])),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";
const SLOT_ID = "bbbbbbbb-1111-1111-1111-111111111111";

const VALID_SLOT = {
  eventId: EVENT_ID,
  machineInstanceId: MACHINE_ID,
  sponsorName: "Sponsor Co",
  startDate: "2026-09-15",
  endDate: "2026-09-17",
  price: 25000,
};

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  requireOrganizerForShow.mockClear();
  requireVenueManagerForSlot.mockClear();
});

/** A deployed machine the session client can resolve to its show. */
function machineIsDeployed() {
  supabase.setTableResponse("machine_instances", {
    data: { current_event_id: EVENT_ID },
    error: null,
  });
  serviceSupabase.setTableResponse("machine_instances", {
    data: { id: MACHINE_ID },
    error: null,
  });
}

describe("createShowSlot", () => {
  it("rejects a machine that is not deployed to the show", async () => {
    supabase.setTableResponse("machine_instances", { data: null, error: null });
    const { createShowSlot } = await import("./organizers");
    const result = await createShowSlot(VALID_SLOT);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/isn't deployed to this show/);
  });

  it("creates the slot when the machine belongs to the show", async () => {
    supabase.setTableResponse("machine_instances", { data: { id: MACHINE_ID }, error: null });
    supabase.setTableResponse("sponsorship_slots", { data: { id: SLOT_ID }, error: null });
    const { createShowSlot } = await import("./organizers");
    const result = await createShowSlot(VALID_SLOT);
    expect(result.success).toBe(true);

    const insert = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.event_id).toBe(EVENT_ID);
    expect(payload.machine_instance_id).toBe(MACHINE_ID);
    expect(payload.sponsor_name).toBe("Sponsor Co");
    // A named sponsor means the unit is spoken for, not still on the shelf.
    expect(payload.status).toBe("reserved");
  });

  it("leaves an unnamed slot on sale", async () => {
    supabase.setTableResponse("machine_instances", { data: { id: MACHINE_ID }, error: null });
    supabase.setTableResponse("sponsorship_slots", { data: { id: SLOT_ID }, error: null });
    const { createShowSlot } = await import("./organizers");
    await createShowSlot({ ...VALID_SLOT, sponsorName: "   " });

    const insert = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.sponsor_name).toBeNull();
    expect(payload.status).toBe("available");
  });

  it("stores price in minor units to match the venue runway", async () => {
    supabase.setTableResponse("machine_instances", { data: { id: MACHINE_ID }, error: null });
    supabase.setTableResponse("sponsorship_slots", { data: { id: SLOT_ID }, error: null });
    const { createShowSlot } = await import("./organizers");
    await createShowSlot(VALID_SLOT);

    const insert = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "insert");
    expect((insert!.args[0] as Record<string, unknown>).price).toBe(2_500_000);
  });

  it("authorizes against the show before writing", async () => {
    supabase.setTableResponse("machine_instances", { data: { id: MACHINE_ID }, error: null });
    supabase.setTableResponse("sponsorship_slots", { data: { id: SLOT_ID }, error: null });
    const { createShowSlot } = await import("./organizers");
    await createShowSlot(VALID_SLOT);
    expect(requireOrganizerForShow).toHaveBeenCalledWith(EVENT_ID);
  });

  it("rejects an invalid show id before touching the database", async () => {
    const { createShowSlot } = await import("./organizers");
    const result = await createShowSlot({ ...VALID_SLOT, eventId: "nope" });
    expect(result.success).toBe(false);
    expect(requireOrganizerForShow).not.toHaveBeenCalled();
  });
});

describe("shareSlotPitch", () => {
  it("mints a token with an expiry", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });
    const { shareSlotPitch } = await import("./organizers");
    const result = await shareSlotPitch(SLOT_ID);
    expect(result.success).toBe(true);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    const payload = update!.args[0] as Record<string, unknown>;
    expect(String(payload.pitch_token)).toHaveLength(36);
    expect(payload.pitch_token_expires_at).toBeTruthy();
    expect(new Date(String(payload.pitch_token_expires_at)).getTime()).toBeGreaterThan(
      Date.now()
    );
  });

  it("rotates to a fresh token on a second call, killing the old link", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });
    const { shareSlotPitch } = await import("./organizers");
    const first = await shareSlotPitch(SLOT_ID);
    const second = await shareSlotPitch(SLOT_ID);
    expect(first.success && second.success).toBe(true);
    if (first.success && second.success) {
      expect(first.data.token).not.toBe(second.data.token);
    }
  });

  it("rejects an expiry beyond the allowed window", async () => {
    const { shareSlotPitch } = await import("./organizers");
    const result = await shareSlotPitch(SLOT_ID, 999);
    expect(result.success).toBe(false);
  });

  it("authorizes through the slot guard", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });
    const { shareSlotPitch } = await import("./organizers");
    await shareSlotPitch(SLOT_ID);
    expect(requireVenueManagerForSlot).toHaveBeenCalledWith(SLOT_ID);
  });
});

describe("revokeSlotPitch", () => {
  it("clears both the token and its expiry", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { pitch_token: "old-token" },
      error: null,
    });
    const { revokeSlotPitch } = await import("./organizers");
    const result = await revokeSlotPitch(SLOT_ID);
    expect(result.success).toBe(true);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({ pitch_token: null, pitch_token_expires_at: null });
  });
});

describe("attachSlotCreatives", () => {
  const ASSET_ID = "cccccccc-1111-1111-1111-111111111111";

  it("refuses creative that belongs to another show", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: { event_id: EVENT_ID }, error: null });
    supabase.setTableResponse("assets", { data: [], error: null });
    const { attachSlotCreatives } = await import("./organizers");
    const result = await attachSlotCreatives(SLOT_ID, [ASSET_ID]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/doesn't belong to this show/);
  });

  it("attaches creative from the show's own library", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: { event_id: EVENT_ID }, error: null });
    supabase.setTableResponse("assets", { data: [{ id: ASSET_ID }], error: null });
    const { attachSlotCreatives } = await import("./organizers");
    const result = await attachSlotCreatives(SLOT_ID, [ASSET_ID]);
    expect(result.success).toBe(true);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({ creative_asset_ids: [ASSET_ID] });
  });

  it("treats an empty list as detach and skips the ownership lookup", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: { event_id: EVENT_ID }, error: null });
    const { attachSlotCreatives } = await import("./organizers");
    const result = await attachSlotCreatives(SLOT_ID, []);
    expect(result.success).toBe(true);
    expect(supabase.callsFor("assets")).toHaveLength(0);
  });

  it("rejects a venue slot, which has no show to draw creative from", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: { event_id: null }, error: null });
    const { attachSlotCreatives } = await import("./organizers");
    const result = await attachSlotCreatives(SLOT_ID, [ASSET_ID]);
    expect(result.success).toBe(false);
  });

  it("caps how much creative one slot can carry", async () => {
    const { attachSlotCreatives } = await import("./organizers");
    const tooMany = Array.from({ length: 21 }, () => ASSET_ID);
    const result = await attachSlotCreatives(SLOT_ID, tooMany);
    expect(result.success).toBe(false);
    expect(requireVenueManagerForSlot).not.toHaveBeenCalled();
  });
});

describe("updateMachineDeployment", () => {
  it("rejects a machine that is not deployed anywhere", async () => {
    supabase.setTableResponse("machine_instances", { data: null, error: null });
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment(MACHINE_ID, { zone: "Hall 3" });
    expect(result.success).toBe(false);
  });

  it("saves zone and mission for a deployed machine", async () => {
    machineIsDeployed();
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment(MACHINE_ID, {
      zone: "  Hall 3  ",
      mission: "sponsor_activation",
    });
    expect(result.success).toBe(true);

    const update = serviceSupabase
      .callsFor("machine_instances")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({ zone: "Hall 3", mission: "sponsor_activation" });
  });

  it("writes only the two deployment columns, never the hardware record", async () => {
    machineIsDeployed();
    const { updateMachineDeployment } = await import("./organizers");
    await updateMachineDeployment(MACHINE_ID, {
      zone: "Hall 3",
      mission: "welcome_gift",
    });

    const update = serviceSupabase
      .callsFor("machine_instances")
      .find((c) => c.method === "update");
    expect(Object.keys(update!.args[0] as object).sort()).toEqual(["mission", "zone"]);
  });

  it("clears a blank zone rather than storing whitespace", async () => {
    machineIsDeployed();
    const { updateMachineDeployment } = await import("./organizers");
    await updateMachineDeployment(MACHINE_ID, { zone: "   " });

    const update = serviceSupabase
      .callsFor("machine_instances")
      .find((c) => c.method === "update");
    expect(update!.args[0]).toEqual({ zone: null });
  });

  it("reports failure when the write matches no row", async () => {
    supabase.setTableResponse("machine_instances", {
      data: { current_event_id: EVENT_ID },
      error: null,
    });
    serviceSupabase.setTableResponse("machine_instances", { data: null, error: null });
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment(MACHINE_ID, { zone: "Hall 3" });
    expect(result.success).toBe(false);
  });

  it("skips the write entirely when nothing was passed to change", async () => {
    machineIsDeployed();
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment(MACHINE_ID, {});
    expect(result.success).toBe(true);
    expect(serviceSupabase.callsFor("machine_instances")).toHaveLength(0);
  });

  it("rejects a mission the machine stack doesn't implement", async () => {
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment(MACHINE_ID, {
      mission: "teleportation" as never,
    });
    expect(result.success).toBe(false);
  });

  it("authorizes against the show the machine is deployed to", async () => {
    machineIsDeployed();
    const { updateMachineDeployment } = await import("./organizers");
    await updateMachineDeployment(MACHINE_ID, { zone: "Hall 3" });
    expect(requireOrganizerForShow).toHaveBeenCalledWith(EVENT_ID);
  });

  it("refuses before authorizing when the machine id is malformed", async () => {
    const { updateMachineDeployment } = await import("./organizers");
    const result = await updateMachineDeployment("not-a-machine", { zone: "Hall 3" });
    expect(result.success).toBe(false);
    expect(requireOrganizerForShow).not.toHaveBeenCalled();
  });
});
