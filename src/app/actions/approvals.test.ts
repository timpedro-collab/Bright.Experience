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

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  enqueueApprovalDecision.mockReset();
});

describe("decideApproval — auth", () => {
  it("returns error when not authenticated", async () => {
    supabase.setUser(null);
    const { decideApproval } = await import("./approvals");
    const result = await decideApproval("a1", "evt-1", "approved");
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
    await decideApproval("a1", "evt-1", "approved");

    expect(dispatchNotification).toHaveBeenCalledWith(
      "approval.approved",
      expect.objectContaining({ eventId: "evt-1", approvalId: "a1" })
    );
    expect(enqueueApprovalDecision).toHaveBeenCalledWith(
      "evt-1",
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
    await decideApproval("a1", "evt-1", "rejected", "Make the wordmark bigger");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "approval.revision_requested",
      expect.objectContaining({
        feedback: "Make the wordmark bigger",
      })
    );
    expect(enqueueApprovalDecision).toHaveBeenCalledWith(
      "evt-1",
      "Logo v3",
      "revision_requested",
      "Make the wordmark bigger"
    );
  });

  it("increments revision_count from current value", async () => {
    const { decideApproval } = await import("./approvals");
    await decideApproval("a1", "evt-1", "rejected", "feedback");
    const updateCall = supabase
      .callsFor("approvals")
      .find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    const payload = updateCall!.args[0] as Record<string, unknown>;
    expect(payload.revision_count).toBe(2);
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
    const result = await decideApproval("a1", "evt-1", "approved");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Decision failed/);
  });
});
