/**
 * Tests for the tab-title lookup helpers used by generateMetadata.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  vi.resetModules();
  supabase = createMockSupabase();
});

describe("entityTitle", () => {
  it("joins section and entity name with an em dash", async () => {
    const { entityTitle } = await import("./page-titles");
    expect(entityTitle("Live", "Samsung Galaxy Launch")).toBe(
      "Live — Samsung Galaxy Launch",
    );
  });

  it("falls back to the plain section when the name is null", async () => {
    const { entityTitle } = await import("./page-titles");
    expect(entityTitle("Live", null)).toBe("Live");
  });
});

describe("getEventNameForTitle", () => {
  it("returns the event name when the row resolves", async () => {
    supabase.setTableResponse("events", {
      data: { name: "Samsung Galaxy Launch" },
      error: null,
    });
    const { getEventNameForTitle } = await import("./page-titles");
    expect(await getEventNameForTitle("evt-1")).toBe("Samsung Galaxy Launch");
  });

  it("returns null when the event is missing or blocked by RLS", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { getEventNameForTitle } = await import("./page-titles");
    expect(await getEventNameForTitle("evt-404")).toBeNull();
  });
});

describe("getVenueNameForTitle", () => {
  it("returns the venue name for a known slug", async () => {
    supabase.setTableResponse("venues", {
      data: { name: "Westfield London" },
      error: null,
    });
    const { getVenueNameForTitle } = await import("./page-titles");
    expect(await getVenueNameForTitle("westfield-london")).toBe(
      "Westfield London",
    );
  });

  it("returns null for an unknown slug", async () => {
    supabase.setTableResponse("venues", { data: null, error: null });
    const { getVenueNameForTitle } = await import("./page-titles");
    expect(await getVenueNameForTitle("nope")).toBeNull();
  });
});

describe("getPartnerNameForTitle", () => {
  it("returns the partner name for a known slug", async () => {
    supabase.setTableResponse("partners", {
      data: { name: "Live Nation" },
      error: null,
    });
    const { getPartnerNameForTitle } = await import("./page-titles");
    expect(await getPartnerNameForTitle("live-nation")).toBe("Live Nation");
  });

  it("returns null on a query error", async () => {
    supabase.setTableResponse("partners", {
      data: null,
      error: { message: "boom" },
    });
    const { getPartnerNameForTitle } = await import("./page-titles");
    expect(await getPartnerNameForTitle("live-nation")).toBeNull();
  });
});
