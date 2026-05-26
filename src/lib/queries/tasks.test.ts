/**
 * Integration tests for the task query helpers.
 *
 * These touch Supabase via chained calls — we mock the client at the
 * boundary so we can drive both the data shape *and* assert on the
 * exact query the helper issued (table, filter values, etc).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getOpenTaskCountsForUser", () => {
  it("returns an empty object when no event IDs are provided", async () => {
    const { getOpenTaskCountsForUser } = await import("./tasks");
    const result = await getOpenTaskCountsForUser("u1", true, []);
    expect(result).toEqual({});
  });

  it("counts assigned tasks per event for internal viewers", async () => {
    supabase.setTableResponse("tasks", {
      data: [
        { event_id: "evt-1", status: "pending", assigned_to: "u1" },
        { event_id: "evt-1", status: "in_progress", assigned_to: "u1" },
        { event_id: "evt-2", status: "pending", assigned_to: "u1" },
      ],
      error: null,
    });
    const { getOpenTaskCountsForUser } = await import("./tasks");
    const result = await getOpenTaskCountsForUser("u1", true, ["evt-1", "evt-2"]);
    expect(result).toEqual({ "evt-1": 2, "evt-2": 1 });
  });

  it("uses customer_visible filter for non-internal viewers", async () => {
    supabase.setTableResponse("tasks", {
      data: [{ event_id: "evt-1", status: "pending", customer_visible: true }],
      error: null,
    });
    const { getOpenTaskCountsForUser } = await import("./tasks");
    await getOpenTaskCountsForUser("u-cust", false, ["evt-1"]);
    const calls = supabase.callsFor("tasks");
    // Confirm `eq("customer_visible", true)` was applied and NOT
    // `eq("assigned_to", ...)`
    const customerVisibleCall = calls.find(
      (c) => c.method === "eq" && c.args[0] === "customer_visible"
    );
    expect(customerVisibleCall).toBeDefined();
    const assignedCall = calls.find(
      (c) => c.method === "eq" && c.args[0] === "assigned_to"
    );
    expect(assignedCall).toBeUndefined();
  });

  it("returns an empty object on a Supabase error", async () => {
    supabase.setTableResponse("tasks", { data: null, error: { message: "boom" } });
    const { getOpenTaskCountsForUser } = await import("./tasks");
    const result = await getOpenTaskCountsForUser("u1", true, ["evt-1"]);
    expect(result).toEqual({});
  });
});

describe("getTasksAssignedToUser", () => {
  it("returns the mapped rows in camelCase shape", async () => {
    supabase.setTableResponse("tasks", {
      data: [
        {
          id: "t1",
          event_id: "evt-1",
          milestone_id: null,
          title: "Upload hero",
          description: null,
          task_type: "customer_action",
          category: "creative",
          status: "pending",
          priority: "high",
          assigned: null,
          due_date: "2026-06-01",
          completed_at: null,
          is_blocking: true,
          customer_visible: true,
          sort_order: 0,
          events: { id: "evt-1", name: "Spring", accounts: { name: "Acme" } },
        },
      ],
      error: null,
    });
    const { getTasksAssignedToUser } = await import("./tasks");
    const result = await getTasksAssignedToUser("u1");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Upload hero");
    expect(result[0].eventName).toBe("Spring");
    expect(result[0].accountName).toBe("Acme");
    expect(result[0].dueDate).toBe("2026-06-01");
  });

  it("returns [] on error", async () => {
    supabase.setTableResponse("tasks", { data: null, error: { message: "boom" } });
    const { getTasksAssignedToUser } = await import("./tasks");
    const result = await getTasksAssignedToUser("u1");
    expect(result).toEqual([]);
  });

  it("uses the OR filter when includeCompletedSince is provided", async () => {
    supabase.setTableResponse("tasks", { data: [], error: null });
    const { getTasksAssignedToUser } = await import("./tasks");
    await getTasksAssignedToUser("u1", { includeCompletedSince: "2026-05-01" });
    const calls = supabase.callsFor("tasks");
    const orCall = calls.find((c) => c.method === "or");
    expect(orCall).toBeDefined();
    expect((orCall!.args[0] as string)).toContain("completed_at.gte.2026-05-01");
  });
});

describe("getTasksByEvent", () => {
  it("returns the mapped rows for an event", async () => {
    supabase.setTableResponse("tasks", {
      data: [
        {
          id: "t1",
          event_id: "evt-1",
          milestone_id: null,
          title: "Do thing",
          description: null,
          task_type: "internal_action",
          category: "creative",
          status: "in_progress",
          priority: "medium",
          assigned: null,
          due_date: null,
          completed_at: null,
          is_blocking: false,
          customer_visible: false,
          sort_order: 1,
        },
      ],
      error: null,
    });
    const { getTasksByEvent } = await import("./tasks");
    const result = await getTasksByEvent("evt-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
    expect(result[0].status).toBe("in_progress");
  });
});
