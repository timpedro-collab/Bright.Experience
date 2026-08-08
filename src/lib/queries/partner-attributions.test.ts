/** Tests for partner attribution reads and sourced-inquiry rollups. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  vi.resetModules();
});

const REF = new Date("2026-08-08T12:00:00Z");

describe("summarizePartnerSourcedInquiries", () => {
  it("counts total and current-quarter attributions", async () => {
    const { summarizePartnerSourcedInquiries } = await import("./partner-attributions");
    const summary = summarizePartnerSourcedInquiries(
      [
        { created_at: "2026-07-15T09:00:00Z" },
        { created_at: "2026-08-01T09:00:00Z" },
        { created_at: "2026-04-10T09:00:00Z" },
      ],
      REF
    );
    expect(summary).toEqual({ total: 3, thisQuarter: 2 });
  });

  it("returns zeros for an empty book", async () => {
    const { summarizePartnerSourcedInquiries } = await import("./partner-attributions");
    expect(summarizePartnerSourcedInquiries([], REF)).toEqual({
      total: 0,
      thisQuarter: 0,
    });
  });
});

describe("getPartnerSourcedSummary", () => {
  it("returns sourced counts for a partner", async () => {
    supabase.setTableResponse("partner_attributions", {
      data: [
        { created_at: "2026-08-01T09:00:00Z" },
        { created_at: "2026-01-05T09:00:00Z" },
      ],
      error: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(REF);

    const { getPartnerSourcedSummary } = await import("./partner-attributions");
    expect(await getPartnerSourcedSummary("partner-1")).toEqual({
      total: 2,
      thisQuarter: 1,
    });

    vi.useRealTimers();
  });

  it("returns zeros when the read fails", async () => {
    supabase.setTableResponse("partner_attributions", {
      data: null,
      error: { message: "permission denied" },
    });

    const { getPartnerSourcedSummary } = await import("./partner-attributions");
    expect(await getPartnerSourcedSummary("partner-1")).toEqual({
      total: 0,
      thisQuarter: 0,
    });
  });
});
