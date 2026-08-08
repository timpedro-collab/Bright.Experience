/** Tests for the loop-pulse telemetry writer — it must never throw. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("recordLoopEvent", () => {
  it("records a loop touch with artifact and event", async () => {
    const { recordLoopEvent } = await import("./loop-events");
    await recordLoopEvent("invitation_landing", {
      artifact: "report",
      eventId: "ev-1",
    });
    const insert = supabase
      .callsFor("loop_events")
      .find((c) => c.method === "insert");
    expect(insert?.args[0]).toMatchObject({
      kind: "invitation_landing",
      artifact: "report",
      event_id: "ev-1",
    });
  });

  it("swallows insert failures — a broken write never breaks the page", async () => {
    supabase.setTableResponse("loop_events", {
      data: null,
      error: { message: "boom" },
    });
    const { recordLoopEvent } = await import("./loop-events");
    await expect(recordLoopEvent("pitch_unlock")).resolves.toBeUndefined();
  });
});
