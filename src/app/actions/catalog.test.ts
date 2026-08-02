/**
 * Tests for the catalog actions.
 *
 * Focused on `linkGameToMachine`, which used to ask a composite-key junction
 * table for an `id` column it does not have — the insert always failed against
 * real Postgres and the UI reported "could not link".
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const requireInternalUser = vi.fn();

vi.mock("@/lib/auth", () => ({
  requireInternalUser: (...args: unknown[]) => requireInternalUser(...args),
}));
vi.mock("@/lib/observability/log-query-error", () => ({
  logQueryError: vi.fn(),
}));

const MACHINE_ID = "11111111-1111-4111-8111-111111111111";
const GAME_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  supabase = createMockSupabase();
  requireInternalUser.mockReset().mockResolvedValue({
    supabase,
    profile: { id: "u1", role: "creative_lead" },
  });
});

describe("linkGameToMachine", () => {
  it("returns the composite key rather than a non-existent id column", async () => {
    supabase.setTableResponse("machine_games", { data: null, error: null });
    const { linkGameToMachine } = await import("./catalog");

    const result = await linkGameToMachine(MACHINE_ID, GAME_ID);

    expect(result).toEqual({
      success: true,
      data: { machineId: MACHINE_ID, gameId: GAME_ID },
    });
  });

  it("never selects an id column from the junction table", async () => {
    supabase.setTableResponse("machine_games", { data: null, error: null });
    const { linkGameToMachine } = await import("./catalog");

    await linkGameToMachine(MACHINE_ID, GAME_ID);

    const selects = supabase
      .callsFor("machine_games")
      .filter((c) => c.method === "select");
    expect(selects).toHaveLength(0);
  });

  it("treats re-linking an existing pair as a no-op", async () => {
    supabase.setTableResponse("machine_games", { data: null, error: null });
    const { linkGameToMachine } = await import("./catalog");

    await linkGameToMachine(MACHINE_ID, GAME_ID);

    const upsert = supabase
      .callsFor("machine_games")
      .find((c) => c.method === "upsert");
    expect(upsert?.args[1]).toEqual({
      onConflict: "machine_id,game_id",
      ignoreDuplicates: true,
    });
  });

  it("surfaces a write failure as a clean error", async () => {
    supabase.setTableResponse("machine_games", {
      data: null,
      error: { message: "permission denied" },
    });
    const { linkGameToMachine } = await import("./catalog");

    const result = await linkGameToMachine(MACHINE_ID, GAME_ID);

    expect(result.success).toBe(false);
  });

  it("refuses a role without creative access", async () => {
    requireInternalUser.mockResolvedValue({
      supabase,
      profile: { id: "u2", role: "finance" },
    });
    const { linkGameToMachine } = await import("./catalog");

    const result = await linkGameToMachine(MACHINE_ID, GAME_ID);

    expect(result).toEqual({
      success: false,
      error: "Forbidden: creative access only",
    });
  });
});
