/**
 * Tests for the stage advancement actions.
 *
 * The two-step flow (`canAdvanceStage` → `advanceStage`) needs careful
 * mock juggling: each `from("events")` call returns the same response.
 * We use the mock's per-table response feature plus call inspection to
 * assert on the right behaviour.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const enqueueStageAdvance = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/lib/pipedrive/triggers", () => ({
  enqueueStageAdvance: (...args: unknown[]) => enqueueStageAdvance(...args),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  enqueueStageAdvance.mockReset();
});

describe("canAdvanceStage", () => {
  it("returns false with 'Event not found' when the event is missing", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { canAdvanceStage } = await import("./stages");
    const result = await canAdvanceStage("evt-1");
    expect(result.canAdvance).toBe(false);
    expect(result.blockers).toContain("Event not found");
  });

  it("returns false when there is no next stage (already at final)", async () => {
    supabase.setTableResponse("events", {
      data: { current_stage: "complete" },
      error: null,
    });
    const { canAdvanceStage } = await import("./stages");
    const result = await canAdvanceStage("evt-1");
    expect(result.canAdvance).toBe(false);
    expect(result.blockers[0]).toMatch(/final/i);
  });

  it("returns canAdvance=true when no blocking tasks remain", async () => {
    // Event resolves first, then tasks.
    supabase.setTableResponse("events", {
      data: { current_stage: "confirmed" },
      error: null,
    });
    supabase.setTableResponse("tasks", { data: [], error: null });
    const { canAdvanceStage } = await import("./stages");
    const result = await canAdvanceStage("evt-1");
    expect(result.canAdvance).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it("returns false with task titles when blockers remain", async () => {
    supabase.setTableResponse("events", {
      data: { current_stage: "confirmed" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: [{ id: "t1", title: "Upload hero", status: "pending" }],
      error: null,
    });
    const { canAdvanceStage } = await import("./stages");
    const result = await canAdvanceStage("evt-1");
    expect(result.canAdvance).toBe(false);
    expect(result.blockers).toContain("Upload hero");
  });
});

describe("advanceStage", () => {
  it("returns error when not authenticated", async () => {
    supabase.setUser(null);
    const { advanceStage } = await import("./stages");
    const result = await advanceStage("evt-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/);
  });

  it("returns error when blockers remain", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("events", {
      data: { current_stage: "confirmed", name: "Spring" },
      error: null,
    });
    supabase.setTableResponse("tasks", {
      data: [{ id: "t1", title: "Upload hero" }],
      error: null,
    });
    const { advanceStage } = await import("./stages");
    const result = await advanceStage("evt-1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Cannot advance/);
  });

  it("dispatches stage.changed + enqueues Pipedrive on success", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("events", {
      data: { current_stage: "confirmed", name: "Spring" },
      error: null,
    });
    supabase.setTableResponse("tasks", { data: [], error: null });
    supabase.setTableResponse("audit_entries", { data: null, error: null });
    const { advanceStage } = await import("./stages");
    await advanceStage("evt-1");
    expect(dispatchNotification).toHaveBeenCalledWith(
      "stage.changed",
      expect.objectContaining({ eventId: "evt-1", eventName: "Spring" })
    );
    expect(enqueueStageAdvance).toHaveBeenCalledWith("evt-1", expect.any(String));
  });
});
