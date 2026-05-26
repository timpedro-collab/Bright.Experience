/**
 * Tests for the notification query helpers.
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

describe("getNotificationsByUser", () => {
  it("maps DB rows to camelCase Notification objects", async () => {
    supabase.setTableResponse("notifications", {
      data: [
        {
          id: 1,
          user_id: "u1",
          event_id: "evt-1",
          type: "asset.review_needed",
          title: "X",
          body: "Y",
          is_read: false,
          link: "/foo",
          created_at: "2026-05-01",
          kind: "asset.review_needed",
          priority: "high",
          action_required: true,
          entity_type: "asset",
          entity_id: "a1",
        },
      ],
      error: null,
    });
    const { getNotificationsByUser } = await import("./notifications");
    const out = await getNotificationsByUser("u1");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "1",
      userId: "u1",
      eventId: "evt-1",
      isRead: false,
      kind: "asset.review_needed",
      priority: "high",
      actionRequired: true,
    });
  });

  it("returns an empty array on error", async () => {
    supabase.setTableResponse("notifications", { data: null, error: { message: "boom" } });
    const { getNotificationsByUser } = await import("./notifications");
    const out = await getNotificationsByUser("u1");
    expect(out).toEqual([]);
  });

  it("defaults priority to 'normal' when missing", async () => {
    supabase.setTableResponse("notifications", {
      data: [
        {
          id: 1,
          user_id: "u1",
          type: "x",
          title: "X",
          is_read: false,
          created_at: "2026-05-01",
        },
      ],
      error: null,
    });
    const { getNotificationsByUser } = await import("./notifications");
    const out = await getNotificationsByUser("u1");
    expect(out[0].priority).toBe("normal");
  });
});

describe("getUnreadCount", () => {
  it("returns the count from the query", async () => {
    supabase.setTableResponse("notifications", { count: 5, error: null });
    const { getUnreadCount } = await import("./notifications");
    const count = await getUnreadCount("u1");
    expect(count).toBe(5);
  });

  it("returns 0 on error", async () => {
    supabase.setTableResponse("notifications", { count: null, error: { message: "boom" } });
    const { getUnreadCount } = await import("./notifications");
    const count = await getUnreadCount("u1");
    expect(count).toBe(0);
  });

  it("returns 0 when count is null", async () => {
    supabase.setTableResponse("notifications", { count: null, error: null });
    const { getUnreadCount } = await import("./notifications");
    const count = await getUnreadCount("u1");
    expect(count).toBe(0);
  });
});

describe("markNotificationRead", () => {
  it("throws on Supabase error", async () => {
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "denied" },
    });
    const { markNotificationRead } = await import("./notifications");
    await expect(markNotificationRead("n1")).rejects.toThrow(/denied/);
  });

  it("resolves on success", async () => {
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markNotificationRead } = await import("./notifications");
    await expect(markNotificationRead("n1")).resolves.toBeUndefined();
  });
});

describe("markAllNotificationsRead", () => {
  it("calls update + eq(user_id) + eq(is_read, false)", async () => {
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markAllNotificationsRead } = await import("./notifications");
    await markAllNotificationsRead("u1");
    const calls = supabase.callsFor("notifications");
    expect(calls.some((c) => c.method === "update")).toBe(true);
    expect(
      calls.some((c) => c.method === "eq" && c.args[0] === "user_id")
    ).toBe(true);
    expect(
      calls.some((c) => c.method === "eq" && c.args[0] === "is_read")
    ).toBe(true);
  });
});
