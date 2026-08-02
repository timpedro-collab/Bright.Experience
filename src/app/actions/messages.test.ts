/**
 * Tests for event messaging — schema validation, auth, the happy path
 * (insert + audit + notification), and the DB error path.
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
vi.mock("@/lib/storage/signed-url", () => ({
  validateUpload: vi.fn(() => ({ ok: true })),
  storagePathFor: vi.fn(() => "path"),
  createSignedReadUrl: vi.fn(async () => "https://signed"),
}));
vi.mock("@/lib/storage/scan", () => ({
  screenUpload: vi.fn(async () => ({ ok: true })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
});

describe("sendMessage", () => {
  it("rejects an empty body via the schema", async () => {
    supabase.setUser({ id: "u1" });
    const { sendMessage } = await import("./messages");
    const result = await sendMessage("e1", "", false);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/empty/);
  });

  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { sendMessage } = await import("./messages");
    const result = await sendMessage("e1", "Hello team", false);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("inserts and dispatches a notification on the happy path", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("messages", { data: { id: "m1" }, error: null });
    supabase.setTableResponse("profiles", { data: { name: "Sam" }, error: null });

    const { sendMessage } = await import("./messages");
    const result = await sendMessage("e1", "Hello team", false);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("m1");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "message.received",
      expect.objectContaining({ eventId: "e1", messageId: "m1" }),
    );
  });

  it("returns an error when the insert fails", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("messages", {
      data: null,
      error: { message: "RLS denied" },
    });
    const { sendMessage } = await import("./messages");
    const result = await sendMessage("e1", "Hello team", false);
    expect(result.success).toBe(false);
  });
});
