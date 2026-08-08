/**
 * Tests for the quote / proposal lifecycle server actions.
 *
 * The two-track quoting engine has six public actions; we cover the
 * happy path + the canonical error path for each.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const sendProposalIntakeNotification = vi.fn();
const sendProposalReadyEmail = vi.fn();
const sendBookingConfirmationEmail = vi.fn();
const dispatchNotification = vi.fn();
const recordAttribution = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
// Public quote surfaces write via the service-role client (anon RLS gives
// them nothing) — point it at the same recorder.
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/lib/email", () => ({
  sendProposalIntakeNotification: (...args: unknown[]) =>
    sendProposalIntakeNotification(...args),
  sendProposalReadyEmail: (...args: unknown[]) => sendProposalReadyEmail(...args),
  sendBookingConfirmationEmail: (...args: unknown[]) =>
    sendBookingConfirmationEmail(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/app/actions/partners", () => ({
  recordAttribution: (...args: unknown[]) => recordAttribution(...args),
}));

const PKG_UUID = "00000000-0000-4000-8000-000000000099";

/**
 * Run a block as a specific caller IP. The rate-limit bucket is module-level
 * state shared by every test in this file, so anything that submits more than
 * once needs its own address or it starves a later test.
 */
async function withClientIp<T>(ip: string, run: () => Promise<T>): Promise<T> {
  const { headers } = await import("next/headers");
  const mocked = vi.mocked(headers);
  mocked.mockResolvedValue(new Headers({ "x-forwarded-for": ip }));
  try {
    return await run();
  } finally {
    mocked.mockResolvedValue(new Headers());
  }
}

/** Convenience: seed the packages table with a bookable row so the
 *  `submitBookNowQuote` server-side re-read passes. */
function seedBookablePackage(id = PKG_UUID, basePrice = 100_000) {
  supabase.setTableResponse("packages", {
    data: {
      id,
      name: "Test package",
      base_price: basePrice,
      is_bookable: true,
      package_addons: [
        {
          id: "a1",
          name: "Live telemetry",
          price: 10_000,
          capability_slug: "live-telemetry",
        },
        {
          id: "a2",
          name: "Survey layer",
          price: 5_000,
          capability_slug: "survey-layer",
        },
      ],
    },
    error: null,
  });
}

beforeEach(() => {
  supabase = createMockSupabase();
  sendProposalIntakeNotification.mockReset().mockResolvedValue(undefined);
  sendProposalReadyEmail.mockReset().mockResolvedValue(undefined);
  sendBookingConfirmationEmail.mockReset().mockResolvedValue(undefined);
  dispatchNotification.mockReset();
  recordAttribution.mockReset().mockResolvedValue({ success: true, data: { id: "att" } });
  getUser.mockReset().mockResolvedValue({
    id: "u1",
    name: "Commercial Lead",
    email: "lead@bright.test",
    avatarUrl: null,
    role: "events_lead",
    accountId: null,
    hasCompletedOnboarding: true,
  });
});

describe("submitBookNowQuote", () => {
  it("inserts a quote with track=book_now and returns the id + total", async () => {
    seedBookablePackage(PKG_UUID, 100_000);
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: PKG_UUID,
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("q1");
      expect(result.data.totalAmount).toBe(100_000);
    }
    const insertCall = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    expect((insertCall!.args[0] as { track: string }).track).toBe("book_now");
  });

  it("emails the buyer their own confirmation", async () => {
    // Distinct IP so these extra submissions don't drain the shared bucket.
    await withClientIp("203.0.113.60", async () => {
      seedBookablePackage(PKG_UUID, 100_000);
      supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
      const { submitBookNowQuote } = await import("./quotes");
      await submitBookNowQuote({
        packageId: PKG_UUID,
        contactName: "Casey",
        contactEmail: "casey@acme.test",
        companyName: "Acme",
        eventDateStart: "2026-09-01",
      });
    });

    expect(sendBookingConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        contactEmail: "casey@acme.test",
        packageName: "Test package",
        totalAmount: 100_000,
        receiptUrl: expect.stringContaining("/book/confirmation/q1"),
      })
    );
  });

  it("still records the booking when the confirmation email fails", async () => {
    const result = await withClientIp("203.0.113.61", async () => {
      seedBookablePackage(PKG_UUID, 100_000);
      supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
      sendBookingConfirmationEmail.mockRejectedValue(new Error("smtp down"));
      const { submitBookNowQuote } = await import("./quotes");
      return submitBookNowQuote({
        packageId: PKG_UUID,
        contactName: "Casey",
        contactEmail: "casey@acme.test",
      });
    });

    expect(result.success).toBe(true);
  });

  it("rejects a non-bookable / missing package", async () => {
    supabase.setTableResponse("packages", { data: null, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: "00000000-0000-4000-8000-000000000000",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(false);
  });

  it("returns failure on insert error", async () => {
    seedBookablePackage();
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: PKG_UUID,
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(false);
  });

  it("sanitises addons before insert and prices only known capabilities", async () => {
    seedBookablePackage(PKG_UUID, 100_000);
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: PKG_UUID,
      contactName: "Casey",
      contactEmail: "casey@acme.test",
      addons: ["live-telemetry", "garbage", "survey-layer"],
    });
    const insertCall = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    const row = insertCall!.args[0] as { addons: string[]; total_amount: number };
    expect(row.addons).toEqual(["live-telemetry", "survey-layer"]);
    // 100_000 base + 10_000 (live-telemetry) + 5_000 (survey-layer)
    expect(row.total_amount).toBe(115_000);
    expect(result.success).toBe(true);
  });

  it("dispatches booking.received once the row is in", async () => {
    seedBookablePackage();
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    await submitBookNowQuote({
      packageId: PKG_UUID,
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "booking.received",
      expect.objectContaining({ quoteId: "q1", contactName: "Casey" })
    );
  });

  it("does not blow up if the booking notification fails", async () => {
    seedBookablePackage();
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    dispatchNotification.mockRejectedValueOnce(new Error("queue down"));
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: PKG_UUID,
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(true);
  });
});

describe("submitProposalIntake", () => {
  it("inserts a proposal quote and notifies the AE", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitProposalIntake } = await import("./quotes");
    const result = await submitProposalIntake({
      eventType: "trade-show",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "proposal.intake_received",
      expect.objectContaining({ quoteId: "q1" })
    );
    expect(sendProposalIntakeNotification).toHaveBeenCalled();
  });

  it("returns failure on insert error", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { submitProposalIntake } = await import("./quotes");
    const result = await submitProposalIntake({
      eventType: "trade-show",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("does not blow up when the AE handoff email fails", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    sendProposalIntakeNotification.mockRejectedValue(new Error("smtp down"));
    const { submitProposalIntake } = await import("./quotes");
    const result = await submitProposalIntake({
      eventType: "trade-show",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    // Action still succeeds because the email is fire-and-forget
    expect(result.success).toBe(true);
  });

  it("persists the campaign name and planning month on the quote", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitProposalIntake } = await import("./quotes");
    const result = await withClientIp("10.9.0.1", () =>
      submitProposalIntake({
        eventType: "trade-show",
        contactName: "Casey",
        contactEmail: "casey@acme.test",
        campaignName: "  Spring launch roadshow  ",
        planningMonth: "2027-01",
        referralSource: "  social  ",
      })
    );
    expect(result.success).toBe(true);
    const insert = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    const row = insert!.args[0] as Record<string, unknown>;
    expect(row.campaign_name).toBe("Spring launch roadshow");
    expect(row.planning_month).toBe("2027-01");
    expect(row.referral_source).toBe("social");
  });

  it("drops a malformed planning month rather than storing junk", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitProposalIntake } = await import("./quotes");
    const result = await withClientIp("10.9.0.2", () =>
      submitProposalIntake({
        eventType: "trade-show",
        contactName: "Casey",
        contactEmail: "casey@acme.test",
        planningMonth: "January next year",
      })
    );
    expect(result.success).toBe(true);
    const insert = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    const row = insert!.args[0] as Record<string, unknown>;
    expect(row.planning_month).toBeNull();
    expect(row.campaign_name).toBeNull();
  });
});

describe("updateQuoteCapabilities", () => {
  it("sanitises and updates", async () => {
    supabase.setTableResponse("quotes", { data: [{ id: "q1" }], error: null });
    const { updateQuoteCapabilities } = await import("./quotes");
    const result = await updateQuoteCapabilities("q1", [
      "live-telemetry",
      "garbage",
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.addons).toEqual(["live-telemetry"]);
    }
  });

  it("returns failure on update error", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "denied" },
    });
    const { updateQuoteCapabilities } = await import("./quotes");
    const result = await updateQuoteCapabilities("q1", ["live-telemetry"]);
    expect(result.success).toBe(false);
  });

  it("rejects a quote no longer in an adjustable status", async () => {
    // Status pin matched no rows — e.g. the quote was declined meanwhile.
    supabase.setTableResponse("quotes", { data: [], error: null });
    const { updateQuoteCapabilities } = await import("./quotes");
    const result = await updateQuoteCapabilities("q1", ["live-telemetry"]);
    expect(result.success).toBe(false);
  });
});

/** Queue one accept cycle: the status pre-read, then the pinned update. */
function queueAcceptCycle(times = 1) {
  const preRead = {
    data: {
      status: "proposal_sent",
      expires_at: null,
      contact_name: "Casey",
      company_name: "Acme",
    },
    error: null,
  };
  const update = { data: [{ id: "q1" }], error: null };
  supabase.queueTableResponses(
    "quotes",
    Array.from({ length: times }, () => [preRead, update]).flat()
  );
}

describe("acceptQuote", () => {
  it("updates status to accepted and dispatches quote.accepted", async () => {
    queueAcceptCycle();
    const { acceptQuote } = await import("./quotes");
    const result = await acceptQuote("q1");
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "quote.accepted",
      expect.objectContaining({ quoteId: "q1", contactName: "Casey" })
    );
  });

  it("rejects a proposal that is not open (wrong status)", async () => {
    supabase.setTableResponse("quotes", {
      data: { status: "declined", expires_at: null },
      error: null,
    });
    const { acceptQuote } = await import("./quotes");
    const result = await acceptQuote("q1");
    expect(result.success).toBe(false);
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("rejects a proposal past its expiry even though the link still works", async () => {
    supabase.setTableResponse("quotes", {
      data: { status: "proposal_sent", expires_at: "2020-01-01T00:00:00Z" },
      error: null,
    });
    const { acceptQuote } = await import("./quotes");
    const result = await acceptQuote("q1");
    expect(result.success).toBe(false);
  });

  it("returns failure on update error", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { acceptQuote } = await import("./quotes");
    const result = await acceptQuote("q1");
    expect(result.success).toBe(false);
  });

  it("rate-limits a burst of public decisions from one connection", async () => {
    // Distinct IP so this burst doesn't drain the shared test bucket.
    const { headers } = await import("next/headers");
    const mocked = vi.mocked(headers);
    mocked.mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.42" }));
    try {
      queueAcceptCycle(11);
      const { acceptQuote } = await import("./quotes");
      const results = [];
      for (let i = 0; i < 11; i++) {
        results.push(await acceptQuote("q1"));
      }
      expect(results.slice(0, 10).every((r) => r.success)).toBe(true);
      expect(results[10].success).toBe(false);
      if (!results[10].success) {
        expect(results[10].error).toMatch(/Too many/);
      }
    } finally {
      mocked.mockResolvedValue(new Headers());
    }
  });
});

describe("declineQuote", () => {
  it("updates status to declined", async () => {
    supabase.setTableResponse("quotes", { data: [{ id: "q1" }], error: null });
    const { declineQuote } = await import("./quotes");
    const result = await declineQuote("q1");
    expect(result.success).toBe(true);
  });

  it("rejects a proposal that is not open", async () => {
    supabase.setTableResponse("quotes", { data: [], error: null });
    const { declineQuote } = await import("./quotes");
    const result = await declineQuote("q1");
    expect(result.success).toBe(false);
  });

  it("returns failure on error", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { declineQuote } = await import("./quotes");
    const result = await declineQuote("q1");
    expect(result.success).toBe(false);
  });
});

describe("prepareProposal", () => {
  it("inserts line items and updates the quote total", async () => {
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [
        { label: "Hardware", amount: 200_000 },
        { label: "Logistics", amount: 50_000 },
      ],
    });
    expect(result.success).toBe(true);
    const updateCall = supabase
      .callsFor("quotes")
      .find((c) => c.method === "update");
    expect(updateCall).toBeDefined();
    const row = updateCall!.args[0] as Record<string, unknown>;
    expect(row.total_amount).toBe(250_000);
    expect(row.status).toBe("proposal_sent");
  });

  it("emails the customer the proposal link once the status flips", async () => {
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", {
      data: {
        contact_name: "Aisha Khan",
        contact_email: "aisha@samsung.example",
        company_name: "Samsung",
        event_type: "activation",
        walkthrough_url: null,
      },
      error: null,
    });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "Hardware", amount: 1 }],
    });
    expect(result.success).toBe(true);
    expect(sendProposalReadyEmail).toHaveBeenCalledTimes(1);
    const arg = sendProposalReadyEmail.mock.calls[0][0] as {
      contactEmail: string;
      proposalUrl: string;
    };
    expect(arg.contactEmail).toBe("aisha@samsung.example");
    expect(arg.proposalUrl).toContain("/proposal/q1");
  });

  it("confirms the booked call in the email when a walkthrough is scheduled", async () => {
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", {
      data: {
        contact_name: "Aisha Khan",
        contact_email: "aisha@samsung.example",
        company_name: "Samsung",
        event_type: "activation",
        walkthrough_url: null,
        walkthrough_scheduled_at: "2026-07-02T13:00:00Z",
        walkthrough_slot_label: "Thu 2 Jul · 2:00 PM",
      },
      error: null,
    });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "Hardware", amount: 1 }],
    });
    expect(result.success).toBe(true);
    const arg = sendProposalReadyEmail.mock.calls[0][0] as {
      scheduledSlotLabel?: string | null;
    };
    expect(arg.scheduledSlotLabel).toBe("Thu 2 Jul · 2:00 PM");
  });

  it("invites the customer to book when no walkthrough is scheduled", async () => {
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", {
      data: {
        contact_name: "Aisha Khan",
        contact_email: "aisha@samsung.example",
        company_name: "Samsung",
        event_type: "activation",
        walkthrough_url: null,
        walkthrough_scheduled_at: null,
        walkthrough_slot_label: null,
      },
      error: null,
    });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "Hardware", amount: 1 }],
    });
    expect(result.success).toBe(true);
    const arg = sendProposalReadyEmail.mock.calls[0][0] as {
      scheduledSlotLabel?: string | null;
    };
    expect(arg.scheduledSlotLabel).toBeNull();
  });

  it("does not email when the quote has no contact email", async () => {
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "Hardware", amount: 1 }],
    });
    expect(result.success).toBe(true);
    expect(sendProposalReadyEmail).not.toHaveBeenCalled();
  });

  it("rejects a caller without commercial access", async () => {
    getUser.mockResolvedValue({
      id: "cust",
      name: "Customer",
      email: "c@acme.test",
      avatarUrl: null,
      role: "customer_admin",
      accountId: "acc-1",
      hasCompletedOnboarding: true,
    });
    supabase.setTableResponse("quote_line_items", { data: null, error: null });
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "Hardware", amount: 1 }],
    });
    expect(result.success).toBe(false);
    expect(supabase.callsFor("quotes").find((c) => c.method === "update")).toBeUndefined();
    expect(sendProposalReadyEmail).not.toHaveBeenCalled();
  });

  it("returns failure on line-item insert error", async () => {
    supabase.setTableResponse("quote_line_items", {
      data: null,
      error: { message: "boom" },
    });
    const { prepareProposal } = await import("./quotes");
    const result = await prepareProposal("q1", {
      lineItems: [{ label: "x", amount: 1 }],
    });
    expect(result.success).toBe(false);
  });
});
