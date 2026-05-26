/**
 * Tests for the high-signal Pipedrive trigger helpers. The helpers
 * read from `events` (and friends) to find the deal id, write to
 * `pipedrive_outbox`, and kick off an inline drain. We mock both the
 * service-role Supabase client and the inline drain so we can assert
 * on the rows we would have written.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const drainOutbox = vi.fn(async () => ({ attempted: 0, succeeded: 0, failed: 0, skipped: 0 }));
const loadPipedriveConfig = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

vi.mock("./drain", () => ({
  drainOutbox: (...args: unknown[]) =>
    (drainOutbox as unknown as (...inner: unknown[]) => unknown)(...args),
}));

vi.mock("./client", () => ({
  loadPipedriveConfig: () => loadPipedriveConfig(),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  drainOutbox.mockClear();
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

describe("enqueueDealKickoff", () => {
  it("does nothing when the event has no Pipedrive deal", async () => {
    supabase.setTableResponse("events", {
      data: { pipedrive_deal_id: null },
      error: null,
    });
    const { enqueueDealKickoff } = await import("./triggers");
    await enqueueDealKickoff("evt-1");
    expect(supabase.callsFor("pipedrive_outbox")).toHaveLength(0);
  });

  it("enqueues a note + custom-field row when a deal is linked", async () => {
    // First call selects pipedrive_deal_id, second selects the event lite.
    // Both go through the same `events` table builder, so we return the
    // union of fields.
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        pipedrive_deal_id: "42",
        name: "Spring",
        accounts: { name: "Acme" },
      },
      error: null,
    });
    supabase.setTableResponse("pipedrive_outbox", {
      data: [{ id: "row-1" }],
      error: null,
    });
    const { enqueueDealKickoff } = await import("./triggers");
    await enqueueDealKickoff("evt-1");
    const outboxCalls = supabase.callsFor("pipedrive_outbox");
    const insertCall = outboxCalls.find((c) => c.method === "insert");
    expect(insertCall).toBeDefined();
    const rows = insertCall!.args[0] as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0].kind).toBe("note");
    expect(rows[0].deal_id).toBe("42");
    // Inline drain should have fired
    expect(drainOutbox).toHaveBeenCalled();
  });

  it("swallows errors without throwing", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "boom" },
    });
    const { enqueueDealKickoff } = await import("./triggers");
    await expect(enqueueDealKickoff("evt-1")).resolves.toBeUndefined();
  });
});

describe("enqueueStageAdvance", () => {
  it("does nothing for stages that are not customer-visible", async () => {
    const { enqueueStageAdvance } = await import("./triggers");
    // `confirmed` is intentionally not in the customer-visible stage
    // set; the helper should early-return without touching Supabase.
    await enqueueStageAdvance("evt-1", "confirmed");
    expect(supabase.callsFor("events")).toHaveLength(0);
  });

  it("enqueues for customer-visible stages when deal is linked", async () => {
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        pipedrive_deal_id: "42",
        name: "Spring",
        accounts: { name: "Acme" },
      },
      error: null,
    });
    supabase.setTableResponse("pipedrive_outbox", {
      data: [{ id: "row-1" }],
      error: null,
    });
    const { enqueueStageAdvance } = await import("./triggers");
    await enqueueStageAdvance("evt-1", "creative_assets");
    const insertCall = supabase
      .callsFor("pipedrive_outbox")
      .find((c) => c.method === "insert");
    expect(insertCall).toBeDefined();
  });
});

describe("enqueueApprovalDecision", () => {
  it("enqueues a note when deal is linked", async () => {
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        pipedrive_deal_id: "42",
        name: "Spring",
        accounts: { name: "Acme" },
      },
      error: null,
    });
    supabase.setTableResponse("pipedrive_outbox", {
      data: [{ id: "row-1" }],
      error: null,
    });
    const { enqueueApprovalDecision } = await import("./triggers");
    await enqueueApprovalDecision("evt-1", "Logo v3", "approved");
    const insertCall = supabase
      .callsFor("pipedrive_outbox")
      .find((c) => c.method === "insert");
    expect(insertCall).toBeDefined();
  });

  it("sets health to amber on revision_requested", async () => {
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        pipedrive_deal_id: "42",
        name: "Spring",
        accounts: { name: "Acme" },
      },
      error: null,
    });
    supabase.setTableResponse("pipedrive_outbox", {
      data: [{ id: "row-1" }, { id: "row-2" }],
      error: null,
    });
    const { enqueueApprovalDecision } = await import("./triggers");
    await enqueueApprovalDecision("evt-1", "Logo v3", "revision_requested", "tweak it");
    const insertCall = supabase
      .callsFor("pipedrive_outbox")
      .find((c) => c.method === "insert");
    const rows = insertCall!.args[0] as Array<Record<string, unknown>>;
    const customFieldRow = rows.find((r) => r.kind === "custom_field_update");
    expect(customFieldRow).toBeDefined();
    const fields = (customFieldRow!.payload as { fields: Record<string, unknown> }).fields;
    // health field id 2 = amber
    expect(fields.def456).toBe(2);
  });
});

describe("enqueueEventDelivered", () => {
  it("includes a __increment__ sentinel for delivered events", async () => {
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        pipedrive_deal_id: "42",
        name: "Spring",
        accounts: { name: "Acme" },
      },
      error: null,
    });
    supabase.setTableResponse("pipedrive_outbox", {
      data: [{ id: "row-1" }, { id: "row-2" }],
      error: null,
    });
    const { enqueueEventDelivered } = await import("./triggers");
    await enqueueEventDelivered("evt-1", 87);
    const insertCall = supabase
      .callsFor("pipedrive_outbox")
      .find((c) => c.method === "insert");
    const rows = insertCall!.args[0] as Array<Record<string, unknown>>;
    const cfRow = rows.find((r) => r.kind === "custom_field_update");
    const fields = (cfRow!.payload as { fields: Record<string, unknown> }).fields;
    expect(fields.ghi789).toBe("__increment__");
  });
});
