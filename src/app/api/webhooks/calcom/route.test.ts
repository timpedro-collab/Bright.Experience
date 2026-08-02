/** Tests for the Cal.com inbound booking webhook route handler. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeSignature } from "@/lib/webhooks/verify";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

const TEST_SECRET = "calcom-test-secret-32-chars-long!";

let mockSupabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => mockSupabase,
}));

const dispatchNotification = vi.fn();
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function buildSignedRequest(
  body: Record<string, unknown>,
  secret = TEST_SECRET
): Request {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/webhooks/calcom", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cal-signature-256": computeSignature(raw, secret),
    },
    body: raw,
  });
}

describe("POST /api/webhooks/calcom", () => {
  const originalSecret = process.env.CALCOM_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.CALCOM_WEBHOOK_SECRET = TEST_SECRET;
    mockSupabase = createMockSupabase();
    mockSupabase.setDefaultResponse({ data: null, error: null });
    dispatchNotification.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.CALCOM_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.CALCOM_WEBHOOK_SECRET;
    }
  });

  /* ─── Auth / validation ─── */

  it("returns 503 when the webhook secret is not configured", async () => {
    delete process.env.CALCOM_WEBHOOK_SECRET;
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/calcom", {
        method: "POST",
        body: "{}",
      })
    );
    expect(res.status).toBe(503);
  });

  it("returns 401 for an invalid signature", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/calcom", {
        method: "POST",
        headers: { "x-cal-signature-256": "deadbeef" },
        body: JSON.stringify({ triggerEvent: "BOOKING_CREATED" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("acknowledges and ignores bookings without a quoteId in metadata", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "BOOKING_CREATED",
        payload: { startTime: "2026-07-02T13:00:00Z", metadata: {} },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ignored).toBe(true);
    expect(mockSupabase.callsFor("quotes")).toHaveLength(0);
  });

  it("returns 422 for an unknown triggerEvent", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "FORM_SUBMITTED",
        payload: { metadata: { quoteId: "q-1" } },
      })
    );
    expect(res.status).toBe(422);
  });

  /* ─── BOOKING_CREATED ─── */

  it("writes the booked slot onto the quote and notifies the event lead", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "BOOKING_CREATED",
        payload: {
          startTime: "2026-07-02T13:00:00Z",
          metadata: { quoteId: "q-42" },
        },
      })
    );
    expect(res.status).toBe(200);

    const update = mockSupabase
      .callsFor("quotes")
      .find((c) => c.method === "update");
    expect(update).toBeDefined();
    const row = update!.args[0] as Record<string, unknown>;
    expect(row.walkthrough_scheduled_at).toBe("2026-07-02T13:00:00Z");
    expect(row.walkthrough_slot_label).toBe("Thu 2 Jul · 2:00 PM");

    expect(dispatchNotification).toHaveBeenCalledWith(
      "proposal.walkthrough_booked",
      expect.objectContaining({ quoteId: "q-42" })
    );
  });

  it("returns 500 when the quote update fails so Cal.com retries", async () => {
    mockSupabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "BOOKING_CREATED",
        payload: {
          startTime: "2026-07-02T13:00:00Z",
          metadata: { quoteId: "q-42" },
        },
      })
    );
    expect(res.status).toBe(500);
  });

  /* ─── BOOKING_CANCELLED ─── */

  it("clears the scheduled slot on cancellation", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "BOOKING_CANCELLED",
        payload: { metadata: { quoteId: "q-42" } },
      })
    );
    expect(res.status).toBe(200);

    const update = mockSupabase
      .callsFor("quotes")
      .find((c) => c.method === "update");
    const row = update!.args[0] as Record<string, unknown>;
    expect(row.walkthrough_scheduled_at).toBeNull();
    expect(row.walkthrough_slot_label).toBeNull();
  });

  /* ─── MEETING_ENDED ─── */

  it("marks the walkthrough complete when the meeting ends", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        triggerEvent: "MEETING_ENDED",
        payload: {
          endTime: "2026-07-02T13:15:00Z",
          metadata: { quoteId: "q-42" },
        },
      })
    );
    expect(res.status).toBe(200);

    const update = mockSupabase
      .callsFor("quotes")
      .find((c) => c.method === "update");
    const row = update!.args[0] as Record<string, unknown>;
    expect(row.walkthrough_completed_at).toBe("2026-07-02T13:15:00Z");
  });
});
