/**
 * Tests for the lead-contact teammate invite logic.
 *
 * The security-critical contract: a same-domain colleague gets an instant
 * login, but anyone outside the lead contact's email domain (or an admin
 * invite) must NOT be provisioned directly — it routes to Bright.Blue.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const getUser = vi.fn();
const inviteCustomerUserInternal = vi.fn();
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
  requireInternalUser: vi.fn(),
}));
vi.mock("@/server/invites", () => ({
  inviteCustomerUserInternal: (...args: unknown[]) =>
    inviteCustomerUserInternal(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));

// The approval branch validates the routed event id with the team schema,
// so the mocked latest event uses a realistic UUID-shaped id.
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const LEAD = {
  id: "admin1",
  name: "Lead Contact",
  email: "lead@cocacola.com",
  avatarUrl: null,
  role: "customer_admin",
  accountId: "acc1",
  hasCompletedOnboarding: true,
};

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset().mockResolvedValue(LEAD);
  inviteCustomerUserInternal.mockReset().mockResolvedValue({ success: true });
  dispatchNotification.mockReset().mockResolvedValue(undefined);
});

describe("inviteTeammate", () => {
  it("instantly invites a same-domain colleague as a standard user", async () => {
    supabase.setTableResponse("profiles", { data: null, error: null });
    const { inviteTeammate } = await import("./team");
    const result = await inviteTeammate("colleague@cocacola.com");

    expect(result).toEqual({
      success: true,
      status: "invited",
      domain: "cocacola.com",
    });
    expect(inviteCustomerUserInternal).toHaveBeenCalledWith(
      "colleague@cocacola.com",
      "acc1",
      "customer_user",
    );
    // Same-domain path never needs to look up an event to route for approval.
    expect(supabase.callsFor("events").length).toBe(0);
  });

  it("does NOT instantly provision someone outside the company domain", async () => {
    supabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("events", { data: { id: EVENT_ID }, error: null });
    // Force the request-pipeline existing-check to short-circuit cleanly.
    supabase.setTableResponse("event_team_members", {
      data: { id: "tm1" },
      error: null,
    });
    const { inviteTeammate } = await import("./team");
    await inviteTeammate("agency@external-partner.com");

    expect(inviteCustomerUserInternal).not.toHaveBeenCalled();
    // It took the approval branch (which resolves the account's latest event).
    expect(supabase.callsFor("events").length).toBeGreaterThan(0);
  });

  it("does NOT instantly provision an admin-level invite, even same-domain", async () => {
    supabase.setTableResponse("profiles", { data: null, error: null });
    supabase.setTableResponse("events", { data: { id: EVENT_ID }, error: null });
    supabase.setTableResponse("event_team_members", {
      data: { id: "tm1" },
      error: null,
    });
    const { inviteTeammate } = await import("./team");
    await inviteTeammate("colleague@cocacola.com", true);

    expect(inviteCustomerUserInternal).not.toHaveBeenCalled();
    expect(supabase.callsFor("events").length).toBeGreaterThan(0);
  });

  it("blocks anyone who isn't the lead contact", async () => {
    getUser.mockResolvedValue({ ...LEAD, role: "customer_user" });
    const { inviteTeammate } = await import("./team");
    const result = await inviteTeammate("colleague@cocacola.com");

    expect(result.success).toBe(false);
    expect(inviteCustomerUserInternal).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const { inviteTeammate } = await import("./team");
    const result = await inviteTeammate("not-an-email");

    expect(result.success).toBe(false);
    expect(inviteCustomerUserInternal).not.toHaveBeenCalled();
  });

  it("rejects someone who already has a portal login", async () => {
    supabase.setTableResponse("profiles", { data: { id: "p1" }, error: null });
    const { inviteTeammate } = await import("./team");
    const result = await inviteTeammate("colleague@cocacola.com");

    expect(result.success).toBe(false);
    expect(inviteCustomerUserInternal).not.toHaveBeenCalled();
  });
});
