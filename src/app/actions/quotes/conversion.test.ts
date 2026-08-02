/**
 * Tests for the manual quote → event conversion.
 *
 * Provisioning creates an account, an event and a customer invite, so the two
 * things worth proving are that only commercial roles can fire it and that
 * firing it twice doesn't hand the customer two workspaces.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const getUser = vi.fn();
const provisionEventFromQuote = vi.fn();
const writeAudit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/server/provisioning", () => ({
  provisionEventFromQuote: (...args: unknown[]) =>
    provisionEventFromQuote(...args),
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAudit(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const QUOTE_ID = "q1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const EVENTS_LEAD = {
  id: "u1",
  name: "Alex Lead",
  email: "alex@brightblue.co.uk",
  role: "events_lead",
};

/** A quote row as the action reads it. */
function quoteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: QUOTE_ID,
    status: "accepted",
    event_id: null,
    contact_name: "Dana Reyes",
    company_name: "Acme Drinks",
    ...overrides,
  };
}

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset();
  provisionEventFromQuote.mockReset();
  writeAudit.mockReset();
  getUser.mockResolvedValue(EVENTS_LEAD);
  provisionEventFromQuote.mockResolvedValue({
    success: true,
    data: { eventId: EVENT_ID, accountId: "a1" },
  });
});

describe("convertQuoteToEvent", () => {
  it("provisions the event and records who did it", async () => {
    supabase.setTableResponse("quotes", { data: quoteRow(), error: null });

    const { convertQuoteToEvent } = await import("./conversion");
    const result = await convertQuoteToEvent(QUOTE_ID);

    expect(result).toMatchObject({
      success: true,
      data: { eventId: EVENT_ID, alreadyConverted: false },
    });
    expect(provisionEventFromQuote).toHaveBeenCalledWith(QUOTE_ID);
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: EVENT_ID,
        entityId: QUOTE_ID,
        action: "quote_converted",
        metadata: expect.objectContaining({ manual: true }),
      })
    );
  });

  it("converts a book-now quote that is still submitted", async () => {
    supabase.setTableResponse("quotes", {
      data: quoteRow({ status: "submitted" }),
      error: null,
    });

    const { convertQuoteToEvent } = await import("./conversion");
    expect(await convertQuoteToEvent(QUOTE_ID)).toMatchObject({ success: true });
  });

  it("returns the existing event instead of provisioning a second one", async () => {
    supabase.setTableResponse("quotes", {
      data: quoteRow({ event_id: EVENT_ID }),
      error: null,
    });

    const { convertQuoteToEvent } = await import("./conversion");
    const result = await convertQuoteToEvent(QUOTE_ID);

    expect(result).toMatchObject({
      success: true,
      data: { eventId: EVENT_ID, alreadyConverted: true },
    });
    expect(provisionEventFromQuote).not.toHaveBeenCalled();
  });

  it("refuses a declined quote", async () => {
    supabase.setTableResponse("quotes", {
      data: quoteRow({ status: "declined" }),
      error: null,
    });

    const { convertQuoteToEvent } = await import("./conversion");
    const result = await convertQuoteToEvent(QUOTE_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/declined/);
    expect(provisionEventFromQuote).not.toHaveBeenCalled();
  });

  it("refuses a draft quote", async () => {
    supabase.setTableResponse("quotes", {
      data: quoteRow({ status: "draft" }),
      error: null,
    });

    const { convertQuoteToEvent } = await import("./conversion");
    expect(await convertQuoteToEvent(QUOTE_ID)).toMatchObject({ success: false });
  });

  it("reports a quote that does not exist", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });

    const { convertQuoteToEvent } = await import("./conversion");
    const result = await convertQuoteToEvent(QUOTE_ID);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not found/i);
  });

  it("passes a provisioning failure straight back", async () => {
    supabase.setTableResponse("quotes", { data: quoteRow(), error: null });
    provisionEventFromQuote.mockResolvedValue({
      success: false,
      error: "Failed to create customer account",
    });

    const { convertQuoteToEvent } = await import("./conversion");
    const result = await convertQuoteToEvent(QUOTE_ID);

    expect(result).toMatchObject({
      success: false,
      error: "Failed to create customer account",
    });
    expect(writeAudit).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller", async () => {
    getUser.mockResolvedValue(null);

    const { convertQuoteToEvent } = await import("./conversion");
    expect(await convertQuoteToEvent(QUOTE_ID)).toMatchObject({
      success: false,
      error: "Not authorised",
    });
    expect(provisionEventFromQuote).not.toHaveBeenCalled();
  });

  it("rejects an internal role outside the commercial lane", async () => {
    getUser.mockResolvedValue({ ...EVENTS_LEAD, role: "qa_lead" });

    const { convertQuoteToEvent } = await import("./conversion");
    expect(await convertQuoteToEvent(QUOTE_ID)).toMatchObject({
      success: false,
      error: "Not authorised",
    });
  });

  it("rejects a customer", async () => {
    getUser.mockResolvedValue({ ...EVENTS_LEAD, role: "customer_admin" });

    const { convertQuoteToEvent } = await import("./conversion");
    expect(await convertQuoteToEvent(QUOTE_ID)).toMatchObject({
      success: false,
    });
    expect(provisionEventFromQuote).not.toHaveBeenCalled();
  });
});
