/**
 * Tests for the Pipedrive outbox drain. Mocks the Pipedrive client +
 * service-role Supabase, then verifies the success/failure markers
 * land on the right rows.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const addNoteToDeal = vi.fn();
const updateDealCustomFields = vi.fn();
const getDeal = vi.fn();
const loadPipedriveConfig = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

vi.mock("./client", () => ({
  addNoteToDeal: (...args: unknown[]) => addNoteToDeal(...args),
  updateDealCustomFields: (...args: unknown[]) => updateDealCustomFields(...args),
  getDeal: (...args: unknown[]) => getDeal(...args),
  loadPipedriveConfig: () => loadPipedriveConfig(),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  addNoteToDeal.mockReset();
  updateDealCustomFields.mockReset();
  getDeal.mockReset();
  loadPipedriveConfig.mockReset().mockResolvedValue({
    apiToken: "test-token",
    baseUrl: "https://api.pipedrive.com",
    fieldKeyLastActivityAt: "abc123",
    fieldKeyHealthStatus: "def456",
    fieldKeyDeliveredEvents: "ghi789",
    healthOptionGreenId: 1,
    healthOptionAmberId: 2,
    healthOptionRedId: 3,
    defaultPipelineId: 1,
  });
});

describe("drainOutbox — no-op paths", () => {
  it("returns zeros when Pipedrive isn't configured", async () => {
    loadPipedriveConfig.mockResolvedValue(null);
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result).toEqual({ attempted: 0, succeeded: 0, failed: 0, skipped: 0 });
  });

  it("returns zeros when the outbox is empty", async () => {
    supabase.setTableResponse("pipedrive_outbox", { data: [], error: null });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.attempted).toBe(0);
  });
});

describe("drainOutbox — note rows", () => {
  it("processes a note row and marks it sent", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "note",
          payload: { content: "<p>Hello</p>" },
          attempts: 0,
        },
      ],
      error: null,
    });
    addNoteToDeal.mockResolvedValue({ ok: true, data: { id: 1 } });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result).toEqual({
      attempted: 1,
      succeeded: 1,
      failed: 0,
      skipped: 0,
    });
    expect(addNoteToDeal).toHaveBeenCalledWith(
      expect.objectContaining({ apiToken: "test-token" }),
      "42",
      "<p>Hello</p>"
    );
  });

  it("marks a note row failed when Pipedrive errors", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "note",
          payload: { content: "x" },
          attempts: 0,
        },
      ],
      error: null,
    });
    addNoteToDeal.mockResolvedValue({ ok: false, reason: "rate_limited" });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
  });

  it("skips a row with missing content", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "note",
          payload: {},
          attempts: 0,
        },
      ],
      error: null,
    });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
    expect(addNoteToDeal).not.toHaveBeenCalled();
  });

  it("skips a row missing deal_id (defensive)", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: null,
          kind: "note",
          payload: { content: "x" },
          attempts: 0,
        },
      ],
      error: null,
    });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.skipped).toBe(1);
  });
});

describe("drainOutbox — custom_field_update rows", () => {
  it("processes a custom-field update and marks it sent", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "custom_field_update",
          payload: { fields: { abc123: 1 } },
          attempts: 0,
        },
      ],
      error: null,
    });
    updateDealCustomFields.mockResolvedValue({ ok: true, data: { id: 1 } });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.succeeded).toBe(1);
    expect(updateDealCustomFields).toHaveBeenCalledWith(
      expect.anything(),
      "42",
      { abc123: 1 }
    );
  });

  it("resolves __increment__ via getDeal + 1", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "custom_field_update",
          payload: { fields: { ghi789: "__increment__" } },
          attempts: 0,
        },
      ],
      error: null,
    });
    getDeal.mockResolvedValue({ ok: true, data: { ghi789: 3 } });
    updateDealCustomFields.mockResolvedValue({ ok: true, data: { id: 1 } });
    const { drainOutbox } = await import("./drain");
    await drainOutbox();
    expect(updateDealCustomFields).toHaveBeenCalledWith(
      expect.anything(),
      "42",
      { ghi789: 4 }
    );
  });

  it("falls back to 1 when the current value isn't numeric", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "custom_field_update",
          payload: { fields: { ghi789: "__increment__" } },
          attempts: 0,
        },
      ],
      error: null,
    });
    getDeal.mockResolvedValue({ ok: true, data: { ghi789: null } });
    updateDealCustomFields.mockResolvedValue({ ok: true, data: { id: 1 } });
    const { drainOutbox } = await import("./drain");
    await drainOutbox();
    expect(updateDealCustomFields).toHaveBeenCalledWith(
      expect.anything(),
      "42",
      { ghi789: 1 }
    );
  });

  it("fails the row when getDeal errors during increment resolution", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "custom_field_update",
          payload: { fields: { ghi789: "__increment__" } },
          attempts: 0,
        },
      ],
      error: null,
    });
    getDeal.mockResolvedValue({ ok: false, reason: "rate_limited" });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
    expect(updateDealCustomFields).not.toHaveBeenCalled();
  });

  it("skips a row with empty fields", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "custom_field_update",
          payload: { fields: {} },
          attempts: 0,
        },
      ],
      error: null,
    });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
    expect(updateDealCustomFields).not.toHaveBeenCalled();
  });
});

describe("drainOutbox — unhandled kind", () => {
  it("marks an unknown row kind as failed", async () => {
    supabase.setTableResponse("pipedrive_outbox", {
      data: [
        {
          id: "r1",
          event_id: "evt-1",
          deal_id: "42",
          kind: "unknown_kind",
          payload: {},
          attempts: 0,
        },
      ],
      error: null,
    });
    const { drainOutbox } = await import("./drain");
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
  });
});
