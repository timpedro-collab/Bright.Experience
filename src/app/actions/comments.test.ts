/**
 * Tests for threaded asset comment actions — auth, validation, the happy
 * path (insert + audit + notification), and the delete RBAC gate.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const writeAudit = vi.fn();
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAudit(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => {
    dispatchNotification(...args);
    return Promise.resolve();
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  writeAudit.mockReset();
  dispatchNotification.mockReset();
});

describe("addComment", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { addComment } = await import("./comments");
    const result = await addComment("e1", "a1", "hello");
    expect(result.success).toBe(false);
  });

  it("rejects an empty body", async () => {
    supabase.setUser({ id: "u1" });
    const { addComment } = await import("./comments");
    const result = await addComment("e1", "a1", "   ");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/required/);
  });

  it("inserts, audits, and notifies on the happy path", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("comments", { data: { id: "c1" }, error: null });
    supabase.setTableResponse("profiles", { data: { name: "Alex" }, error: null });
    supabase.setTableResponse("assets", { data: { name: "Logo" }, error: null });

    const { addComment } = await import("./comments");
    const result = await addComment("e1", "a1", "Looks great");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("c1");
    expect(writeAudit).toHaveBeenCalled();
    expect(dispatchNotification).toHaveBeenCalledWith(
      "comment.new",
      expect.objectContaining({ eventId: "e1", assetId: "a1" }),
    );
  });

  it("returns an error when the insert fails", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("comments", {
      data: null,
      error: { message: "RLS denied" },
    });
    const { addComment } = await import("./comments");
    const result = await addComment("e1", "a1", "hi");
    expect(result.success).toBe(false);
  });
});

describe("deleteComment", () => {
  it("blocks a non-owner customer", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("comments", {
      data: { author_id: "someone-else", event_id: "e1" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_user" },
      error: null,
    });
    const { deleteComment } = await import("./comments");
    const result = await deleteComment("c1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authorised/);
  });

  it("allows the author to delete their own comment", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("comments", {
      data: { author_id: "u1", event_id: "e1" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_user" },
      error: null,
    });
    const { deleteComment } = await import("./comments");
    const result = await deleteComment("c1");
    expect(result.success).toBe(true);
  });
});
