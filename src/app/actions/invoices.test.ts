/**
 * Tests for invoice actions — the commercial-role guard, invoice-number
 * generation on create, status updates, and the cron overdue transition.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset();
});

describe("createInvoice", () => {
  it("blocks a non-commercial role", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "ops" });
    const { createInvoice } = await import("./invoices");
    const result = await createInvoice("e1", "acc1", { amount: 1000 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/internal staff/);
  });

  it("blocks an unauthenticated caller", async () => {
    getUser.mockResolvedValue(null);
    const { createInvoice } = await import("./invoices");
    const result = await createInvoice("e1", "acc1", { amount: 1000 });
    expect(result.success).toBe(false);
  });

  it("creates an invoice with a padded sequential number", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "events_lead" });
    // One object satisfies both the count probe and the insert read.
    supabase.setTableResponse("invoices", {
      data: { id: "inv1" },
      count: 4,
      error: null,
    });
    const { createInvoice } = await import("./invoices");
    const result = await createInvoice("e1", "acc1", { amount: 2500 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("inv1");

    const insertCall = supabase
      .callsFor("invoices")
      .find((c) => c.method === "insert");
    const payload = insertCall!.args[0] as Record<string, unknown>;
    expect(payload.invoice_number).toBe("BB-00005");
    expect(payload.status).toBe("draft");
    expect(payload.currency).toBe("GBP");
  });
});

describe("updateInvoiceStatus", () => {
  it("stamps paid_at + reference when marking paid", async () => {
    getUser.mockResolvedValue({ id: "u1", role: "events_lead" });
    supabase.setTableResponse("invoices", {
      data: { event_id: "e1" },
      error: null,
    });
    const { updateInvoiceStatus } = await import("./invoices");
    const result = await updateInvoiceStatus("inv1", "paid", {
      paymentReference: "TXN-9",
    });
    expect(result.success).toBe(true);

    const updateCall = supabase
      .callsFor("invoices")
      .find((c) => c.method === "update");
    const payload = updateCall!.args[0] as Record<string, unknown>;
    expect(payload.status).toBe("paid");
    expect(payload.paid_at).toBeDefined();
    expect(payload.payment_reference).toBe("TXN-9");
  });
});

describe("transitionOverdueInvoices (cron)", () => {
  it("counts the rows it flips to overdue", async () => {
    supabase.setTableResponse("invoices", {
      data: [{ id: "1" }, { id: "2" }],
      error: null,
    });
    const { transitionOverdueInvoices } = await import("./invoices");
    const result = await transitionOverdueInvoices();
    expect(result.count).toBe(2);
  });
});
