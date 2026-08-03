/**
 * Tests for the quote query helpers (read side).
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
// The public proposal read bypasses RLS via the service-role client — same
// recorder so we can assert on its chain calls too.
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getQuotes", () => {
  it("returns the rows ordered by created_at desc", async () => {
    supabase.setTableResponse("quotes", {
      data: [{ id: "q1" }, { id: "q2" }],
      error: null,
    });
    const { getQuotes } = await import("./quotes");
    const result = await getQuotes();
    expect(result).toHaveLength(2);
    // Confirm the ordering was applied
    const calls = supabase.callsFor("quotes");
    const orderCall = calls.find((c) => c.method === "order");
    expect(orderCall).toBeDefined();
    expect(orderCall!.args[0]).toBe("created_at");
  });

  it("returns [] on error", async () => {
    supabase.setTableResponse("quotes", { data: null, error: { message: "boom" } });
    const { getQuotes } = await import("./quotes");
    expect(await getQuotes()).toEqual([]);
  });
});

describe("getQuoteById", () => {
  it("returns the single quote with line items", async () => {
    supabase.setTableResponse("quotes", {
      data: { id: "q1", quote_line_items: [] },
      error: null,
    });
    const { getQuoteById } = await import("./quotes");
    const result = await getQuoteById("q1");
    expect(result).toEqual({ id: "q1", quote_line_items: [] });
  });

  it("returns null when not found", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { getQuoteById } = await import("./quotes");
    expect(await getQuoteById("q1")).toBeNull();
  });
});

describe("getQuoteForProposal", () => {
  const QUOTE_UUID = "22222222-2222-4222-8222-222222222220";

  it("resolves a quote for an anonymous prospect holding the UUID", async () => {
    supabase.setTableResponse("quotes", {
      data: { id: QUOTE_UUID, quote_line_items: [] },
      error: null,
    });
    const { getQuoteForProposal } = await import("./quotes");
    const result = await getQuoteForProposal(QUOTE_UUID);
    expect(result).toEqual({ id: QUOTE_UUID, quote_line_items: [] });
  });

  it("rejects anything that is not a UUID without touching the database", async () => {
    const { getQuoteForProposal } = await import("./quotes");
    expect(await getQuoteForProposal("1 OR 1=1")).toBeNull();
    expect(supabase.callsFor("quotes")).toHaveLength(0);
  });

  it("returns null when the quote does not exist", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { getQuoteForProposal } = await import("./quotes");
    expect(await getQuoteForProposal(QUOTE_UUID)).toBeNull();
  });
});
