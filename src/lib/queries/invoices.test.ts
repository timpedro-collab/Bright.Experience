/**
 * Tests for the invoice-before-report sequencing read. It must never block a
 * publish — broken reads fail open.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("hasIssuedInvoiceForEvent", () => {
  it("is true when the event has an issued or paid invoice", async () => {
    supabase.setTableResponse("invoices", {
      data: [
        { id: "i1", status: "draft" },
        { id: "i2", status: "issued" },
      ],
      error: null,
    });
    const { hasIssuedInvoiceForEvent } = await import("./invoices");
    expect(await hasIssuedInvoiceForEvent("ev-1")).toBe(true);
  });

  it("is false when only draft invoices exist", async () => {
    supabase.setTableResponse("invoices", {
      data: [{ id: "i1", status: "draft" }],
      error: null,
    });
    const { hasIssuedInvoiceForEvent } = await import("./invoices");
    expect(await hasIssuedInvoiceForEvent("ev-1")).toBe(false);
  });

  it("fails open when the read errors, so publishing is never nagged by an outage", async () => {
    supabase.setTableResponse("invoices", {
      data: null,
      error: { message: "permission denied" },
    });
    const { hasIssuedInvoiceForEvent } = await import("./invoices");
    expect(await hasIssuedInvoiceForEvent("ev-1")).toBe(true);
  });
});
