/** Tests for the post-play journey send engine. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const emailSend = vi.fn(async (..._args: unknown[]) => ({
  data: { id: "email-1" },
  error: null,
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: emailSend };
  },
}));

const JOURNEY = {
  id: "aaaaaaaa-1111-1111-1111-111111111111",
  kind: "discount",
  headline: "Your 10% code inside",
  body: "Thanks for playing at the show.",
  cta_label: "Shop the range",
  cta_url: "https://brand.example/shop",
  discount_code: "PLAY10",
};

const LEAD = {
  id: "bbbbbbbb-2222-2222-2222-222222222222",
  eventId: "cccccccc-3333-3333-3333-333333333333",
  contactEmail: "jane@acme.com",
  contactName: "Jane Doe",
  emailStatus: "verified",
};

beforeEach(() => {
  supabase = createMockSupabase();
  emailSend.mockClear();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.resetModules();
});

describe("sendPostPlayJourney", () => {
  it("sends the branded follow-up and records the sent touch", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: JOURNEY,
      error: null,
    });
    supabase.setTableResponse("journey_touches", { data: null, error: null });

    const { sendPostPlayJourney } = await import("./journeys");
    const result = await sendPostPlayJourney(LEAD);

    expect(result.sent).toBe(true);
    const touchInsert = supabase
      .callsFor("journey_touches")
      .find((c) => c.method === "insert");
    expect(touchInsert).toBeDefined();
    expect(emailSend).toHaveBeenCalledTimes(1);
    const payload = emailSend.mock.calls[0]![0] as unknown as {
      to: string[];
      subject: string;
      html: string;
    };
    expect(payload.to).toEqual(["jane@acme.com"]);
    expect(payload.subject).toBe("Your 10% code inside");
    expect(payload.html).toContain("PLAY10");
    expect(payload.html).toContain("t=clicked");
    expect(payload.html).toContain("t=opened");
  });

  it("skips leads that failed quality screening", async () => {
    const { sendPostPlayJourney } = await import("./journeys");
    const result = await sendPostPlayJourney({
      ...LEAD,
      emailStatus: "disposable",
    });

    expect(result).toEqual({ sent: false, skipped: "email_status disposable" });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("skips when the event has no active journey", async () => {
    supabase.setTableResponse("post_play_journeys", { data: null, error: null });

    const { sendPostPlayJourney } = await import("./journeys");
    const result = await sendPostPlayJourney(LEAD);

    expect(result).toEqual({ sent: false, skipped: "no active journey" });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("does not send twice for the same lead", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: JOURNEY,
      error: null,
    });
    supabase.setTableResponse("journey_touches", {
      data: null,
      error: { message: "duplicate key", code: "23505" },
    });

    const { sendPostPlayJourney } = await import("./journeys");
    const result = await sendPostPlayJourney(LEAD);

    expect(result).toEqual({ sent: false, skipped: "already sent" });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("never throws when the send blows up", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: JOURNEY,
      error: null,
    });
    supabase.setTableResponse("journey_touches", { data: null, error: null });
    emailSend.mockRejectedValueOnce(new Error("resend down"));

    const { sendPostPlayJourney } = await import("./journeys");
    await expect(sendPostPlayJourney(LEAD)).resolves.toEqual({
      sent: false,
      skipped: "send error",
    });
  });
});

describe("recordJourneyTouch", () => {
  it("inserts the touch row", async () => {
    supabase.setTableResponse("journey_touches", { data: null, error: null });

    const { recordJourneyTouch } = await import("./journeys");
    await recordJourneyTouch(JOURNEY.id, LEAD.id, "clicked");

    const insert = supabase
      .callsFor("journey_touches")
      .find((c) => c.method === "insert");
    expect(insert!.args[0]).toEqual({
      journey_id: JOURNEY.id,
      lead_id: LEAD.id,
      touch: "clicked",
    });
  });

  it("swallows duplicate-touch violations silently", async () => {
    supabase.setTableResponse("journey_touches", {
      data: null,
      error: { message: "duplicate key", code: "23505" },
    });

    const { recordJourneyTouch } = await import("./journeys");
    await expect(
      recordJourneyTouch(JOURNEY.id, LEAD.id, "opened"),
    ).resolves.toBeUndefined();
  });
});

describe("getJourneyCtaUrl", () => {
  it("returns the journey's redirect target", async () => {
    supabase.setTableResponse("post_play_journeys", {
      data: { cta_url: "https://brand.example/shop" },
      error: null,
    });

    const { getJourneyCtaUrl } = await import("./journeys");
    await expect(getJourneyCtaUrl(JOURNEY.id)).resolves.toBe(
      "https://brand.example/shop",
    );
  });

  it("returns null for an unknown journey", async () => {
    supabase.setTableResponse("post_play_journeys", { data: null, error: null });

    const { getJourneyCtaUrl } = await import("./journeys");
    await expect(getJourneyCtaUrl(JOURNEY.id)).resolves.toBeNull();
  });
});
