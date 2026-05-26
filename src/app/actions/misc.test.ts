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
  it("throws when unauthenticated", async () => {
    supabase.setUser(null);
    const { markRead } = await import("./notifications");
    await expect(markRead("n1")).rejects.toThrow(/authenticated/);
  });

  it("succeeds when authenticated", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markRead } = await import("./notifications");
    await expect(markRead("n1")).resolves.toBeUndefined();
  });

  it("throws on Supabase error", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "denied" },
    });
    const { markRead } = await import("./notifications");
    await expect(markRead("n1")).rejects.toThrow(/denied/);
  });
});

describe("notifications action — markAllRead", () => {
  it("throws when unauthenticated", async () => {
    supabase.setUser(null);
    const { markAllRead } = await import("./notifications");
    await expect(markAllRead()).rejects.toThrow(/authenticated/);
  });

  it("succeeds when authenticated", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { markAllRead } = await import("./notifications");
    await expect(markAllRead()).resolves.toBeUndefined();
  });
});

describe("notifications action — createNotification", () => {
  it("inserts a new notification row", async () => {
    supabase.setTableResponse("notifications", { data: null, error: null });
    const { createNotification } = await import("./notifications");
    await expect(
      createNotification("u1", "evt-1", "system", "Hi", "body", "/link")
    ).resolves.toBeUndefined();
  });

  it("throws on insert error", async () => {
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "boom" },
    });
    const { createNotification } = await import("./notifications");
    await expect(
      createNotification("u1", null, "system", "Hi", null, null)
    ).rejects.toThrow(/boom/);
  });
});

// ──────────────────────────────────────────────────────────
// briefing.ts
// ──────────────────────────────────────────────────────────
describe("briefing action — saveBriefingResponse", () => {
  it("throws when unauthenticated", async () => {
    supabase.setUser(null);
    const { saveBriefingResponse } = await import("./briefing");
    await expect(
      saveBriefingResponse("evt-1", "creative", {})
    ).rejects.toThrow(/authenticated/);
  });

  it("saves a draft (no submit dispatch)", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("briefing_responses", { data: null, error: null });
    const { saveBriefingResponse } = await import("./briefing");
    await saveBriefingResponse("evt-1", "creative", { brand: "Acme" }, false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("dispatches briefing.submitted on submit=true", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("briefing_responses", { data: null, error: null });
    supabase.setTableResponse("events", { data: { name: "Spring" }, error: null });
    supabase.setTableResponse("profiles", { data: { name: "Casey" }, error: null });
    const { saveBriefingResponse } = await import("./briefing");
    await saveBriefingResponse("evt-1", "creative", { brand: "Acme" }, true);
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
  it("throws when unauthenticated", async () => {
    supabase.setUser(null);
    const { sendMessage } = await import("./messages");
    await expect(sendMessage("evt-1", "Hello", false)).rejects.toThrow(
      /authenticated/
    );
  });

  it("rejects empty body", async () => {
    supabase.setUser({ id: "u1" });
    const { sendMessage } = await import("./messages");
    await expect(sendMessage("evt-1", "   ", false)).rejects.toThrow(/empty/);
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

// ──────────────────────────────────────────────────────────
// assets.ts — reviewAsset (the legacy decision action)
// ──────────────────────────────────────────────────────────
describe("assets action — reviewAsset", () => {
  it("throws when unauthenticated", async () => {
    supabase.setUser(null);
    const { reviewAsset } = await import("./assets");
    await expect(reviewAsset("a1", "evt-1", "accepted")).rejects.toThrow(
      /authenticated/
    );
  });

  it("updates the asset on accept", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("assets", { data: null, error: null });
    const { reviewAsset } = await import("./assets");
    await reviewAsset("a1", "evt-1", "accepted");
    const updateCall = supabase
      .callsFor("assets")
      .find((c) => c.method === "update");
    const row = updateCall!.args[0] as Record<string, unknown>;
    expect(row.status).toBe("accepted");
  });

  it("throws on update error", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("assets", {
      data: null,
      error: { message: "denied" },
    });
    const { reviewAsset } = await import("./assets");
    await expect(reviewAsset("a1", "evt-1", "rejected")).rejects.toThrow(
      /Review failed/
    );
  });
});
