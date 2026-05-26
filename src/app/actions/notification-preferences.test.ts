/**
 * Tests for the notification preferences server action.
 *
 * The key contract: Class A archetypes (action_required) ignore the
 * `inPortal` arg and always persist `in_portal: true`. Class B
 * archetypes honour whatever the form sends.
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

describe("updateNotificationPreference — validation", () => {
  it("rejects an invalid payload", async () => {
    const { updateNotificationPreference } = await import("./notification-preferences");
    const result = await updateNotificationPreference({});
    expect(result.success).toBe(false);
  });

  it("rejects an unknown archetype kind", async () => {
    supabase.setUser({ id: "u1" });
    const { updateNotificationPreference } = await import("./notification-preferences");
    const result = await updateNotificationPreference({
      kind: "totally.not.real",
      emailMode: "immediate",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/Unknown/);
  });

  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { updateNotificationPreference } = await import("./notification-preferences");
    const result = await updateNotificationPreference({
      kind: "asset.upload_needed",
      emailMode: "immediate",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/authenticated/i);
  });
});

describe("updateNotificationPreference — Class A guardrail", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notification_preferences", {
      data: null,
      error: null,
    });
  });

  it("forces in_portal=true for action_required regardless of input", async () => {
    const { updateNotificationPreference } = await import("./notification-preferences");
    await updateNotificationPreference({
      kind: "asset.upload_needed",
      emailMode: "off",
      inPortal: false,
    });
    const upsertCall = supabase
      .callsFor("notification_preferences")
      .find((c) => c.method === "upsert");
    const row = upsertCall!.args[0] as Record<string, unknown>;
    expect(row.in_portal).toBe(true);
    expect(row.email_mode).toBe("off");
  });
});

describe("updateNotificationPreference — Class B respects input", () => {
  beforeEach(() => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notification_preferences", {
      data: null,
      error: null,
    });
  });

  it("persists in_portal=false when user opts out of an FYI archetype", async () => {
    const { updateNotificationPreference } = await import("./notification-preferences");
    await updateNotificationPreference({
      kind: "lead.captured_live",
      emailMode: "off",
      inPortal: false,
    });
    const upsertCall = supabase
      .callsFor("notification_preferences")
      .find((c) => c.method === "upsert");
    const row = upsertCall!.args[0] as Record<string, unknown>;
    expect(row.in_portal).toBe(false);
  });

  it("defaults in_portal=true when inPortal is omitted", async () => {
    const { updateNotificationPreference } = await import("./notification-preferences");
    await updateNotificationPreference({
      kind: "lead.captured_live",
      emailMode: "digest",
    });
    const upsertCall = supabase
      .callsFor("notification_preferences")
      .find((c) => c.method === "upsert");
    const row = upsertCall!.args[0] as Record<string, unknown>;
    expect(row.in_portal).toBe(true);
  });
});

describe("updateNotificationPreference — Supabase errors", () => {
  it("returns failure on upsert error", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("notification_preferences", {
      data: null,
      error: { message: "RLS denied" },
    });
    const { updateNotificationPreference } = await import("./notification-preferences");
    const result = await updateNotificationPreference({
      kind: "lead.captured_live",
      emailMode: "immediate",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("RLS denied");
  });
});
