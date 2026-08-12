/** Tests for the loop-pulse dashboard reads. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabase,
}));

const HOUR = 3_600_000;
const t0 = new Date("2026-08-01T09:00:00Z");
const iso = (offsetMs: number) => new Date(t0.getTime() + offsetMs).toISOString();

beforeEach(() => {
  supabase = createMockSupabase();
  supabase.setDefaultResponse({ data: [], error: null, count: 0 });
});

describe("getLoopPulse", () => {
  it("assembles every loop metric from the raw reads", async () => {
    // quotes are read three times, in this order: accepted, rebook count, referrals.
    supabase.queueTableResponses("quotes", [
      {
        data: [
          {
            accepted_at: iso(0),
            event_id: "e1",
            events: { created_at: iso(4 * HOUR) },
          },
          {
            accepted_at: iso(0),
            event_id: "e2",
            events: { created_at: iso(8 * HOUR) },
          },
          { accepted_at: iso(0), event_id: null, events: null },
        ],
        error: null,
      },
      { data: null, error: null, count: 3 },
      {
        data: [
          { referral_source: "Saw it at an event" },
          { referral_source: "Saw it at an event" },
          { referral_source: "Referral" },
        ],
        error: null,
      },
    ]);

    supabase.setTableResponse("event_reports", {
      data: null,
      error: null,
      count: 4,
    });

    // loop_events is read four times: report views, landings, player-card count, proposal views.
    supabase.queueTableResponses("loop_events", [
      {
        data: [{ event_id: "e1" }, { event_id: "e1" }, { event_id: "e2" }],
        error: null,
      },
      {
        data: [{ artifact: "report" }, { artifact: "report" }, { artifact: "live" }],
        error: null,
      },
      { data: null, error: null, count: 10 },
      {
        data: [
          { metadata: { quoteId: "q1", status: "proposal_sent" } },
          { metadata: { quoteId: "q1", status: "proposal_sent" } },
          { metadata: { quoteId: "q2", status: "accepted" } },
        ],
        error: null,
      },
    ]);

    supabase.setTableResponse("events", {
      data: [
        { account_id: "a1", stage: "complete" },
        { account_id: "a1", stage: "confirmed" },
        { account_id: "a2", stage: "complete" },
        { account_id: "a3", stage: "confirmed" },
      ],
      error: null,
    });

    supabase.setTableResponse("event_metrics_snapshot", {
      data: [
        { total_plays: 800, total_leads: 200 },
        { total_plays: 200, total_leads: 50 },
      ],
      error: null,
    });

    const { getLoopPulse } = await import("./loop-pulse");
    const pulse = await getLoopPulse();

    expect(pulse.provisioning).toEqual({
      medianHours: 6,
      provisionedCount: 2,
      unprovisionedCount: 1,
    });

    expect(pulse.reports).toEqual({
      publishedCount: 4,
      viewedEventCount: 2,
      viewRatePct: 50,
    });

    // a1 completed and booked twice → rebooked; a2 completed once → not.
    expect(pulse.rebook).toEqual({
      accountsWithCompleted: 2,
      accountsRebooked: 1,
      ratePct: 50,
      rebookQuoteCount: 3,
    });

    const report = pulse.invitations.find((r) => r.artifact === "report")!;
    expect(report.landings).toBe(2);
    expect(report.views).toBe(3);
    expect(report.ctrPct).toBe(67);
    const playerCard = pulse.invitations.find(
      (r) => r.artifact === "player_card",
    )!;
    expect(playerCard.views).toBe(10);

    expect(pulse.capture).toEqual({
      totalPlays: 1000,
      totalLeads: 250,
      ratePct: 25,
    });

    expect(pulse.referrals).toEqual([
      { source: "Saw it at an event", count: 2 },
      { source: "Referral", count: 1 },
    ]);

    expect(pulse.proposals).toEqual({
      views: 3,
      distinctProposals: 2,
    });
  });

  it("degrades to empty metrics when nothing has happened yet", async () => {
    const { getLoopPulse } = await import("./loop-pulse");
    const pulse = await getLoopPulse();

    expect(pulse.provisioning.medianHours).toBeNull();
    expect(pulse.reports.viewRatePct).toBeNull();
    expect(pulse.rebook.ratePct).toBeNull();
    expect(pulse.capture.ratePct).toBeNull();
    expect(pulse.referrals).toEqual([]);
    expect(pulse.proposals).toEqual({ views: 0, distinctProposals: 0 });
  });
});
