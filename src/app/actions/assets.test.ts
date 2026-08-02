/**
 * Tests for asset upload server actions — lock-on-approve and RBAC.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const dispatchNotification = vi.fn();
const writeAudit = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));
vi.mock("@/lib/audit", () => ({
  writeAudit: (...args: unknown[]) => writeAudit(...args),
}));
vi.mock("@/lib/storage/scan", () => ({
  screenUpload: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/server/tasks", () => ({
  autoCompleteTaskByPath: vi.fn(),
}));
vi.mock("./streak", () => ({
  bumpStreak: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  dispatchNotification.mockReset();
  writeAudit.mockReset();
});

const ASSET_ID = "00000000-0000-4000-8000-000000000001";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

function makeFormData() {
  const fd = new FormData();
  fd.set("assetId", ASSET_ID);
  fd.set("eventId", EVENT_ID);
  fd.set("file", new File(["x"], "hero.png", { type: "image/png" }));
  return fd;
}

describe("uploadAsset — lock on approve", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u-customer" });
    supabase.setTableResponse("profiles", {
      data: { role: "customer_admin" },
      error: null,
    });
    supabase.setTableResponse("assets", {
      data: {
        version: 2,
        review_status: "approved",
        required_file_types: ["image/png"],
      },
      error: null,
    });
  });

  it("rejects uploads when the asset is approved", async () => {
    const { uploadAsset } = await import("./assets");
    const result = await uploadAsset(makeFormData());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/approved and locked/i);
    }
  });
});

describe("uploadAsset — auth", () => {
  it("rejects unauthenticated callers", async () => {
    supabase.setUser(null);
    const { uploadAsset } = await import("./assets");
    const result = await uploadAsset(makeFormData());
    expect(result.success).toBe(false);
  });
});
