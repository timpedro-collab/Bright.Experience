/**
 * Happy-path + one-error smoke tests for the remaining server actions.
 *
 * Per the testing plan, the high-stakes actions (events, stages,
 * approvals, asset-review, quotes, notification-preferences) get
 * branch coverage in their own files; the others get one happy + one
 * error path here so the coverage net catches regressions without
 * Goldilocks-zoning every payload.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const sendStudioOrderNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/lib/email", () => ({
  sendStudioOrderNotification: (...args: unknown[]) =>
    sendStudioOrderNotification(...args),
  sendProposalIntakeNotification: vi.fn(),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  sendStudioOrderNotification.mockReset();
});

// ──────────────────────────────────────────────────────────
// notifications.ts
// ──────────────────────────────────────────────────────────
describe("notifications action — markRead", () => {
  it("returns error when unauthenticated", async () => {
    supabase.setUser(null);
    const { markRead } = await import("./notifications");
    const result = await markRead("n1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("succeeds when authenticated", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markRead } = await import("./notifications");
    const result = await markRead("n1");
    expect(result.success).toBe(true);
  });

  it("returns error on Supabase error", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "denied" },
    });
    const { markRead } = await import("./notifications");
    const result = await markRead("n1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/denied/);
  });
});

describe("notifications action — markAllRead", () => {
  it("returns error when unauthenticated", async () => {
    supabase.setUser(null);
    const { markAllRead } = await import("./notifications");
    const result = await markAllRead();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("succeeds when authenticated", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markAllRead } = await import("./notifications");
    const result = await markAllRead();
    expect(result.success).toBe(true);
  });
});

describe("notifications action — createNotification", () => {
  it("inserts a new notification row", async () => {
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { createNotification } = await import("./notifications");
    const result = await createNotification("u1", "evt-1", "system", "Hi", "body", "/link");
    expect(result.success).toBe(true);
  });

  it("returns error on insert error", async () => {
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "boom" },
    });
    const { createNotification } = await import("./notifications");
    const result = await createNotification("u1", null, "system", "Hi", null, null);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/boom/);
  });
});

// ──────────────────────────────────────────────────────────
// briefing.ts
// ──────────────────────────────────────────────────────────
describe("briefing action — saveBriefingResponse", () => {
  // The action validates input with the briefing-response schema, so tests
  // use a realistic UUID-shaped event id.
  const BRIEFING_EVENT_ID = "e1111111-1111-1111-1111-111111111111";

  it("returns error when unauthenticated", async () => {
    supabase.setUser(null);
    const { saveBriefingResponse } = await import("./briefing");
    const result = await saveBriefingResponse(BRIEFING_EVENT_ID, "creative", {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("rejects a malformed event id via validation", async () => {
    supabase.setUser({ id: "u1" });
    const { saveBriefingResponse } = await import("./briefing");
    const result = await saveBriefingResponse("evt-1", "creative", { brand: "Acme" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Invalid event ID/);
  });

  it("saves a draft (no submit dispatch)", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("briefing_responses", { data: null, error: null });
    const { saveBriefingResponse } = await import("./briefing");
    await saveBriefingResponse(BRIEFING_EVENT_ID, "creative", { brand: "Acme" }, false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("dispatches briefing.submitted on submit=true", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("briefing_responses", { data: null, error: null });
    supabase.setTableResponse("events", { data: { name: "Spring" }, error: null });
    supabase.setTableResponse("profiles", { data: { name: "Casey" }, error: null });
    const { saveBriefingResponse } = await import("./briefing");
    await saveBriefingResponse(BRIEFING_EVENT_ID, "creative", { brand: "Acme" }, true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "briefing.submitted",
      expect.any(Object)
    );
  });
});

// ──────────────────────────────────────────────────────────
// messages.ts
// ──────────────────────────────────────────────────────────
describe("messages action — sendMessage", () => {
  it("returns error when unauthenticated", async () => {
    supabase.setUser(null);
    const { sendMessage } = await import("./messages");
    const result = await sendMessage("evt-1", "Hello", false);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/i);
  });

  it("rejects empty body via validation", async () => {
    supabase.setUser({ id: "u1" });
    const { sendMessage } = await import("./messages");
    const result = await sendMessage("evt-1", "", false);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/empty/i);
  });

  it("inserts message and dispatches message.received", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("messages", {
      data: { id: "m1" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { name: "Casey" },
      error: null,
    });
    const { sendMessage } = await import("./messages");
    await sendMessage("evt-1", "Hello there", false);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "message.received",
      expect.objectContaining({ messageId: "m1", senderName: "Casey" })
    );
  });
});
