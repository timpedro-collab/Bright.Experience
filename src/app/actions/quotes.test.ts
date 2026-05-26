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
const dispatchNotification = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/email", () => ({
  sendProposalIntakeNotification: (...args: unknown[]) =>
    sendProposalIntakeNotification(...args),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  sendProposalIntakeNotification.mockReset().mockResolvedValue(undefined);
  dispatchNotification.mockReset();
});

describe("submitBookNowQuote", () => {
  it("inserts a quote with track=book_now and returns the id", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: "p1",
      contactName: "Casey",
      contactEmail: "casey@x",
    });
    expect(result).toEqual({ success: true, data: { id: "q1" } });
    const insertCall = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    expect((insertCall!.args[0] as { track: string }).track).toBe("book_now");
  });

  it("returns failure on insert error", async () => {
    supabase.setTableResponse("quotes", {
      data: null,
      error: { message: "boom" },
    });
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: "p1",
      contactName: "Casey",
      contactEmail: "casey@x",
    });
    expect(result.success).toBe(false);
  });

  it("sanitises addons before insert", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    await submitBookNowQuote({
      packageId: "p1",
      contactName: "Casey",
      contactEmail: "casey@x",
      addons: ["live-telemetry", "garbage", "survey-layer"],
    });
    const insertCall = supabase
      .callsFor("quotes")
      .find((c) => c.method === "insert");
    const row = insertCall!.args[0] as { addons: string[] };
    expect(row.addons).toEqual(["live-telemetry", "survey-layer"]);
  });

  it("dispatches booking.received once the row is in", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    const { submitBookNowQuote } = await import("./quotes");
    await submitBookNowQuote({
      packageId: "p1",
      contactName: "Casey",
      contactEmail: "casey@x",
    });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "booking.received",
      expect.objectContaining({ quoteId: "q1", contactName: "Casey" })
    );
  });

  it("does not blow up if the booking notification fails", async () => {
    supabase.setTableResponse("quotes", { data: { id: "q1" }, error: null });
    dispatchNotification.mockRejectedValueOnce(new Error("queue down"));
    const { submitBookNowQuote } = await import("./quotes");
    const result = await submitBookNowQuote({
      packageId: "p1",
      contactName: "Casey",
      contactEmail: "casey@x",
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
      contactEmail: "casey@x",
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
      contactEmail: "casey@x",
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
      contactEmail: "casey@x",
    });
    // Action still succeeds because the email is fire-and-forget
    expect(result.success).toBe(true);
  });
});

describe("updateQuoteCapabilities", () => {
  it("sanitises and updates", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });
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
});

describe("acceptQuote", () => {
  it("updates status to accepted and dispatches quote.accepted", async () => {
    supabase.setTableResponse("quotes", {
      data: { contact_name: "Casey", company_name: "Acme" },
      error: null,
    });
    const { acceptQuote } = await import("./quotes");
    const result = await acceptQuote("q1");
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "quote.accepted",
      expect.objectContaining({ quoteId: "q1", contactName: "Casey" })
    );
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
});

describe("declineQuote", () => {
  it("updates status to declined", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });
    const { declineQuote } = await import("./quotes");
    const result = await declineQuote("q1");
    expect(result.success).toBe(true);
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
