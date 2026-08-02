/**
 * Tests for provisionEventFromQuote — the quote-not-found guard and the
 * happy path that finds an existing account, creates the event, and invites
 * the customer contact.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const createEventInternal = vi.fn();
const inviteCustomerUserInternal = vi.fn();
const seedComplianceFromAccount = vi.fn();
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("@/server/events", () => ({
  createEventInternal: (...args: unknown[]) => createEventInternal(...args),
}));
vi.mock("@/server/invites", () => ({
  inviteCustomerUserInternal: (...args: unknown[]) =>
    inviteCustomerUserInternal(...args),
}));
vi.mock("@/app/actions/compliance", () => ({
  seedComplianceFromAccount: (...args: unknown[]) =>
    seedComplianceFromAccount(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => {
    dispatchNotification(...args);
    return Promise.resolve();
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  createEventInternal.mockReset().mockResolvedValue({
    success: true,
    data: { id: "evt1" },
  });
  inviteCustomerUserInternal.mockReset().mockResolvedValue({ success: true });
  seedComplianceFromAccount.mockReset().mockResolvedValue(undefined);
  dispatchNotification.mockReset();
});

describe("provisionEventFromQuote", () => {
  it("returns an error when the quote is missing", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "not found" },
    });
    const { provisionEventFromQuote } = await import("./provisioning");
    const result = await provisionEventFromQuote("q1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Quote not found/);
  });

  it("provisions against an existing account and invites the contact", async () => {
    supabase.setTableResponse("quotes", {
      data: {
        id: "q1",
        contact_name: "Jane",
        contact_email: "jane@acme.com",
        company_name: "Acme",
        event_type: "activation",
        packages: { name: "Pro", tier: "premium" },
      },
      error: null,
    });
    supabase.setTableResponse("accounts", {
      data: { id: "acc1" },
      error: null,
    });

    const { provisionEventFromQuote } = await import("./provisioning");
    const result = await provisionEventFromQuote("q1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ eventId: "evt1", accountId: "acc1" });
    }
    expect(createEventInternal).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "acc1" }),
    );
    expect(inviteCustomerUserInternal).toHaveBeenCalledWith(
      "jane@acme.com",
      "acc1",
      "customer_admin",
    );
    expect(dispatchNotification).toHaveBeenCalledWith(
      "booking.provisioned",
      expect.objectContaining({ eventId: "evt1" }),
      expect.anything(),
    );
  });

  it("fails cleanly when event creation fails", async () => {
    supabase.setTableResponse("quotes", {
      data: {
        id: "q1",
        contact_name: "Jane",
        contact_email: "jane@acme.com",
        company_name: "Acme",
      },
      error: null,
    });
    supabase.setTableResponse("accounts", { data: { id: "acc1" }, error: null });
    createEventInternal.mockResolvedValue({ success: false, error: "boom" });

    const { provisionEventFromQuote } = await import("./provisioning");
    const result = await provisionEventFromQuote("q1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Failed to create event/);
  });
});
