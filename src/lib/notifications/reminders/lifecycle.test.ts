/**
 * Tests for the time-driven lifecycle nudges — the post-wrap rebook nudge
 * (invites customers back ~14 days after their event completed) and the
 * planning-month report re-send (resurfaces a published report when the
 * month the customer said they plan next year's events arrives). Each
 * nudge must fire exactly once per event and only when its preconditions
 * genuinely hold.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { createMockSupabase, type MockSupabase } from "@/test/supabase";
import type { ReminderClient } from "./client";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();

vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));

/** ISO date (YYYY-MM-DD) n days before today, UTC. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function client(): ReminderClient {
  return supabase as unknown as ReminderClient;
}

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset().mockResolvedValue([]);
});

describe("nudgePostWrapRebook", () => {
  it("fires once for an event that completed 14+ days ago", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-1",
          name: "Spring Launch",
          current_stage: "complete",
          event_date_start: daysAgo(22),
          event_date_end: daysAgo(20),
        },
      ],
      error: null,
    });
    // No prior notification row — the nudge has never been sent.
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePostWrapRebook } = await import("./lifecycle");
    const result = await nudgePostWrapRebook(client());

    expect(result.sent).toBe(1);
    expect(dispatchNotification).toHaveBeenCalledTimes(1);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "event.post_wrap_rebook",
      expect.objectContaining({
        eventId: "evt-1",
        eventName: "Spring Launch",
        entityType: "event",
        entityId: "evt-1",
      }),
      expect.objectContaining({ supabaseClient: supabase })
    );
  });

  it("does not fire twice for the same event", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-1",
          name: "Spring Launch",
          current_stage: "complete",
          event_date_start: daysAgo(30),
          event_date_end: daysAgo(28),
        },
      ],
      error: null,
    });
    // A notifications row for this event + kind already exists.
    supabase.setTableResponse("notifications", {
      data: { id: "notif-1" },
      error: null,
    });

    const { nudgePostWrapRebook } = await import("./lifecycle");
    const result = await nudgePostWrapRebook(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("does not fire for events still in delivery", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-2",
          name: "Autumn Roadshow",
          current_stage: "delivery",
          event_date_start: daysAgo(30),
          event_date_end: daysAgo(28),
        },
      ],
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePostWrapRebook } = await import("./lifecycle");
    const result = await nudgePostWrapRebook(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("does not fire for events that wrapped fewer than 14 days ago", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-3",
          name: "Summer Pop-up",
          current_stage: "complete",
          event_date_start: daysAgo(6),
          event_date_end: daysAgo(5),
        },
      ],
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePostWrapRebook } = await import("./lifecycle");
    const result = await nudgePostWrapRebook(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("anchors on event_date_start when event_date_end is null", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-4",
          name: "One-day Activation",
          current_stage: "complete",
          event_date_start: daysAgo(15),
          event_date_end: null,
        },
      ],
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePostWrapRebook } = await import("./lifecycle");
    const result = await nudgePostWrapRebook(client());

    expect(result.sent).toBe(1);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "event.post_wrap_rebook",
      expect.objectContaining({ eventId: "evt-4" }),
      expect.anything()
    );
  });
});

describe("nudgePlanningMonthReport", () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  /** A quote whose planning month is now, joined to its completed event. */
  function seedMatchingQuote(
    overrides: Partial<{ current_stage: string }> = {}
  ) {
    supabase.setTableResponse("quotes", {
      data: [
        {
          id: "q-1",
          event_id: "evt-1",
          planning_month: currentMonth,
          events: {
            id: "evt-1",
            name: "Spring Launch",
            current_stage: overrides.current_stage ?? "complete",
          },
        },
      ],
      error: null,
    });
  }

  it("fires for a matching planning month with a published report", async () => {
    seedMatchingQuote();
    supabase.setTableResponse("event_reports", {
      data: { id: "rep-1" },
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePlanningMonthReport } = await import("./lifecycle");
    const result = await nudgePlanningMonthReport(client());

    expect(result.sent).toBe(1);
    expect(dispatchNotification).toHaveBeenCalledTimes(1);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "report.planning_resend",
      expect.objectContaining({
        eventId: "evt-1",
        eventName: "Spring Launch",
        entityType: "event",
        entityId: "evt-1",
      }),
      expect.objectContaining({ supabaseClient: supabase })
    );
  });

  it("does not fire twice for the same event", async () => {
    seedMatchingQuote();
    supabase.setTableResponse("event_reports", {
      data: { id: "rep-1" },
      error: null,
    });
    // A notifications row for this event + kind already exists.
    supabase.setTableResponse("notifications", {
      data: { id: "notif-1" },
      error: null,
    });

    const { nudgePlanningMonthReport } = await import("./lifecycle");
    const result = await nudgePlanningMonthReport(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("does not fire when no published report exists", async () => {
    seedMatchingQuote();
    supabase.setTableResponse("event_reports", { data: null, error: null });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePlanningMonthReport } = await import("./lifecycle");
    const result = await nudgePlanningMonthReport(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("does not fire for events that haven't completed", async () => {
    seedMatchingQuote({ current_stage: "delivery" });
    supabase.setTableResponse("event_reports", {
      data: { id: "rep-1" },
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePlanningMonthReport } = await import("./lifecycle");
    const result = await nudgePlanningMonthReport(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("skips quotes that were never provisioned into an event", async () => {
    supabase.setTableResponse("quotes", {
      data: [
        { id: "q-2", event_id: null, planning_month: currentMonth, events: null },
      ],
      error: null,
    });
    supabase.setTableResponse("event_reports", {
      data: { id: "rep-1" },
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });

    const { nudgePlanningMonthReport } = await import("./lifecycle");
    const result = await nudgePlanningMonthReport(client());

    expect(result.sent).toBe(0);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});
