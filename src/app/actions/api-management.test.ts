/**
 * Tests for API key and webhook management.
 *
 * A key is a bearer credential, so two things are worth pinning: it is
 * unguessable, and it can't be minted at all while the API it authenticates
 * doesn't exist. Revocation stays open in both cases — an admin must always be
 * able to kill a credential.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const requireInternalUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireInternalUser: () => requireInternalUser(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const ADMIN = { id: "u1", role: "admin" };

beforeEach(() => {
  supabase = createMockSupabase();
  requireInternalUser.mockReset();
  requireInternalUser.mockResolvedValue({
    supabase,
    user: { id: ADMIN.id },
    profile: ADMIN,
  });
  vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Mint a key and hand back the raw value. */
async function mintKey() {
  supabase.setTableResponse("api_keys", { data: { id: "k1" }, error: null });
  const { createApiKey } = await import("./api-management");
  const result = await createApiKey({ name: "Partner feed", permissions: ["read"] });
  if (!result.success) throw new Error(result.error);
  return result.data.key;
}

describe("createApiKey", () => {
  it("returns the raw key once and stores only its hash", async () => {
    const key = await mintKey();

    const insert = supabase.callsFor("api_keys").find((c) => c.method === "insert");
    const row = insert?.args[0] as Record<string, unknown>;

    expect(row.key_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row.key_hash).not.toBe(key);
    expect(row.key_prefix).toBe(key.slice(0, 11));
    expect(row.is_active).toBe(true);
  });

  it("mints a key with enough entropy to be unguessable", async () => {
    const keys = new Set<string>();
    for (let i = 0; i < 25; i += 1) {
      supabase = createMockSupabase();
      requireInternalUser.mockResolvedValue({
        supabase,
        user: { id: ADMIN.id },
        profile: ADMIN,
      });
      keys.add(await mintKey());
    }

    expect(keys.size).toBe(25);
    for (const key of keys) {
      expect(key).toMatch(/^bb_[A-Za-z2-9]{8}(-[A-Za-z2-9]{8}){3}$/);
    }
  });

  it("refuses an internal user outside the admin lane", async () => {
    requireInternalUser.mockResolvedValue({
      supabase,
      user: { id: "u2" },
      profile: { id: "u2", role: "qa_lead" },
    });

    const { createApiKey } = await import("./api-management");
    const result = await createApiKey({ name: "Sneaky", permissions: [] });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("api_keys")).toHaveLength(0);
  });

  it("refuses to issue credentials while the public API is switched off", async () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "");

    const { createApiKey } = await import("./api-management");
    const result = await createApiKey({ name: "Partner feed", permissions: [] });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/isn't switched on/i);
    expect(supabase.callsFor("api_keys")).toHaveLength(0);
  });
});

describe("createWebhookSubscription", () => {
  it("mints a signing secret distinct from the API key format", async () => {
    supabase.setTableResponse("webhook_subscriptions", {
      data: { id: "w1" },
      error: null,
    });

    const { createWebhookSubscription } = await import("./api-management");
    const result = await createWebhookSubscription({
      url: "https://partner.test/hook",
      events: ["event.created"],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.secret).toMatch(/^whsec_[0-9a-f]{64}$/);
    }
  });

  it("refuses while the public API is switched off", async () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "");

    const { createWebhookSubscription } = await import("./api-management");
    const result = await createWebhookSubscription({
      url: "https://partner.test/hook",
      events: [],
    });

    expect(result.success).toBe(false);
    expect(supabase.callsFor("webhook_subscriptions")).toHaveLength(0);
  });
});

describe("revokeApiKey", () => {
  it("stays available when the programme is off, so a key can always be killed", async () => {
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ENABLED", "");
    supabase.setTableResponse("api_keys", { data: null, error: null });

    const { revokeApiKey } = await import("./api-management");
    const result = await revokeApiKey("k1");

    expect(result.success).toBe(true);
    const update = supabase.callsFor("api_keys").find((c) => c.method === "update");
    expect(update?.args[0]).toMatchObject({ is_active: false });
  });
});
