/** Tests for outbound lead webhook delivery. */
import { createHmac } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const fetchMock = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const EVENT_ID = "00000000-0000-4000-8000-000000000001";
const SUB_A = "00000000-0000-4000-8000-0000000000a1";
const SUB_B = "00000000-0000-4000-8000-0000000000b2";
const SECRET_A = "a".repeat(64);
const SECRET_B = "b".repeat(64);

const LEAD = {
  id: "lead-1",
  eventId: EVENT_ID,
  contactName: "Jane Doe",
  contactEmail: "jane@example.com",
  contactPhone: "+441234567890",
  customFields: { company: "Acme" },
  source: "game",
  capturedAt: "2026-08-04T12:00:00.000Z",
  emailStatus: "verified",
  isRepeatPlayer: false,
};

function activeSubscriptions(
  rows: Array<Record<string, unknown>>,
): void {
  supabase.setTableResponse("webhook_subscriptions", {
    data: rows,
    error: null,
  });
}

beforeEach(() => {
  supabase = createMockSupabase();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deliverLeadToSubscriptions", () => {
  it("delivers successfully and sends the signature header", async () => {
    activeSubscriptions([
      {
        id: SUB_A,
        url: "https://crm.example.com/leads",
        secret: SECRET_A,
        events: ["lead.captured"],
        failure_count: 0,
      },
    ]);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const { deliverLeadToSubscriptions } = await import("./lead-delivery");
    const result = await deliverLeadToSubscriptions(LEAD);

    expect(result).toEqual({ delivered: 1, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://crm.example.com/leads");
    expect(init.headers).toMatchObject({
      "Content-Type": "application/json",
      "X-BrightBlue-Event": "lead.captured",
    });

    const rawBody = init.body as string;
    const signature = (init.headers as Record<string, string>)["X-BrightBlue-Signature"];
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    const expectedHex = createHmac("sha256", SECRET_A)
      .update(rawBody)
      .digest("hex");
    expect(signature).toBe(`sha256=${expectedHex}`);

    const update = supabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ failure_count: 0 });
  });

  it("increments failure_count on a non-2xx response", async () => {
    activeSubscriptions([
      {
        id: SUB_A,
        url: "https://crm.example.com/leads",
        secret: SECRET_A,
        events: ["lead.captured"],
        failure_count: 2,
      },
    ]);
    fetchMock.mockResolvedValue({ ok: false, status: 503 });

    const { deliverLeadToSubscriptions } = await import("./lead-delivery");
    const result = await deliverLeadToSubscriptions(LEAD);

    expect(result).toEqual({ delivered: 0, failed: 1 });

    const update = supabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ failure_count: 3 });
    expect(update?.args[0]).not.toHaveProperty("is_active");
  });

  it("deactivates the subscription on the fifth consecutive failure", async () => {
    activeSubscriptions([
      {
        id: SUB_A,
        url: "https://crm.example.com/leads",
        secret: SECRET_A,
        events: ["lead.captured"],
        failure_count: 4,
      },
    ]);
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const { deliverLeadToSubscriptions } = await import("./lead-delivery");
    await deliverLeadToSubscriptions(LEAD);

    const update = supabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ failure_count: 5, is_active: false });
  });

  it("returns zero counts when there are no active subscriptions", async () => {
    activeSubscriptions([]);

    const { deliverLeadToSubscriptions } = await import("./lead-delivery");
    const result = await deliverLeadToSubscriptions(LEAD);

    expect(result).toEqual({ delivered: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("continues delivering when one endpoint throws", async () => {
    activeSubscriptions([
      {
        id: SUB_A,
        url: "https://bad.example.com/leads",
        secret: SECRET_A,
        events: ["lead.captured"],
        failure_count: 0,
      },
      {
        id: SUB_B,
        url: "https://good.example.com/leads",
        secret: SECRET_B,
        events: ["lead.captured"],
        failure_count: 0,
      },
    ]);
    fetchMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const { deliverLeadToSubscriptions } = await import("./lead-delivery");
    const result = await deliverLeadToSubscriptions(LEAD);

    expect(result).toEqual({ delivered: 1, failed: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
