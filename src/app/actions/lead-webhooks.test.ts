/** Tests for event-scoped lead webhook server actions. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let scopedSupabase: MockSupabase;
let adminSupabase: MockSupabase;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => scopedSupabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => adminSupabase,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "00000000-0000-4000-8000-000000000001";
const WEBHOOK_ID = "00000000-0000-4000-8000-0000000000c1";
const ACCOUNT_ID = "00000000-0000-4000-8000-0000000000d1";

beforeEach(() => {
  scopedSupabase = createMockSupabase();
  adminSupabase = createMockSupabase();
  scopedSupabase.setUser({ id: "user-1" });
});

function grantEventAccess(): void {
  scopedSupabase.setTableResponse("events", {
    data: { id: EVENT_ID },
    error: null,
  });
}

function denyEventAccess(): void {
  scopedSupabase.setTableResponse("events", { data: null, error: null });
}

describe("createLeadWebhook", () => {
  it("creates a subscription and returns the secret once", async () => {
    grantEventAccess();
    adminSupabase.queueTableResponses("events", [
      { data: { account_id: ACCOUNT_ID }, error: null },
    ]);
    adminSupabase.queueTableResponses("webhook_subscriptions", [
      { data: { id: WEBHOOK_ID }, error: null },
    ]);

    const { createLeadWebhook } = await import("./lead-webhooks");
    const result = await createLeadWebhook({
      eventId: EVENT_ID,
      url: "https://crm.example.com/leads",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.id).toBe(WEBHOOK_ID);
    expect(result.data.secret).toMatch(/^[0-9a-f]{64}$/);

    const insert = adminSupabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "insert");
    const row = insert?.args[0] as Record<string, unknown>;
    expect(row.url).toBe("https://crm.example.com/leads");
    expect(row.events).toEqual(["lead.captured"]);
    expect(row.event_id).toBe(EVENT_ID);
    expect(row.secret).toBe(result.data.secret);
  });

  it("rejects a customer who cannot access the event", async () => {
    denyEventAccess();

    const { createLeadWebhook } = await import("./lead-webhooks");
    const result = await createLeadWebhook({
      eventId: EVENT_ID,
      url: "https://crm.example.com/leads",
    });

    expect(result.success).toBe(false);
    expect(adminSupabase.callsFor("webhook_subscriptions")).toHaveLength(0);
  });
});

describe("getLeadWebhooksForEvent", () => {
  it("lists webhooks without the secret column", async () => {
    grantEventAccess();
    adminSupabase.setTableResponse("webhook_subscriptions", {
      data: [
        {
          id: WEBHOOK_ID,
          url: "https://crm.example.com/leads",
          is_active: true,
          failure_count: 0,
          last_triggered_at: null,
          events: ["lead.captured"],
          secret: "must-not-leak",
        },
      ],
      error: null,
    });

    const { getLeadWebhooksForEvent } = await import("./lead-webhooks");
    const result = await getLeadWebhooksForEvent(EVENT_ID);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      id: WEBHOOK_ID,
      url: "https://crm.example.com/leads",
      isActive: true,
      failureCount: 0,
      lastTriggeredAt: null,
    });
    expect(result.data[0]).not.toHaveProperty("secret");

    const select = adminSupabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "select");
    expect(String(select?.args[0])).not.toContain("secret");
  });

  it("rejects a customer who cannot access the event", async () => {
    denyEventAccess();

    const { getLeadWebhooksForEvent } = await import("./lead-webhooks");
    const result = await getLeadWebhooksForEvent(EVENT_ID);

    expect(result.success).toBe(false);
  });
});

describe("toggleLeadWebhook", () => {
  it("updates active state for an authorised caller", async () => {
    adminSupabase.queueTableResponses("webhook_subscriptions", [
      { data: { event_id: EVENT_ID }, error: null },
      { data: null, error: null },
    ]);
    grantEventAccess();

    const { toggleLeadWebhook } = await import("./lead-webhooks");
    const result = await toggleLeadWebhook(WEBHOOK_ID, false);

    expect(result.success).toBe(true);
    const update = adminSupabase
      .callsFor("webhook_subscriptions")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({ is_active: false });
  });

  it("rejects a customer who cannot access the event", async () => {
    adminSupabase.setTableResponse("webhook_subscriptions", {
      data: { event_id: EVENT_ID },
      error: null,
    });
    denyEventAccess();

    const { toggleLeadWebhook } = await import("./lead-webhooks");
    const result = await toggleLeadWebhook(WEBHOOK_ID, true);

    expect(result.success).toBe(false);
  });
});

describe("deleteLeadWebhook", () => {
  it("deletes the subscription for an authorised caller", async () => {
    adminSupabase.queueTableResponses("webhook_subscriptions", [
      { data: { event_id: EVENT_ID }, error: null },
      { data: null, error: null },
    ]);
    grantEventAccess();

    const { deleteLeadWebhook } = await import("./lead-webhooks");
    const result = await deleteLeadWebhook(WEBHOOK_ID);

    expect(result.success).toBe(true);
    expect(
      adminSupabase.callsFor("webhook_subscriptions").some((c) => c.method === "delete"),
    ).toBe(true);
  });

  it("rejects a customer who cannot access the event", async () => {
    adminSupabase.setTableResponse("webhook_subscriptions", {
      data: { event_id: EVENT_ID },
      error: null,
    });
    denyEventAccess();

    const { deleteLeadWebhook } = await import("./lead-webhooks");
    const result = await deleteLeadWebhook(WEBHOOK_ID);

    expect(result.success).toBe(false);
  });
});
