/**
 * Tests for the approval decision action. Covers happy paths for both
 * approve and revision_requested branches, RBAC, and Pipedrive write-back.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const enqueueApprovalDecision = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/lib/pipedrive/triggers", () => ({
  enqueueApprovalDecision: (...args: unknown[]) => enqueueApprovalDecision(...args),
}));

// The action validates ids with the approval-decision schema, so tests use
// realistic UUID-shaped ids.
const APPROVAL_ID = "ab111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  enqueueApprovalDecision.mockReset();
});

describe("decideApproval — auth", () => {
  it("returns error when not authenticated", async () => {
    supabase.setUser(null);
    const { decideApproval } = await import("./approvals");
    const result = await decideApproval(APPROVAL_ID, EVENT_ID, "approved");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });
});

describe("decideApproval — happy path (approved)", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("approvals", {
      data: { title: "Logo v3" },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { name: "Spring" },
      error: null,
    });
  });

  it("dispatches approval.approved and enqueues Pipedrive note", async () => {
    const { decideApproval } = await import("./approvals");
    await decideApproval(APPROVAL_ID, EVENT_ID, "approved");

    expect(dispatchNotification).toHaveBeenCalledWith(
      "approval.approved",
      expect.objectContaining({ eventId: EVENT_ID, approvalId: APPROVAL_ID })
    );
    expect(enqueueApprovalDecision).toHaveBeenCalledWith(
      EVENT_ID,
      "Logo v3",
      "approved",
      undefined
    );
  });
});

describe("decideApproval — revision requested", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("approvals", {
      data: { title: "Logo v3", revision_count: 1 },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { name: "Spring" },
      error: null,
    });
  });

  it("dispatches approval.revision_requested with feedback", async () => {
    const { decideApproval } = await import("./approvals");
    await decideApproval(APPROVAL_ID, EVENT_ID, "rejected", "Make the wordmark bigger");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "approval.revision_requested",
      expect.objectContaining({
        feedback: "Make the wordmark bigger",
      })
    );
    expect(enqueueApprovalDecision).toHaveBeenCalledWith(
      EVENT_ID,
      "Logo v3",
      "revision_requested",
      "Make the wordmark bigger"
    );
  });

  it("increments revision_count from current value", async () => {
    const { decideApproval } = await import("./approvals");
    await decideApproval(APPROVAL_ID, EVENT_ID, "rejected", "feedback");
    const updateCall = supabase
      .callsFor("approvals")
      .find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    const payload = updateCall!.args[0] as Record<string, unknown>;
    expect(payload.revision_count).toBe(2);
  });
});

describe("requestApproval", () => {
  const VALID = {
    eventId: EVENT_ID,
    title: "Machine wrap — final artwork",
    approvalType: "wrap" as const,
  };

  beforeEach(() => {
    supabase.setUser({ id: "u1" });
  });

  /** Profile lookup, then event lookup, then the insert. */
  function arrangeInternal(role = "creative_lead") {
    supabase.setTableResponse("profiles", { data: { role }, error: null });
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID, name: "Spring" },
      error: null,
    });
    supabase.setTableResponse("approvals", {
      data: { id: APPROVAL_ID },
      error: null,
    });
  }

  it("inserts a pending approval and notifies the customer", async () => {
    arrangeInternal();
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval({
      ...VALID,
      description: "Galaxy Blue corrected",
      previewUrl: `${EVENT_ID}/asset/a1/1-wrap.png`,
    });

    expect(result).toEqual({ success: true, data: { approvalId: APPROVAL_ID } });
    const insert = supabase
      .callsFor("approvals")
      .find((c) => c.method === "insert");
    expect(insert!.args[0]).toMatchObject({
      event_id: EVENT_ID,
      title: "Machine wrap — final artwork",
      approval_type: "wrap",
      status: "pending",
      requested_by: "u1",
      customer_visible: true,
      preview_url: `${EVENT_ID}/asset/a1/1-wrap.png`,
    });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "approval.requested",
      expect.objectContaining({ eventId: EVENT_ID, approvalId: APPROVAL_ID })
    );
  });

  it("stores no preview when none was given", async () => {
    arrangeInternal();
    const { requestApproval } = await import("./approvals");

    await requestApproval(VALID);

    const insert = supabase
      .callsFor("approvals")
      .find((c) => c.method === "insert");
    expect((insert!.args[0] as Record<string, unknown>).preview_url).toBeNull();
  });

  it("rejects a caller who is not signed in", async () => {
    supabase.setUser(null);
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval(VALID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("rejects a customer trying to open their own approval", async () => {
    arrangeInternal("customer_admin");
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval(VALID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/can't request/);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("rejects internal roles that don't own the customer relationship", async () => {
    arrangeInternal("operations_lead");
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval(VALID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/can't request/);
  });

  it("rejects a title that tells the customer nothing", async () => {
    arrangeInternal();
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval({ ...VALID, title: "x" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/title/i);
  });

  it("rejects a javascript: preview link", async () => {
    arrangeInternal();
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval({
      ...VALID,
      previewUrl: "javascript:alert(1)",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/preview link/);
  });

  it("returns a friendly error when the event does not exist", async () => {
    supabase.setTableResponse("profiles", {
      data: { role: "admin" },
      error: null,
    });
    supabase.setTableResponse("events", { data: null, error: null });
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval(VALID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Event not found/);
  });

  it("returns a friendly error when the insert is refused", async () => {
    supabase.setTableResponse("profiles", {
      data: { role: "admin" },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { id: EVENT_ID, name: "Spring" },
      error: null,
    });
    supabase.setTableResponse("approvals", {
      data: null,
      error: { message: "RLS denied" },
    });
    const { requestApproval } = await import("./approvals");

    const result = await requestApproval(VALID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Could not post the proof/);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});

describe("decideApproval — DB errors", () => {
  it("returns error when update fails", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("approvals", {
      data: null,
      error: { message: "RLS denied" },
    });
    const { decideApproval } = await import("./approvals");
    const result = await decideApproval(APPROVAL_ID, EVENT_ID, "approved");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Decision failed/);
  });
});
