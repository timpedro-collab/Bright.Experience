/** Tests for post-play journey reads and funnel roll-ups. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

const EVENT_ID = "cccccccc-3333-3333-3333-333333333333";
const JOURNEY_ID = "aaaaaaaa-1111-1111-1111-111111111111";

describe("getJourneyForEvent", () => {
  it("maps the row to camelCase", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: {
        id: JOURNEY_ID,
        event_id: EVENT_ID,
        kind: "discount",
        headline: "Your code",
        body: null,
        cta_label: "Shop",
        cta_url: "https://brand.example/shop",
        discount_code: "PLAY10",
        is_active: true,
      },
      error: null,
    });

    const { getJourneyForEvent } = await import("./journeys");
    const journey = await getJourneyForEvent(EVENT_ID);

    expect(journey).toEqual({
      id: JOURNEY_ID,
      eventId: EVENT_ID,
      kind: "discount",
      headline: "Your code",
      body: null,
      ctaLabel: "Shop",
      ctaUrl: "https://brand.example/shop",
      discountCode: "PLAY10",
      isActive: true,
    });
  });

  it("returns null when the event has no journey", async () => {
    supabase.setTableResponse("post_play_journeys", { data: null, error: null });

    const { getJourneyForEvent } = await import("./journeys");
    await expect(getJourneyForEvent(EVENT_ID)).resolves.toBeNull();
  });

  it("returns null on query error", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: null,
      error: { message: "boom" },
    });

    const { getJourneyForEvent } = await import("./journeys");
    await expect(getJourneyForEvent(EVENT_ID)).resolves.toBeNull();
  });
});

describe("getJourneyFunnel", () => {
  it("counts each touch and splits the first-24h window", async () => {
    const sentAt = "2026-08-01T10:00:00Z";
    supabase.setTableResponse("journey_touches", {
      data: [
        { touch: "sent", occurred_at: sentAt },
        { touch: "sent", occurred_at: "2026-08-01T11:00:00Z" },
        { touch: "opened", occurred_at: "2026-08-01T12:00:00Z" }, // within 24h
        { touch: "opened", occurred_at: "2026-08-03T12:00:00Z" }, // outside
        { touch: "clicked", occurred_at: "2026-08-01T12:05:00Z" }, // within
        { touch: "redeemed", occurred_at: "2026-08-05T12:00:00Z" },
      ],
      error: null,
    });

    const { getJourneyFunnel } = await import("./journeys");
    const funnel = await getJourneyFunnel(JOURNEY_ID);

    expect(funnel).toEqual({
      sent: 2,
      opened: 2,
      clicked: 1,
      redeemed: 1,
      within24h: { opened: 1, clicked: 1 },
    });
  });

  it("returns zero counts when nothing was sent", async () => {
    supabase.setTableResponse("journey_touches", { data: [], error: null });

    const { getJourneyFunnel } = await import("./journeys");
    const funnel = await getJourneyFunnel(JOURNEY_ID);

    expect(funnel.sent).toBe(0);
    expect(funnel.within24h).toEqual({ opened: 0, clicked: 0 });
  });

  it("returns zero counts on query error", async () => {
    supabase.setTableResponse("journey_touches", {
      data: null,
      error: { message: "boom" },
    });

    const { getJourneyFunnel } = await import("./journeys");
    const funnel = await getJourneyFunnel(JOURNEY_ID);
    expect(funnel.sent).toBe(0);
  });
});
