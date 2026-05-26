/**
 * Tests for the quote query helpers (read side).
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
