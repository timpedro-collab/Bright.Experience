/**
 * Tests for studio request creation — auth, the studio.order permission gate,
 * required-field validation, and the happy path.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const sendStudioOrderNotification = vi.fn();
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/email", () => ({
  sendStudioOrderNotification: (...args: unknown[]) =>
    sendStudioOrderNotification(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => {
    dispatchNotification(...args);
    return Promise.resolve();
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  supabase = createMockSupabase();
  sendStudioOrderNotification.mockReset();
  dispatchNotification.mockReset();
});

describe("createStudioRequest", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { createStudioRequest } = await import("./studio");
    const result = await createStudioRequest(
      form({ eventId: "e1", serviceType: "design", title: "Banner" }),
    );
    expect(result.success).toBe(false);
  });

  it("blocks a role without the studio.order permission", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_user" },
      error: null,
    });
    const { createStudioRequest } = await import("./studio");
    const result = await createStudioRequest(
      form({ eventId: "e1", serviceType: "design", title: "Banner" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/can't order/);
  });

  it("rejects missing required fields", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    const { createStudioRequest } = await import("./studio");
    const result = await createStudioRequest(form({ eventId: "e1" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Missing/);
  });

  it("creates the request for a permitted role", async () => {
    supabase.setUser({ id: "u1" });
    // profiles read returns role; studio_requests insert returns id.
    supabase.setTableResponse("profiles", {
      data: { role: "events_lead" },
      error: null,
    });
    supabase.setTableResponse("studio_requests", {
      data: { id: "s1" },
      error: null,
    });
    const { createStudioRequest } = await import("./studio");
    const result = await createStudioRequest(
      form({
        eventId: "e1",
        serviceType: "design",
        title: "Banner",
        description: "Big banner",
      }),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("s1");
  });
});
