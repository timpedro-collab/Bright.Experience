/**
 * Tests for the Bright.Blue creative-team asset review action.
 *
 * Covers both decision branches, the missing-feedback validation, the
 * internal-role gate, and the Pipedrive write-back integration.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const enqueueAssetReviewDecision = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/lib/pipedrive/triggers", () => ({
  enqueueAssetReviewDecision: (...args: unknown[]) => enqueueAssetReviewDecision(...args),
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  enqueueAssetReviewDecision.mockReset();
});

const validAssetId = "00000000-0000-4000-8000-000000000001";

describe("submitAssetReview — validation", () => {
  it("rejects an invalid payload", async () => {
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({ assetId: "not-a-uuid", decision: "approved" });
    expect(result).toEqual({ success: false, error: "Invalid review payload" });
  });

  it("rejects revision_requested without feedback", async () => {
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "revision_requested",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/note/i);
  });
});

describe("submitAssetReview — auth", () => {
  it("rejects unauthenticated callers", async () => {
    supabase.setUser(null);
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "approved",
    });
    expect(result.success).toBe(false);
  });

  it("rejects callers without a creative-review role", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_admin" },
      error: null,
    });
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "approved",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Creative team/);
  });

  it("rejects internal non-creative roles (ops can't review creative)", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "operations_lead" },
      error: null,
    });
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "approved",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Creative team/);
  });

  it("rejects when the asset does not exist", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "creative_lead" },
      error: null,
    });
    supabase.setTableResponse("assets", { data: null, error: null });
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "approved",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not found/i);
  });
});

describe("submitAssetReview — happy path", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u-reviewer" });
    supabase.setTableResponse("profiles", {
      data: { role: "creative_lead" },
      error: null,
    });
    // Both `assets` and `events` selects map to their tables, but the
    // mock only stores one response per table. The action selects
    // assets first, then later selects events. We seed both.
    supabase.setTableResponse("assets", {
      data: { event_id: "evt-1", name: "hero.png", revision_count: 0 },
      error: null,
    });
    supabase.setTableResponse("events", {
      data: { name: "Spring" },
      error: null,
    });
  });

  it("returns success and dispatches asset.review_approved", async () => {
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "approved",
    });
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "asset.review_approved",
      expect.objectContaining({
        eventId: "evt-1",
        assetName: "hero.png",
      })
    );
    expect(enqueueAssetReviewDecision).toHaveBeenCalledWith(
      "evt-1",
      "hero.png",
      "approved",
      undefined
    );
  });

  it("revision_requested branch dispatches asset.revision_requested with feedback", async () => {
    const { submitAssetReview } = await import("./asset-review");
    const result = await submitAssetReview({
      assetId: validAssetId,
      decision: "revision_requested",
      feedback: "Bump the wordmark size by 10%",
    });
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "asset.revision_requested",
      expect.objectContaining({
        feedback: "Bump the wordmark size by 10%",
      })
    );
    expect(enqueueAssetReviewDecision).toHaveBeenCalledWith(
      "evt-1",
      "hero.png",
      "revision_requested",
      "Bump the wordmark size by 10%"
    );
  });
});

describe("reopenAsset — validation", () => {
  it("rejects an empty reason", async () => {
    const { reopenAsset } = await import("./asset-review");
    const result = await reopenAsset({
      assetId: validAssetId,
      reason: "   ",
    });
    expect(result.success).toBe(false);
  });
});

describe("reopenAsset — auth", () => {
  it("rejects unauthenticated callers", async () => {
    supabase.setUser(null);
    const { reopenAsset } = await import("./asset-review");
    const result = await reopenAsset({
      assetId: validAssetId,
      reason: "Client needs a colour tweak",
    });
    expect(result.success).toBe(false);
  });

  it("rejects customers", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_admin" },
      error: null,
    });
    const { reopenAsset } = await import("./asset-review");
    const result = await reopenAsset({
      assetId: validAssetId,
      reason: "Need to change the logo",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Bright\.Blue staff/);
  });

  it("rejects when the asset is not approved", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("profiles", {
      data: { role: "creative_lead" },
      error: null,
    });
    supabase.setTableResponse("assets", {
      data: { event_id: "evt-1", name: "hero.png", review_status: "pending_review" },
      error: null,
    });
    const { reopenAsset } = await import("./asset-review");
    const result = await reopenAsset({
      assetId: validAssetId,
      reason: "Change requested",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Only approved/);
  });
});

describe("reopenAsset — happy path", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u-internal" });
    supabase.setTableResponse("profiles", {
      data: { role: "operations_lead" },
      error: null,
    });
    supabase.setTableResponse("assets", {
      data: { event_id: "evt-1", name: "hero.png", review_status: "approved" },
      error: null,
    });
  });

  it("unlocks an approved asset and notifies the customer", async () => {
    const { reopenAsset } = await import("./asset-review");
    const result = await reopenAsset({
      assetId: validAssetId,
      reason: "Client spotted a typo after sign-off",
    });
    expect(result.success).toBe(true);
    expect(dispatchNotification).toHaveBeenCalledWith(
      "asset.revision_requested",
      expect.objectContaining({
        feedback: "Client spotted a typo after sign-off",
      }),
    );
  });
});
