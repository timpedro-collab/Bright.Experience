/**
 * Tests for the accounts query helpers.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

import { findAccountIdsByName } from "./accounts";

vi.mock("@/lib/observability/log-query-error", () => ({
  logQueryError: vi.fn(),
}));

let supabase: MockSupabase;

beforeEach(() => {
  supabase = createMockSupabase();
});

type Client = Parameters<typeof findAccountIdsByName>[0];

describe("findAccountIdsByName", () => {
  it("returns the ids of matching accounts", async () => {
    supabase.setTableResponse("accounts", {
      data: [{ id: "acc-1" }, { id: "acc-2" }],
      error: null,
    });

    const ids = await findAccountIdsByName(
      supabase as unknown as Client,
      "acme"
    );

    expect(ids).toEqual(["acc-1", "acc-2"]);
    const ilike = supabase.callsFor("accounts").find((c) => c.method === "ilike");
    expect(ilike?.args).toEqual(["name", "%acme%"]);
  });

  it("strips wildcards so a search cannot match every account", async () => {
    supabase.setTableResponse("accounts", { data: [], error: null });

    await findAccountIdsByName(supabase as unknown as Client, "ac%_me");

    const ilike = supabase.callsFor("accounts").find((c) => c.method === "ilike");
    expect(ilike?.args).toEqual(["name", "%acme%"]);
  });

  it("skips the round-trip entirely for an empty term", async () => {
    const ids = await findAccountIdsByName(supabase as unknown as Client, "  ");

    expect(ids).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("returns [] on Supabase error", async () => {
    supabase.setTableResponse("accounts", {
      data: null,
      error: { message: "boom" },
    });

    expect(
      await findAccountIdsByName(supabase as unknown as Client, "acme")
    ).toEqual([]);
  });

  it("caps the number of ids it will feed into an IN list", async () => {
    supabase.setTableResponse("accounts", { data: [], error: null });

    await findAccountIdsByName(supabase as unknown as Client, "acme");

    const limit = supabase.callsFor("accounts").find((c) => c.method === "limit");
    expect(limit?.args).toEqual([200]);
  });
});
