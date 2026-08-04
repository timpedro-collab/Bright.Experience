/** Tests for the pitch-link open counter. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const SLOT_ID = "bbbbbbbb-1111-1111-1111-111111111111";

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("recordPitchView", () => {
  it("increments the counter and stamps the last-viewed time", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { pitch_view_count: 3 },
      error: null,
    });

    const { recordPitchView } = await import("./pitch-views");
    await recordPitchView(SLOT_ID);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    const payload = update!.args[0] as Record<string, unknown>;
    expect(payload.pitch_view_count).toBe(4);
    expect(typeof payload.pitch_last_viewed_at).toBe("string");
  });

  it("starts from one when the counter was never set", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { pitch_view_count: null },
      error: null,
    });

    const { recordPitchView } = await import("./pitch-views");
    await recordPitchView(SLOT_ID);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect((update!.args[0] as Record<string, unknown>).pitch_view_count).toBe(1);
  });

  it("writes nothing for an unknown slot", async () => {
    supabase.setTableResponse("sponsorship_slots", { data: null, error: null });

    const { recordPitchView } = await import("./pitch-views");
    await recordPitchView(SLOT_ID);

    const update = supabase
      .callsFor("sponsorship_slots")
      .find((c) => c.method === "update");
    expect(update).toBeUndefined();
  });

  it("never throws when the client blows up", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: null,
      error: { message: "boom" },
    });

    const { recordPitchView } = await import("./pitch-views");
    await expect(recordPitchView(SLOT_ID)).resolves.toBeUndefined();
  });
});
