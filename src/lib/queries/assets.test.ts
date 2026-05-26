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
