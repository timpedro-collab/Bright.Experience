/**
 * Tests for the event server actions. Covers RBAC, validation,
 * Supabase insertion, and the Pipedrive trigger plumbing.
 *
 * We deliberately mock at the boundary: `@/lib/supabase/server`,
 * `@/lib/auth`, and `@/lib/pipedrive/triggers`. Everything in between
 * (validation, normalisation, error surface) runs for real.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const getUser = vi.fn();
const enqueueDealKickoff = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
// renameEvent writes via the service role (events UPDATE RLS is
// internal-only) — point it at the same recorder.
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/lib/pipedrive/triggers", () => ({
  enqueueDealKickoff: (...args: unknown[]) => enqueueDealKickoff(...args),
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAudit(...args),
}));

const writeAudit = vi.fn();

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset();
  enqueueDealKickoff.mockReset();
  writeAudit.mockReset();
});

const validInput = {
  accountId: "00000000-0000-4000-8000-000000000001",
  name: "Spring Activation",
  eventType: "activation" as const,
  packageType: "standard" as const,
  eventDateStart: "2026-06-15",
};

describe("createEvent — RBAC", () => {
  it("fails when not authenticated", async () => {
    getUser.mockResolvedValue(null);
    const { createEvent } = await import("./events");
    expect(await createEvent(validInput)).toMatchObject({
      success: false,
      error: expect.stringMatching(/Only internal users/),
    });
  });

  it("fails when user is a customer", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { createEvent } = await import("./events");
    expect(await createEvent(validInput)).toMatchObject({
      success: false,
      error: expect.stringMatching(/Only internal users/),
    });
  });

  it("allows an events_lead to create", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
    supabase.setTableResponse("events", { data: { id: "evt-1" }, error: null });
    const { createEvent } = await import("./events");
    const result = await createEvent(validInput);
    expect(result).toEqual({ success: true, data: { id: "evt-1" } });
  });
});

describe("createEvent — validation", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
  });

  it("rejects a non-UUID accountId", async () => {
    const { createEvent } = await import("./events");
    expect(
      await createEvent({ ...validInput, accountId: "garbage" })
    ).toMatchObject({ success: false, error: expect.stringMatching(/customer account/) });
  });

  it("rejects a too-short name", async () => {
    const { createEvent } = await import("./events");
    expect(
      await createEvent({ ...validInput, name: "x" })
    ).toMatchObject({ success: false, error: expect.stringMatching(/event a name/) });
  });

  it("rejects a missing eventDateStart", async () => {
    const { createEvent } = await import("./events");
    expect(
      await createEvent({ ...validInput, eventDateStart: "" })
    ).toMatchObject({ success: false, error: expect.stringMatching(/start date/i) });
  });
});

describe("createEvent — Pipedrive linking", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
  });

  it("does not enqueue when no pipedriveDealId is provided", async () => {
    supabase.setTableResponse("events", { data: { id: "evt-1" }, error: null });
    const { createEvent } = await import("./events");
    await createEvent(validInput);
    expect(enqueueDealKickoff).not.toHaveBeenCalled();
  });

  it("normalises a deal URL and enqueues the kickoff", async () => {
    supabase.setTableResponse("events", { data: { id: "evt-1" }, error: null });
    const { createEvent } = await import("./events");
    await createEvent({
      ...validInput,
      pipedriveDealId: "https://acme.pipedrive.com/deal/9876",
    });
    expect(enqueueDealKickoff).toHaveBeenCalledWith("evt-1");
    // Confirm the insert payload carried the normalised ID
    const insertCall = supabase
      .callsFor("events")
      .find((c) => c.method === "insert");
    const row = (insertCall!.args[0] as Record<string, unknown>);
    expect(row.pipedrive_deal_id).toBe("9876");
    expect(row.pipedrive_linked_at).toBeTruthy();
  });

  it("does not enqueue when the deal ID is unparseable", async () => {
    supabase.setTableResponse("events", { data: { id: "evt-1" }, error: null });
    const { createEvent } = await import("./events");
    await createEvent({ ...validInput, pipedriveDealId: "garbage" });
    expect(enqueueDealKickoff).not.toHaveBeenCalled();
  });
});

describe("createEvent — Supabase errors", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
  });

  it("fails when the insert errors", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "duplicate key" },
    });
    const { createEvent } = await import("./events");
    expect(await createEvent(validInput)).toMatchObject({
      success: false,
      error: expect.stringMatching(/could not create event/i),
    });
  });
});

describe("duplicateEvent", () => {
  beforeEach(() => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
  });

  it("fails when the user is a customer", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { duplicateEvent } = await import("./events");
    expect(await duplicateEvent("evt-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/internal users/),
    });
  });

  it("fails when the source event isn't found", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { duplicateEvent } = await import("./events");
    expect(await duplicateEvent("evt-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/source event/),
    });
  });
});

describe("setEventHealth", () => {
  const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

  beforeEach(() => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
  });

  /** The action selects the row back to prove RLS didn't filter the write. */
  function updateReturnsRow() {
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID },
      error: null,
    });
  }

  it("flags an event red with its reason and marks it a manual override", async () => {
    updateReturnsRow();
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({
      eventId: EVENT_ID,
      status: "red",
      reason: "Artwork still not signed off",
    });

    expect(result.success).toBe(true);
    const update = supabase.callsFor("events").find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      health_status: "red",
      health_override: true,
      health_reason: "Artwork still not signed off",
    });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "health_flagged", eventId: EVENT_ID })
    );
  });

  it("clears back to green and drops the reason", async () => {
    updateReturnsRow();
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({
      eventId: EVENT_ID,
      status: "green",
      reason: "stale text",
    });

    expect(result.success).toBe(true);
    const update = supabase.callsFor("events").find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      health_status: "green",
      health_override: false,
      health_reason: null,
    });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "health_cleared" })
    );
  });

  it("refuses to flag without a reason", async () => {
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({ eventId: EVENT_ID, status: "amber" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/say what's wrong/i);
    expect(supabase.callsFor("events")).toHaveLength(0);
  });

  it("keeps customers out", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({
      eventId: EVENT_ID,
      status: "red",
      reason: "Something is wrong",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/delivery team/i);
  });

  it("reports a failed write rather than claiming the flag stuck", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "permission denied" },
    });
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({
      eventId: EVENT_ID,
      status: "amber",
      reason: "Venue access unconfirmed",
    });

    expect(result.success).toBe(false);
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("treats an RLS-filtered write as a failure, not a silent success", async () => {
    // PostgREST reports "updated nothing" the same as a real update, which is
    // how a flag could appear to stick while the row never changed.
    supabase.setTableResponse("events", { data: null, error: null });
    const { setEventHealth } = await import("./events");
    const result = await setEventHealth({
      eventId: EVENT_ID,
      status: "red",
      reason: "Venue access unconfirmed",
    });

    expect(result.success).toBe(false);
    expect(writeAudit).not.toHaveBeenCalled();
  });
});

describe("renameEvent", () => {
  const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
  const ACCOUNT_ID = "00000000-0000-4000-8000-0000000000a1";

  function asCustomer(accountId: string | null = ACCOUNT_ID) {
    getUser.mockResolvedValue({
      id: "u1",
      name: "Casey Customer",
      email: "casey@acme.test",
      role: "customer_admin",
      accountId,
    });
  }

  it("lets a customer rename their own event", async () => {
    asCustomer();
    // Read returns the owned event; the same row satisfies the update's
    // select-back (all it needs is a non-null id).
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID, account_id: ACCOUNT_ID },
      error: null,
    });

    const { renameEvent } = await import("./events");
    const result = await renameEvent(EVENT_ID, "  Spring Launch Roadshow  ");

    expect(result).toEqual({
      success: true,
      data: { name: "Spring Launch Roadshow" },
    });
    const update = supabase.callsFor("events").find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({ name: "Spring Launch Roadshow" });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "event_renamed", eventId: EVENT_ID })
    );
  });

  it("rejects a name shorter than 3 characters", async () => {
    asCustomer();
    const { renameEvent } = await import("./events");
    const result = await renameEvent(EVENT_ID, "ab");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/at least 3/i);
    expect(supabase.callsFor("events")).toHaveLength(0);
  });

  it("rejects a name longer than 80 characters", async () => {
    asCustomer();
    const { renameEvent } = await import("./events");
    const result = await renameEvent(EVENT_ID, "x".repeat(81));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/under 80/i);
    expect(supabase.callsFor("events")).toHaveLength(0);
  });

  it("rejects a customer renaming an event they don't own", async () => {
    asCustomer("00000000-0000-4000-8000-0000000000a2");
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID, account_id: ACCOUNT_ID },
      error: null,
    });

    const { renameEvent } = await import("./events");
    const result = await renameEvent(EVENT_ID, "Someone else's event");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not authorised/i);
    const update = supabase.callsFor("events").find((c) => c.method === "update");
    expect(update).toBeUndefined();
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("fails when not signed in", async () => {
    getUser.mockResolvedValue(null);
    const { renameEvent } = await import("./events");
    const result = await renameEvent(EVENT_ID, "A perfectly fine name");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not signed in/i);
  });
});
