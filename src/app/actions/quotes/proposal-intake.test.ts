/** Tests for the deal-explorer actions on the public proposal page. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const recordLoopEvent = vi.fn();
const decisionLimiter = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/server/loop-events", () => ({
  recordLoopEvent: (...args: unknown[]) => recordLoopEvent(...args),
}));
vi.mock("@/lib/email", () => ({
  sendProposalIntakeNotification: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    decisionLimiter: (...args: unknown[]) => decisionLimiter(...args),
    quoteLimiter: vi.fn(async () => true),
    getClientIp: vi.fn(async () => "203.0.113.7"),
  };
});

import {
  recordProposalExplorerChange,
  requestProposalConfiguration,
} from "./proposal-intake";

const QUOTE_ID = "00000000-0000-4000-8000-000000000042";

describe("requestProposalConfiguration", () => {
  beforeEach(() => {
    supabase = createMockSupabase();
    dispatchNotification.mockReset().mockResolvedValue(undefined);
    recordLoopEvent.mockReset().mockResolvedValue(undefined);
    decisionLimiter.mockReset().mockResolvedValue(true);
  });

  it("merges the toggled add-ons onto the quote and pings the AE", async () => {
    supabase.queueTableResponses("quotes", [
      {
        data: { id: QUOTE_ID, addons: ["lead-capture"], status: "proposal_sent" },
        error: null,
      },
      { data: null, error: null },
    ]);

    const result = await requestProposalConfiguration(QUOTE_ID, [
      "survey-layer",
    ]);

    expect(result).toEqual({
      success: true,
      data: { id: QUOTE_ID, addons: ["lead-capture", "survey-layer"] },
    });
    const update = supabase
      .callsFor("quotes")
      .find((c) => c.method === "update");
    expect(update?.args[0]).toEqual({
      addons: ["lead-capture", "survey-layer"],
    });
    expect(dispatchNotification).toHaveBeenCalledWith(
      "proposal.config_requested",
      expect.objectContaining({ quoteId: QUOTE_ID, entityId: QUOTE_ID }),
    );
    expect(recordLoopEvent).toHaveBeenCalledWith(
      "proposal_explorer_change",
      expect.objectContaining({ artifact: "proposal" }),
    );
  });

  it("succeeds without writing when everything requested is already included", async () => {
    supabase.setTableResponse("quotes", {
      data: { id: QUOTE_ID, addons: ["survey-layer"], status: "proposal_sent" },
      error: null,
    });

    const result = await requestProposalConfiguration(QUOTE_ID, [
      "survey-layer",
    ]);

    expect(result).toEqual({
      success: true,
      data: { id: QUOTE_ID, addons: ["survey-layer"] },
    });
    expect(
      supabase.callsFor("quotes").find((c) => c.method === "update"),
    ).toBeUndefined();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });

  it("rejects when nothing valid was selected", async () => {
    const result = await requestProposalConfiguration(QUOTE_ID, [
      "not-a-real-capability",
    ]);
    expect(result).toEqual({
      success: false,
      error: "Nothing selected to request",
    });
  });

  it("fails closed when the quote is not in a tunable status", async () => {
    supabase.setTableResponse("quotes", { data: null, error: null });

    const result = await requestProposalConfiguration(QUOTE_ID, [
      "survey-layer",
    ]);

    expect(result).toEqual({
      success: false,
      error: "Failed to update configuration",
    });
  });

  it("throttles when the rate limiter rejects the caller", async () => {
    decisionLimiter.mockResolvedValue(false);
    const result = await requestProposalConfiguration(QUOTE_ID, [
      "survey-layer",
    ]);
    expect(result.success).toBe(false);
    expect(recordLoopEvent).not.toHaveBeenCalled();
  });
});

describe("recordProposalExplorerChange", () => {
  beforeEach(() => {
    supabase = createMockSupabase();
    recordLoopEvent.mockReset().mockResolvedValue(undefined);
    decisionLimiter.mockReset().mockResolvedValue(true);
  });

  it("records a sanitized loop event for the toggled slugs", async () => {
    const result = await recordProposalExplorerChange(QUOTE_ID, [
      "survey-layer",
      "bogus-slug",
    ]);

    expect(result.success).toBe(true);
    expect(recordLoopEvent).toHaveBeenCalledWith("proposal_explorer_change", {
      artifact: "proposal",
      metadata: { quoteId: QUOTE_ID, toggled: ["survey-layer"] },
    });
  });

  it("drops the event when rate limited", async () => {
    decisionLimiter.mockResolvedValue(false);
    const result = await recordProposalExplorerChange(QUOTE_ID, [
      "survey-layer",
    ]);
    expect(result.success).toBe(false);
    expect(recordLoopEvent).not.toHaveBeenCalled();
  });
});
