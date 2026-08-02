/**
 * Tests for the asset query helpers.
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

describe("getAssetsByEvent", () => {
  it("maps DB rows to camelCase Asset objects", async () => {
    supabase.setTableResponse("assets", {
      data: [
        {
          id: "a1",
          event_id: "evt-1",
          name: "Hero",
          asset_type: "image",
          file_url: "https://test.local/hero.png",
          file_name: "hero.png",
          file_size: 12345,
          version: 1,
          status: "uploaded",
          customer_visible: true,
          review_status: "pending_review",
          revision_count: 0,
        },
      ],
      error: null,
    });
    const { getAssetsByEvent } = await import("./assets");
    const result = await getAssetsByEvent("evt-1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Hero");
    expect(result[0].reviewStatus).toBe("pending_review");
  });

  it("returns an empty array on error", async () => {
    supabase.setTableResponse("assets", {
      data: null,
      error: { message: "boom" },
    });
    const { getAssetsByEvent } = await import("./assets");
    expect(await getAssetsByEvent("evt-1")).toEqual([]);
  });

  it("defaults review_status when missing", async () => {
    supabase.setTableResponse("assets", {
      data: [
        {
          id: "a1",
          event_id: "evt-1",
          name: "Hero",
          asset_type: "image",
          status: "uploaded",
          customer_visible: true,
          version: 1,
        },
      ],
      error: null,
    });
    const { getAssetsByEvent } = await import("./assets");
    const result = await getAssetsByEvent("evt-1");
    expect(result[0].reviewStatus).toBe("pending_review");
  });
});

describe("getAssetDecisionLog", () => {
  it("maps version rows to audit entries newest-first", async () => {
    supabase.setTableResponse("asset_versions", {
      data: [
        {
          id: "v2",
          asset_id: "a1",
          version: 2,
          file_name: "hero-v2.png",
          review_status: "approved",
          review_feedback: "Looks good",
          review_decided_by: "u-reviewer",
          review_decided_at: "2026-06-02T10:00:00Z",
          created_at: "2026-06-02T09:00:00Z",
          uploaded_by: "u-customer",
          asset: { name: "Hero Banner" },
          uploader: { name: "James" },
          reviewer: { name: "Emma" },
        },
      ],
      error: null,
    });
    const { getAssetDecisionLog } = await import("./assets");
    const result = await getAssetDecisionLog("evt-1");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      assetName: "Hero Banner",
      version: 2,
      reviewStatus: "approved",
      uploaderName: "James",
      reviewerName: "Emma",
    });
  });

  it("returns an empty array on error", async () => {
    supabase.setTableResponse("asset_versions", {
      data: null,
      error: { message: "boom" },
    });
    const { getAssetDecisionLog } = await import("./assets");
    expect(await getAssetDecisionLog("evt-1")).toEqual([]);
  });
});
