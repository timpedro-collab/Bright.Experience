/** Tests for the post-play journey configuration action. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
let internalAllowed = true;

vi.mock("@/lib/auth", () => ({
  requireInternalUser: vi.fn(async () => {
    if (!internalAllowed) throw new Error("Forbidden");
    return { supabase, user: { id: "u1" }, profile: { role: "admin" } };
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const VALID = {
  eventId: "cccccccc-3333-3333-3333-333333333333",
  kind: "discount" as const,
  headline: "Your 10% code",
  body: "Thanks for playing.",
  ctaLabel: "Shop now",
  ctaUrl: "https://brand.example/shop",
  discountCode: "PLAY10",
  isActive: true,
};

beforeEach(() => {
  supabase = createMockSupabase();
  internalAllowed = true;
  vi.resetModules();
});

describe("saveJourney", () => {
  it("creates a journey when the event has none", async () => {
    supabase.queueTableResponses("post_play_journeys", [
      { data: null, error: null }, // existing lookup
      { data: null, error: null }, // insert
    ]);

    const { saveJourney } = await import("./journeys");
    const result = await saveJourney(VALID);

    expect(result.success).toBe(true);
    const insert = supabase
      .callsFor("post_play_journeys")
      .find((c) => c.method === "insert");
    expect(insert).toBeDefined();
    const row = insert!.args[0] as Record<string, unknown>;
    expect(row.event_id).toBe(VALID.eventId);
    expect(row.cta_url).toBe(VALID.ctaUrl);
  });

  it("updates in place when a journey exists, preserving touch history", async () => {
    supabase.queueTableResponses("post_play_journeys", [
      { data: { id: "j-1" }, error: null }, // existing lookup
      { data: null, error: null }, // update
    ]);

    const { saveJourney } = await import("./journeys");
    const result = await saveJourney({ ...VALID, headline: "New headline" });

    expect(result.success).toBe(true);
    const update = supabase
      .callsFor("post_play_journeys")
      .find((c) => c.method === "update");
    expect(update).toBeDefined();
    expect((update!.args[0] as Record<string, unknown>).headline).toBe(
      "New headline",
    );
  });

  it("rejects a non-https CTA URL", async () => {
    const { saveJourney } = await import("./journeys");
    const result = await saveJourney({
      ...VALID,
      ctaUrl: "http://brand.example/shop",
    });

    expect(result).toEqual({ success: false, error: "URL must use https" });
  });

  it("rejects callers who are not internal", async () => {
    internalAllowed = false;

    const { saveJourney } = await import("./journeys");
    const result = await saveJourney(VALID);

    expect(result).toEqual({ success: false, error: "Not authorised" });
  });
});
