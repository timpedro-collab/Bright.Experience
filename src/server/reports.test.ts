/**
 * Tests for report generation — capture-quality counters landing in
 * metrics_json (and staying absent when the guardrails never fired).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("@/lib/brightblue/client", () => ({
  getLiveSnapshot: vi.fn(async () => null),
  getPostShowReport: vi.fn(async () => null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

function seedHappyPath(telemetryCount: number) {
  supabase.setTableResponse("events", {
    data: { id: EVENT_ID, name: "Demo Expo", event_type: "trade-show", machine_type: "Bright.Vend Pro", account_id: "a1" },
    error: null,
  });
  supabase.setTableResponse("event_metrics_snapshot", {
    data: [
      { total_plays: 500, total_interactions: 650, total_leads: 475, total_prizes: 490, avg_dwell_time: 28 },
    ],
    error: null,
  });
  supabase.setTableResponse("telemetry_events", {
    data: null,
    error: null,
    count: telemetryCount,
  });
  supabase.setTableResponse("quotes", { data: null, error: null });
  supabase.setTableResponse("event_reports", {
    data: { id: "r1" },
    error: null,
  });
}

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("generateEventReportSystem", () => {
  it("includes capture-quality counts when guardrail telemetry exists", async () => {
    seedHappyPath(12);
    const { generateEventReportSystem } = await import("./reports");
    const result = await generateEventReportSystem(EVENT_ID);
    expect(result.success).toBe(true);

    const insert = supabase
      .callsFor("event_reports")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    const metrics = payload.metrics_json as Record<string, unknown>;
    expect(metrics.totalPlays).toBe(500);
    expect(metrics.captureQuality).toEqual({
      rejectedDomains: 12,
      duplicatesBlocked: 12,
    });
  });

  it("omits the capture-quality block when the guardrails never fired", async () => {
    seedHappyPath(0);
    const { generateEventReportSystem } = await import("./reports");
    const result = await generateEventReportSystem(EVENT_ID);
    expect(result.success).toBe(true);

    const insert = supabase
      .callsFor("event_reports")
      .find((c) => c.method === "insert");
    const metrics = (insert!.args[0] as Record<string, unknown>)
      .metrics_json as Record<string, unknown>;
    expect(metrics.captureQuality).toBeUndefined();
  });

  it("fails cleanly when the event does not exist", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { generateEventReportSystem } = await import("./reports");
    const result = await generateEventReportSystem("missing");
    expect(result.success).toBe(false);
  });
});
