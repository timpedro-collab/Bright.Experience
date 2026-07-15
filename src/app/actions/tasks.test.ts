/**
 * Tests for task lifecycle server actions — customer reminders and
 * orchestrator reassignment.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => {
    dispatchNotification(...args);
    return Promise.resolve();
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./streak", () => ({ bumpStreak: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
});

describe("remindCustomerTask", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { remindCustomerTask } = await import("./tasks");
    expect(await remindCustomerTask("task-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/authenticated/i),
    });
  });

  it("rejects a non-internal caller", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_admin" },
      error: null,
    });
    const { remindCustomerTask } = await import("./tasks");
    expect(await remindCustomerTask("task-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/Bright\.Blue team/i),
    });
  });

  it("dispatches a customer reminder on the happy path", async () => {
    supabase.setUser({ id: "u-internal" });
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: {
        id: "task-1",
        event_id: "evt-1",
        title: "Submit creative brief",
        task_type: "customer_action",
        target_path: "briefing",
        status: "pending",
      },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { name: "Summer Festival" },
      error: null,
    });
    supabase.setTableResponse("audit_entries", { data: null, error: null });

    const { remindCustomerTask } = await import("./tasks");
    const result = await remindCustomerTask("task-1");
    expect(result).toEqual({ success: true, data: undefined });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "briefing.needed",
      expect.objectContaining({
        eventId: "evt-1",
        eventName: "Summer Festival",
        taskTitle: "Submit creative brief",
        actorId: "u-internal",
        entityType: "task",
        entityId: "task-1",
      }),
    );
  });
});

describe("reopenTask", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { reopenTask } = await import("./tasks");
    expect(await reopenTask("task-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/authenticated/i),
    });
  });

  it("refuses to reopen a task that is still open", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("tasks", {
      data: { task_type: "customer_action", status: "in_progress" },
      error: null,
    });
    const { reopenTask } = await import("./tasks");
    expect(await reopenTask("task-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/already open/i),
    });
  });

  it("blocks a customer from reopening an internal task", async () => {
    supabase.setUser({ id: "u-cust" });
    supabase.setTableResponse("tasks", {
      data: { task_type: "internal_action", status: "complete" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_admin" },
      error: null,
    });
    const { reopenTask } = await import("./tasks");
    expect(await reopenTask("task-1")).toMatchObject({
      success: false,
      error: expect.stringMatching(/Bright\.Blue team/i),
    });
  });

  it("restores a completed task to an open status and audits the reversal", async () => {
    supabase.setUser({ id: "u-internal" });
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: {
        id: "task-1",
        event_id: "evt-1",
        title: "Configure game logic",
        task_type: "internal_action",
        status: "complete",
      },
      error: null,
    });
    supabase.setTableResponse("audit_entries", { data: null, error: null });

    const { reopenTask } = await import("./tasks");
    const result = await reopenTask("task-1", "pending");
    expect(result).toEqual({ success: true, data: undefined });

    const updateCall = supabase
      .callsFor("tasks")
      .find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    const payload = updateCall!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("pending");
    expect(payload.completed_at).toBeNull();
    expect(payload.completed_by).toBeNull();

    const auditCall = supabase
      .callsFor("audit_entries")
      .find((c) => c.method === "insert");
    expect(auditCall).toBeDefined();
    expect((auditCall!.args[0] as Record<string, unknown>).action).toBe(
      "task_reopened",
    );
  });
});

describe("reassignTask", () => {
  // Reassignment input is schema-validated, so ids must be UUID-shaped.
  const TASK_ID = "d6666666-6666-6666-6666-666666666666";

  it("rejects a non-orchestrator caller", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "creative_lead" },
      error: null,
    });
    const { reassignTask } = await import("./tasks");
    expect(
      await reassignTask({ taskId: TASK_ID, category: "operations" }),
    ).toMatchObject({
      success: false,
      error: expect.stringMatching(/orchestrator/i),
    });
  });

  it("rejects a malformed task id via validation", async () => {
    supabase.setUser({ id: "u1" });
    const { reassignTask } = await import("./tasks");
    expect(
      await reassignTask({ taskId: "t-1", category: "operations" }),
    ).toMatchObject({
      success: false,
      error: expect.stringMatching(/Invalid task ID/i),
    });
  });

  it("refuses to reassign a customer task", async () => {
    supabase.setUser({ id: "u-lead" });
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: {
        id: TASK_ID,
        event_id: "evt-1",
        title: "Upload your logo",
        task_type: "customer_action",
        category: "creative",
        assigned_to: null,
        status: "pending",
      },
      error: null,
    });
    const { reassignTask } = await import("./tasks");
    expect(
      await reassignTask({ taskId: TASK_ID, category: "operations" }),
    ).toMatchObject({
      success: false,
      error: expect.stringMatching(/belong to the customer/i),
    });
  });

  it("moves an internal task to a new team lane and audits it", async () => {
    supabase.setUser({ id: "u-lead" });
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: {
        id: TASK_ID,
        event_id: "evt-1",
        title: "Design wrap concept",
        task_type: "internal_action",
        category: "creative",
        assigned_to: "u-creative",
        status: "pending",
      },
      error: null,
    });
    supabase.setTableResponse("audit_entries", { data: null, error: null });

    const { reassignTask } = await import("./tasks");
    const result = await reassignTask({ taskId: TASK_ID, category: "operations" });
    expect(result).toEqual({ success: true, data: undefined });

    const updateCall = supabase
      .callsFor("tasks")
      .find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    const payload = updateCall!.args[0] as Record<string, unknown>;
    expect(payload.category).toBe("operations");
    expect(payload.assigned_role).toBe("operations_lead");
    expect(payload.assigned_to).toBeNull();

    const auditCall = supabase
      .callsFor("audit_entries")
      .find((c) => c.method === "insert");
    expect(auditCall).toBeDefined();
    const audit = auditCall!.args[0] as Record<string, unknown>;
    expect(audit.action).toBe("task_reassigned");
  });
});
