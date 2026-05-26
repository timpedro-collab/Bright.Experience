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
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/lib/pipedrive/triggers", () => ({
  enqueueDealKickoff: (...args: unknown[]) => enqueueDealKickoff(...args),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset();
  enqueueDealKickoff.mockReset();
});

const validInput = {
  accountId: "00000000-0000-4000-8000-000000000001",
  name: "Spring Activation",
  eventType: "activation" as const,
  packageType: "standard" as const,
  eventDateStart: "2026-06-15",
};

describe("createEvent — RBAC", () => {
  it("throws when not authenticated", async () => {
    getUser.mockResolvedValue(null);
    const { createEvent } = await import("./events");
    await expect(createEvent(validInput)).rejects.toThrow(
      /Only internal users/
    );
  });

  it("throws when user is a customer", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { createEvent } = await import("./events");
    await expect(createEvent(validInput)).rejects.toThrow(
      /Only internal users/
    );
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
    expect(result).toEqual({ id: "evt-1" });
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
    await expect(
      createEvent({ ...validInput, accountId: "garbage" })
    ).rejects.toThrow(/customer account/);
  });

  it("rejects a too-short name", async () => {
    const { createEvent } = await import("./events");
    await expect(
      createEvent({ ...validInput, name: "x" })
    ).rejects.toThrow(/event a name/);
  });

  it("rejects a missing eventDateStart", async () => {
    const { createEvent } = await import("./events");
    await expect(
      createEvent({ ...validInput, eventDateStart: "" })
    ).rejects.toThrow(/start date/i);
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

  it("throws when the insert errors", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "duplicate key" },
    });
    const { createEvent } = await import("./events");
    await expect(createEvent(validInput)).rejects.toThrow(/duplicate key/);
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

  it("throws when the user is a customer", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { duplicateEvent } = await import("./events");
    await expect(duplicateEvent("evt-1")).rejects.toThrow(/internal users/);
  });

  it("throws when the source event isn't found", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { duplicateEvent } = await import("./events");
    await expect(duplicateEvent("evt-1")).rejects.toThrow(/source event/);
  });
});
