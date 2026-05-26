/**
 * Tests for the events query helpers (read side).
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

describe("getEvents", () => {
  it("returns the mapped event list including Pipedrive fields", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-1",
          account_id: "acc-1",
          accounts: { id: "acc-1", name: "Acme", slug: "acme" },
          name: "Spring",
          event_type: "activation",
          package_type: "standard",
          event_date_start: "2026-06-15",
          current_stage: "creative_assets",
          health_status: "green",
          pipedrive_deal_id: "42",
          pipedrive_linked_at: "2026-05-01",
          created_at: "2026-05-01",
          updated_at: "2026-05-01",
        },
      ],
      error: null,
    });
    const { getEvents } = await import("./events");
    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "evt-1",
      name: "Spring",
      accountId: "acc-1",
      pipedriveDealId: "42",
      pipedriveLinkedAt: "2026-05-01",
    });
    expect(events[0].account.name).toBe("Acme");
  });

  it("returns [] on Supabase error", async () => {
    supabase.setTableResponse("events", {
      data: null,
      error: { message: "boom" },
    });
    const { getEvents } = await import("./events");
    expect(await getEvents()).toEqual([]);
  });

  it("synthesises an empty account when accounts row is null", async () => {
    supabase.setTableResponse("events", {
      data: [
        {
          id: "evt-1",
          account_id: "acc-1",
          accounts: null,
          name: "Spring",
          event_type: "activation",
          package_type: "standard",
          event_date_start: "2026-06-15",
          current_stage: "creative_assets",
          health_status: "green",
          created_at: "2026-05-01",
          updated_at: "2026-05-01",
        },
      ],
      error: null,
    });
    const { getEvents } = await import("./events");
    const events = await getEvents();
    expect(events[0].account.id).toBe("acc-1");
    expect(events[0].account.name).toBe("");
  });
});

describe("getEventById", () => {
  it("returns the mapped single row when found", async () => {
    supabase.setTableResponse("events", {
      data: {
        id: "evt-1",
        account_id: "acc-1",
        accounts: { id: "acc-1", name: "Acme", slug: "acme" },
        name: "Spring",
        event_type: "activation",
        package_type: "standard",
        event_date_start: "2026-06-15",
        current_stage: "creative_assets",
        health_status: "green",
        created_at: "2026-05-01",
        updated_at: "2026-05-01",
      },
      error: null,
    });
    const { getEventById } = await import("./events");
    const event = await getEventById("evt-1");
    expect(event?.id).toBe("evt-1");
    expect(event?.name).toBe("Spring");
  });

  it("returns null when not found", async () => {
    supabase.setTableResponse("events", { data: null, error: null });
    const { getEventById } = await import("./events");
    expect(await getEventById("evt-x")).toBeNull();
  });
});
