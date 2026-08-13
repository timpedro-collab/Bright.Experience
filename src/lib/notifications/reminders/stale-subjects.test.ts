/**
 * Tests for the stale-subject finders that feed the reminder cron —
 * focused on the proposal-track chases, which route to the quote's
 * contact email rather than a portal user.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";
import { findStaleSubjects } from "./stale-subjects";

let supabase: MockSupabase;
beforeEach(() => {
  supabase = createMockSupabase();
});

describe("findStaleSubjects — proposal.walkthrough_missed", () => {
  it("surfaces booked walkthroughs whose slot passed without completion", async () => {
    supabase.setTableResponse("quotes", {
      data: [
        {
          id: "q1",
          contact_name: "Aisha Khan",
          company_name: "Samsung",
          walkthrough_scheduled_at: "2026-08-10T14:00:00Z",
          walkthrough_completed_at: null,
          status: "proposal_sent",
        },
      ],
      error: null,
    });
    const subjects = await findStaleSubjects(
      supabase,
      "proposal.walkthrough_missed"
    );
    expect(subjects).toHaveLength(1);
    expect(subjects[0]).toMatchObject({
      subjectType: "quote",
      subjectId: "q1",
      anchor: "2026-08-10T14:00:00Z",
      context: expect.objectContaining({
        quoteId: "q1",
        contactName: "Aisha Khan",
        eventName: "Samsung",
      }),
    });
  });

  it("queries only live proposal statuses with a passed, uncompleted slot", async () => {
    supabase.setTableResponse("quotes", { data: [], error: null });
    await findStaleSubjects(supabase, "proposal.walkthrough_missed");
    const calls = supabase.callsFor("quotes");
    expect(
      calls.some(
        (c) =>
          c.method === "in" &&
          c.args[0] === "status" &&
          JSON.stringify(c.args[1]) ===
            JSON.stringify(["submitted", "proposal_sent"])
      )
    ).toBe(true);
    expect(
      calls.some(
        (c) => c.method === "is" && c.args[0] === "walkthrough_completed_at"
      )
    ).toBe(true);
    expect(
      calls.some(
        (c) => c.method === "lt" && c.args[0] === "walkthrough_scheduled_at"
      )
    ).toBe(true);
  });
});

describe("findStaleSubjects — proposal.delivered", () => {
  it("provides the quoteId the quote_contact resolver needs", async () => {
    supabase.setTableResponse("quotes", {
      data: [
        {
          id: "q2",
          contact_name: "Tom Ellery",
          company_name: "Gymshark",
          updated_at: "2026-08-01T09:00:00Z",
        },
      ],
      error: null,
    });
    const subjects = await findStaleSubjects(supabase, "proposal.delivered");
    expect(subjects).toHaveLength(1);
    expect(subjects[0].context.quoteId).toBe("q2");
    expect(subjects[0].context.eventName).toBe("Gymshark");
  });
});
