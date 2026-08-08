/**
 * Tests for the authenticated rebook action — a signed-in customer turning a
 * finished event into a pre-filled quote on their own account.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
let serviceSupabase: MockSupabase;
const getUser = vi.fn();
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => serviceSupabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const CUSTOMER = {
  id: "u-cust",
  name: "Dana Reyes",
  email: "dana@acme.co",
  role: "customer_admin",
  accountId: "acc-1",
};

function eventRow(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    name: "Acme Spring Launch",
    account_id: "acc-1",
    event_type: "activation",
    venue_name: "Westfield London",
    accounts: { name: "Acme Drinks" },
    ...overrides,
  };
}

beforeEach(() => {
  supabase = createMockSupabase();
  serviceSupabase = createMockSupabase();
  getUser.mockReset();
  dispatchNotification.mockReset();
  getUser.mockResolvedValue(CUSTOMER);
});

describe("createRebookQuote", () => {
  it("creates a pre-filled quote on the customer's own account", async () => {
    supabase.setTableResponse("events", { data: eventRow(), error: null });
    serviceSupabase.setTableResponse("quotes", {
      data: { id: "q-new", machine_id: "m1", game_id: "g1", package_id: "p1", addons: ["led-wrap"], track: "book_now", event_type: "activation" },
      error: null,
    });

    const { createRebookQuote } = await import("./rebook");
    const result = await createRebookQuote(EVENT_ID);

    expect(result).toMatchObject({ success: true, data: { id: "q-new" } });

    const insert = serviceSupabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    expect(insert).toBeDefined();
    const row = insert!.args[0] as Record<string, unknown>;
    expect(row.account_id).toBe("acc-1");
    expect(row.contact_email).toBe("dana@acme.co");
    expect(row.status).toBe("submitted");
    expect(String(row.special_requirements)).toContain("Acme Spring Launch");

    expect(dispatchNotification).toHaveBeenCalledWith(
      "booking.received",
      expect.objectContaining({ quoteId: "q-new" }),
    );
  });

  it("rejects a signed-out caller", async () => {
    getUser.mockResolvedValue(null);
    const { createRebookQuote } = await import("./rebook");
    const result = await createRebookQuote(EVENT_ID);
    expect(result).toMatchObject({ success: false });
  });

  it("rejects a customer rebooking another account's event", async () => {
    supabase.setTableResponse("events", {
      data: eventRow({ account_id: "acc-other" }),
      error: null,
    });
    const { createRebookQuote } = await import("./rebook");
    const result = await createRebookQuote(EVENT_ID);
    expect(result).toMatchObject({ success: false, error: "Not authorised" });
  });

  it("fails cleanly when the event does not exist", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { createRebookQuote } = await import("./rebook");
    const result = await createRebookQuote(EVENT_ID);
    expect(result).toMatchObject({ success: false, error: "Event not found" });
  });

  it("allows internal users to rebook on the customer's behalf", async () => {
    getUser.mockResolvedValue({
      id: "u-int",
      name: "Alex Lead",
      email: "alex@brightblue.co.uk",
      role: "events_lead",
    });
    supabase.setTableResponse("events", { data: eventRow(), error: null });
    serviceSupabase.setTableResponse("quotes", {
      data: { id: "q-new" },
      error: null,
    });

    const { createRebookQuote } = await import("./rebook");
    const result = await createRebookQuote(EVENT_ID);
    expect(result).toMatchObject({ success: true });
  });
});
