/**
 * Integration tests for the notification dispatcher.
 *
 * The dispatcher orchestrates: archetype lookup → owner resolution →
 * preference filtering → in-portal insert → email send. We mock at the
 * boundary (Supabase + Resend) and let everything in between run.
 *
 * Two flows to lock down:
 *   1. Class A (action_required) → in-portal row is forced regardless
 *      of preferences. Email respects preferences with the "email_off
 *      override" applied at escalation level 2+.
 *   2. Class B (fyi) → both lanes respect preferences with no override.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

// Resend mock — capture every send for assertion.
const resendSend = vi.fn(async () => ({ id: "test-email-id" }));
vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: resendSend };
  },
}));

// Supabase mock that the dispatcher receives via `options.supabaseClient`.
let supabase: MockSupabase;
beforeEach(() => {
  supabase = createMockSupabase();
  resendSend.mockClear();
  // Force RESEND_API_KEY on so the dispatcher exercises the email path.
  process.env.RESEND_API_KEY = "test-resend-key";
});

describe("dispatchNotification — Class A (action_required)", () => {
  beforeEach(() => {
    // Seed an event so the customer_admins resolver finds an account.
    supabase.setTableResponse("events", {
      data: { account_id: "acc-1", created_by: "u-ae" },
      error: null,
    });
    // One customer_admin recipient.
    supabase.setTableResponse("profiles", {
      data: [
        {
          id: "u-cust",
          email: "cust@acme.test",
          name: "Casey",
          role: "customer_admin",
        },
      ],
      error: null,
    });
    // No stored preferences for this user/kind — dispatcher should
    // fall back to archetype defaults.
    supabase.setTableResponse("notification_preferences", { data: [], error: null });
    // Stub the notification insert to confirm it was called.
    supabase.setTableResponse("notifications", { data: null, error: null });
  });

  it("inserts an in-portal row for the resolved recipient", async () => {
    const { dispatchNotification } = await import("./dispatch");
    const notified = await dispatchNotification(
      "asset.upload_needed",
      { eventId: "evt-1", eventName: "Spring" },
      { supabaseClient: supabase }
    );
    expect(notified).toContain("u-cust");
    const calls = supabase.callsFor("notifications");
    const insertCall = calls.find((c) => c.method === "insert");
    expect(insertCall).toBeDefined();
    const rows = insertCall!.args[0] as Array<Record<string, unknown>>;
    expect(rows[0].user_id).toBe("u-cust");
    expect(rows[0].action_required).toBe(true);
    expect(rows[0].priority).toBe("high");
  });

  it("emails an email-only quote contact without writing an in-portal row", async () => {
    // proposal.delivered resolves via quote_contact — a prospect with no
    // profile. They must get the email, and the in-portal lane must skip
    // them (no profile row to FK a notification to).
    supabase.setTableResponse("quotes", {
      data: {
        id: "q1",
        contact_name: "Aisha Khan",
        contact_email: "aisha@samsung.example",
      },
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "proposal.delivered",
      { quoteId: "q1", eventName: "Samsung activation" },
      { supabaseClient: supabase }
    );
    const insertCall = supabase
      .callsFor("notifications")
      .find((c) => c.method === "insert");
    expect(insertCall).toBeUndefined();
    expect(resendSend).toHaveBeenCalledTimes(1);
    expect(resendSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: ["aisha@samsung.example"] })
    );
  });

  it("forces in-portal row even if user opted out (Class A guardrail)", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.upload_needed",
          in_portal: false,
          email_mode: "off",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    const notified = await dispatchNotification(
      "asset.upload_needed",
      { eventId: "evt-1", eventName: "Spring" },
      { supabaseClient: supabase }
    );
    expect(notified).toContain("u-cust");
  });

  it("respects email_mode=off without override (no email sent)", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.upload_needed",
          in_portal: true,
          email_mode: "off",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "asset.upload_needed",
      { eventId: "evt-1", eventName: "Spring" },
      { supabaseClient: supabase }
    );
    expect(resendSend).not.toHaveBeenCalled();
  });

  it("overrides email_mode=off when reminder.overrideEmailOff is true (Class A only)", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.upload_needed",
          in_portal: true,
          email_mode: "off",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "asset.upload_needed",
      { eventId: "evt-1", eventName: "Spring" },
      {
        supabaseClient: supabase,
        reminder: { isReminder: true, escalationLevel: 2, overrideEmailOff: true },
      }
    );
    expect(resendSend).toHaveBeenCalledTimes(1);
  });

  it("ccs the AE when reminder.ccEmails is provided", async () => {
    supabase.setTableResponse("notification_preferences", { data: [], error: null });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "asset.upload_needed",
      { eventId: "evt-1", eventName: "Spring" },
      {
        supabaseClient: supabase,
        reminder: {
          isReminder: true,
          escalationLevel: 2,
          overrideEmailOff: false,
          ccEmails: ["ae@brightblue.test"],
        },
      }
    );
    expect(resendSend).toHaveBeenCalledTimes(1);
    const firstCall = resendSend.mock.calls[0] as unknown as [
      { cc?: string[] },
    ];
    expect(firstCall[0].cc).toEqual(["ae@brightblue.test"]);
  });
});

describe("dispatchNotification — Class B (fyi)", () => {
  beforeEach(() => {
    supabase.setTableResponse("events", {
      data: { account_id: "acc-1", created_by: "u-ae" },
      error: null,
    });
    supabase.setTableResponse("profiles", {
      data: [
        {
          id: "u-cust",
          email: "cust@acme.test",
          name: "Casey",
          role: "customer_admin",
        },
      ],
      error: null,
    });
    supabase.setTableResponse("notifications", { data: null, error: null });
  });

  it("respects in_portal=false (no row inserted)", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.review_approved",
          in_portal: false,
          email_mode: "off",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    const notified = await dispatchNotification(
      "asset.review_approved",
      { eventId: "evt-1", eventName: "Spring", assetName: "hero.png" },
      { supabaseClient: supabase }
    );
    expect(notified).toEqual([]);
  });

  it("does not override email_mode=off for Class B even when reminder asks", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.review_approved",
          in_portal: true,
          email_mode: "off",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "asset.review_approved",
      { eventId: "evt-1", eventName: "Spring", assetName: "hero.png" },
      {
        supabaseClient: supabase,
        reminder: { isReminder: true, escalationLevel: 3, overrideEmailOff: true },
      }
    );
    expect(resendSend).not.toHaveBeenCalled();
  });

  it("skips email when email_mode=digest (digest cron will handle)", async () => {
    supabase.setTableResponse("notification_preferences", {
      data: [
        {
          user_id: "u-cust",
          kind: "asset.review_approved",
          in_portal: true,
          email_mode: "digest",
        },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    await dispatchNotification(
      "asset.review_approved",
      { eventId: "evt-1", eventName: "Spring", assetName: "hero.png" },
      { supabaseClient: supabase }
    );
    expect(resendSend).not.toHaveBeenCalled();
  });
});

describe("dispatchNotification — guardrails", () => {
  beforeEach(() => {
    supabase.setTableResponse("events", {
      data: { account_id: "acc-1", created_by: "u-ae" },
      error: null,
    });
    supabase.setTableResponse("notification_preferences", { data: [], error: null });
    supabase.setTableResponse("notifications", { data: null, error: null });
  });

  it("returns [] when archetype is unknown", async () => {
    const { dispatchNotification } = await import("./dispatch");
    const result = await dispatchNotification(
      "totally.not.real" as never,
      { eventId: "evt-1" },
      { supabaseClient: supabase }
    );
    expect(result).toEqual([]);
  });

  it("returns [] when no owners resolve", async () => {
    supabase.setTableResponse("profiles", { data: [], error: null });
    const { dispatchNotification } = await import("./dispatch");
    const result = await dispatchNotification(
      "asset.review_approved",
      { eventId: "evt-1" },
      { supabaseClient: supabase }
    );
    expect(result).toEqual([]);
  });

  it("strips the actor from self-notifications", async () => {
    supabase.setTableResponse("profiles", {
      data: [
        { id: "u-actor", email: "a@x", name: "Actor", role: "customer_admin" },
        { id: "u-other", email: "o@x", name: "Other", role: "customer_admin" },
      ],
      error: null,
    });
    const { dispatchNotification } = await import("./dispatch");
    const notified = await dispatchNotification(
      "asset.review_approved",
      { eventId: "evt-1", actorId: "u-actor", assetName: "x" },
      { supabaseClient: supabase }
    );
    expect(notified).not.toContain("u-actor");
    expect(notified).toContain("u-other");
  });

  it("survives a Supabase insert error without throwing", async () => {
    supabase.setTableResponse("profiles", {
      data: [
        { id: "u1", email: "u1@x", name: "U", role: "customer_admin" },
      ],
      error: null,
    });
    supabase.setTableResponse("notifications", {
      data: null,
      error: { message: "boom" },
    });
    const { dispatchNotification } = await import("./dispatch");
    await expect(
      dispatchNotification(
        "asset.upload_needed",
        { eventId: "evt-1", eventName: "Spring" },
        { supabaseClient: supabase }
      )
    ).resolves.not.toThrow();
  });
});
