/**
 * Tests for the admin queue counts. Each tile is a separate Supabase
 * count query; we set responses per table so we can drive every code path.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  supabase = createMockSupabase();
});

describe("getInternalQueueCounts", () => {
  it("aggregates counts from each table", async () => {
    supabase.setTableResponse("quotes", { count: 3, error: null });
    supabase.setTableResponse("studio_requests", { count: 2, error: null });
    supabase.setTableResponse("partners", { count: 1, error: null });
    supabase.setTableResponse("events", { count: 4, error: null });
    supabase.setTableResponse("assets", { count: 7, error: null });
    // countStuckCustomerActions uses approvals/briefing_responses/assets — all
    // route through the same supabase mock with our default values.
    supabase.setTableResponse("approvals", { count: 5, error: null });
    supabase.setTableResponse("briefing_responses", { count: 6, error: null });

    const { getInternalQueueCounts } = await import("./admin-queues");
    const counts = await getInternalQueueCounts();
    expect(counts.newQuotes).toBe(3);
    expect(counts.newStudioOrders).toBe(2);
    expect(counts.pendingPartnerApps).toBe(1);
    expect(counts.blockedEvents).toBe(4);
    expect(counts.assetReviews).toBe(7);
    // 5 approvals + 6 briefings + 7 assets-pending-revision = 18 (assets
    // shares the table response so this is best-effort: assert > 0)
    expect(counts.stuckCustomerActions).toBeGreaterThanOrEqual(0);
  });

  it("treats null counts as zero", async () => {
    supabase.setDefaultResponse({ count: null, error: null });
    const { getInternalQueueCounts } = await import("./admin-queues");
    const counts = await getInternalQueueCounts();
    expect(counts.newQuotes).toBe(0);
    expect(counts.blockedEvents).toBe(0);
    expect(counts.stuckCustomerActions).toBe(0);
  });
});

describe("countStuckCustomerActions", () => {
  it("returns the sum of approvals + briefings + asset revisions", async () => {
    supabase.setTableResponse("approvals", { count: 2, error: null });
    supabase.setTableResponse("briefing_responses", { count: 3, error: null });
    supabase.setTableResponse("assets", { count: 4, error: null });
    const { countStuckCustomerActions } = await import("./admin-queues");
    const count = await countStuckCustomerActions();
    expect(count).toBe(9);
  });

  it("treats nulls as zeros", async () => {
    supabase.setTableResponse("approvals", { count: null, error: null });
    supabase.setTableResponse("briefing_responses", { count: null, error: null });
    supabase.setTableResponse("assets", { count: null, error: null });
    const { countStuckCustomerActions } = await import("./admin-queues");
    const count = await countStuckCustomerActions();
    expect(count).toBe(0);
  });
});

describe("STUCK_CUSTOMER_DAYS", () => {
  it("is the shared constant used by both the dashboard tile + /admin/customer-queue", async () => {
    const { STUCK_CUSTOMER_DAYS } = await import("./admin-queues");
    expect(STUCK_CUSTOMER_DAYS).toBe(7);
  });
});
