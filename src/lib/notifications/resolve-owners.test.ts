/**
 * Integration tests for the owner resolver. Drives every resolver
 * slug at least once and exercises the AE fallback path.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";
import { resolveOwners } from "./resolve-owners";
import { ARCHETYPES } from "./archetypes";

let supabase: MockSupabase;
beforeEach(() => {
  supabase = createMockSupabase();
});

describe("resolveOwners — customer_admins", () => {
  it("returns customer_admins for the event's account", async () => {
    supabase.setTableResponse("events", {
      data: { account_id: "acc-1", created_by: null },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: [
        { id: "u1", email: "u1@x", name: "U", role: "customer_admin" },
      ],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["briefing.needed"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe("customer_admin");
  });

  it("returns empty when the event has no account", async () => {
    supabase.setTableResponse("events", {
      data: { account_id: null, created_by: null },
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["briefing.needed"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toEqual([]);
  });
});

describe("resolveOwners — quote_contact", () => {
  it("returns the quote's contact as an email-only recipient", async () => {
    supabase.setTableResponse("quotes", {
      data: {
        id: "q1",
        contact_name: "Aisha Khan",
        contact_email: "aisha@samsung.example",
      },
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["proposal.delivered"],
      { quoteId: "q1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: "quote-contact:q1",
      email: "aisha@samsung.example",
      name: "Aisha Khan",
      emailOnly: true,
    });
  });

  it("returns empty without a quoteId or contact email", async () => {
    const noQuoteId = await resolveOwners(
      ARCHETYPES["proposal.delivered"],
      {},
      supabase
    );
    expect(noQuoteId).toEqual([]);

    supabase.setTableResponse("quotes", {
      data: { id: "q1", contact_name: "A", contact_email: null },
      error: null,
    });
    const noEmail = await resolveOwners(
      ARCHETYPES["proposal.delivered"],
      { quoteId: "q1" },
      supabase
    );
    expect(noEmail).toEqual([]);
  });
});

describe("resolveOwners — event_account_executive", () => {
  it("returns the events_lead AE when configured", async () => {
    supabase.setTableResponse("events", {
      data: { account_id: "acc-1", created_by: "u-ae" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { id: "u-ae", email: "ae@x", name: "AE", role: "events_lead" },
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["proposal.intake_received"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("u-ae");
  });

  it("falls back to the team inbox when nobody is found", async () => {
    supabase.setTableResponse("events", {
      data: { account_id: null, created_by: null },
      error: null,
    });
    supabase.setTableResponse("profiles", { data: [], error: null });
    const out = await resolveOwners(
      ARCHETYPES["proposal.intake_received"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].isFallbackTeamInbox).toBe(true);
  });
});

describe("resolveOwners — event_creative_lead", () => {
  it("returns creative_lead profiles when any are active", async () => {
    supabase.setTableResponse("profiles", {
      data: [
        { id: "u-c1", email: "c1@x", name: "C1", role: "creative_lead" },
        { id: "u-e1", email: "e1@x", name: "E1", role: "events_lead" },
      ],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["asset.review_needed"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out.map((r) => r.id).sort()).toEqual(["u-c1", "u-e1"]);
  });

  it("falls back to the studio inbox when no creatives exist", async () => {
    supabase.setTableResponse("profiles", { data: [], error: null });
    const out = await resolveOwners(
      ARCHETYPES["asset.review_needed"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].isFallbackTeamInbox).toBe(true);
  });
});

describe("resolveOwners — task_assignee", () => {
  it("returns the assigned profile when one exists", async () => {
    supabase.setTableResponse("tasks", {
      data: { assigned_to: "u-ae" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: { id: "u-ae", email: "ae@x", name: "AE", role: "events_lead" },
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["task.assigned"],
      { taskId: "t-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("u-ae");
  });

  it("returns empty when task lookup fails", async () => {
    supabase.setTableResponse("tasks", { data: null, error: null });
    const out = await resolveOwners(
      ARCHETYPES["task.assigned"],
      { taskId: "t-1" },
      supabase
    );
    expect(out).toEqual([]);
  });

  it("returns empty when no taskId in context", async () => {
    const out = await resolveOwners(ARCHETYPES["task.assigned"], {}, supabase);
    expect(out).toEqual([]);
  });
});

describe("resolveOwners — show_organizer", () => {
  it("returns the organizer's users alongside the internal show owner", async () => {
    supabase.setTableResponse("events", {
      data: { organizer_partner_id: "p-1" },
      error: null,
    });
    supabase.queueTableResponses("profiles", [
      {
        data: [{ id: "u-org", email: "org@x", name: "Org", role: "partner_admin" }],
        error: null,
      },
      {
        data: [{ id: "u-el", email: "el@x", name: "EL", role: "events_lead" }],
        error: null,
      },
    ]);
    const out = await resolveOwners(
      ARCHETYPES["sponsor.interest_received"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out.map((r) => r.id)).toEqual(["u-org", "u-el"]);
  });

  it("still reaches the team inbox for a show with no organizer users yet", async () => {
    supabase.setTableResponse("events", {
      data: { organizer_partner_id: null },
      error: null,
    });
    supabase.setTableResponse("profiles", { data: [], error: null });
    const out = await resolveOwners(
      ARCHETYPES["sponsor.interest_received"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(1);
    expect(out[0].isFallbackTeamInbox).toBe(true);
  });

  it("returns empty without an event to hang the show on", async () => {
    const out = await resolveOwners(
      ARCHETYPES["sponsor.interest_received"],
      {},
      supabase
    );
    expect(out).toEqual([]);
  });
});

describe("resolveOwners — venue_operator", () => {
  it("returns the users of the partner that owns the venue", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { placements: { venues: { partner_id: "p-1" } } },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: [{ id: "u-v", email: "v@x", name: "V", role: "partner_admin" }],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["sponsor.slot_requested"],
      { slotId: "slot-1" },
      supabase
    );
    expect(out.map((r) => r.id)).toEqual(["u-v"]);
  });

  it("routes demand on an unclaimed venue to the internal team", async () => {
    supabase.setTableResponse("sponsorship_slots", {
      data: { placements: { venues: { partner_id: null } } },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: [{ id: "u-el", email: "el@x", name: "EL", role: "events_lead" }],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["sponsor.slot_requested"],
      { slotId: "slot-1" },
      supabase
    );
    expect(out.map((r) => r.id)).toEqual(["u-el"]);
  });
});

describe("resolveOwners — internal_admins", () => {
  it("returns admins without needing any entity context", async () => {
    supabase.setTableResponse("profiles", {
      data: [{ id: "u-a", email: "a@x", name: "A", role: "admin" }],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["partner.application_received"],
      {},
      supabase
    );
    expect(out.map((r) => r.id)).toEqual(["u-a"]);
  });

  it("falls back to the team inbox when no admin profile exists", async () => {
    supabase.setTableResponse("profiles", { data: [], error: null });
    const out = await resolveOwners(
      ARCHETYPES["partner.application_received"],
      {},
      supabase
    );
    expect(out[0].isFallbackTeamInbox).toBe(true);
  });
});

describe("resolveOwners — event_members_internal", () => {
  it("fetches all internal roles", async () => {
    supabase.setTableResponse("profiles", {
      data: [
        { id: "u1", email: "u1@x", name: "U1", role: "events_lead" },
        { id: "u2", email: "u2@x", name: "U2", role: "creative_lead" },
      ],
      error: null,
    });
    const out = await resolveOwners(
      ARCHETYPES["approval.approved"],
      { eventId: "evt-1" },
      supabase
    );
    expect(out).toHaveLength(2);
  });
});
