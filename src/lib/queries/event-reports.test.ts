/** Tests for event report read queries. */
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

describe("getEventReportByShareToken", () => {
  it("maps brand_partner_id to brandPartnerId on the share payload", async () => {
    supabase.setTableResponse("event_reports", {
      data: {
        id: "rep-1",
        event_id: "evt-1",
        report_type: "post_event",
        title: "Summer Festival",
        metrics_json: {},
        predictions_json: {},
        comparison_json: {},
        highlights_json: [],
        share_token: "tok-1",
        generated_at: "2026-08-01T00:00:00Z",
        is_published: true,
        published_at: "2026-08-02T00:00:00Z",
        brand_partner_id: "partner-9",
        created_at: "2026-08-01T00:00:00Z",
        updated_at: "2026-08-02T00:00:00Z",
      },
      error: null,
    });

    const { getEventReportByShareToken } = await import("./event-reports");
    const report = await getEventReportByShareToken("tok-1");

    expect(report).toMatchObject({
      id: "rep-1",
      title: "Summer Festival",
      brandPartnerId: "partner-9",
    });
  });
});
