/**
 * Tests for logistics entry actions — auth, the update happy path (with
 * audit), and add-entry validation + sort-order assignment.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const autoCompleteTaskByPath = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/app/actions/tasks", () => ({
  autoCompleteTaskByPath: (...args: unknown[]) => autoCompleteTaskByPath(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  supabase = createMockSupabase();
  autoCompleteTaskByPath.mockReset();
});

describe("updateLogisticsEntry", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { updateLogisticsEntry } = await import("./logistics/entries");
    const result = await updateLogisticsEntry("le1", { status: "complete" });
    expect(result.success).toBe(false);
  });

  it("updates the entry and writes an audit row", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("logistics_entries", {
      data: { event_id: "e1" },
      error: null,
    });
    const { updateLogisticsEntry } = await import("./logistics/entries");
    const result = await updateLogisticsEntry("le1", { status: "complete" });
    expect(result.success).toBe(true);

    const auditInsert = supabase
      .callsFor("audit_entries")
      .find((c) => c.method === "insert");
    expect(auditInsert).toBeDefined();
  });
});

describe("addLogisticsEntry", () => {
  it("rejects invalid input via the schema", async () => {
    supabase.setUser({ id: "u1" });
    const { addLogisticsEntry } = await import("./logistics/entries");
    const result = await addLogisticsEntry("", { entryType: "", title: "" });
    expect(result.success).toBe(false);
  });

  it("assigns the next sort order and auto-completes the logistics task", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("logistics_entries", {
      data: { id: "le2", sort_order: 3 },
      error: null,
    });
    const { addLogisticsEntry } = await import("./logistics/entries");
    const result = await addLogisticsEntry("e1", {
      entryType: "delivery",
      title: "Truck arrives",
    });
    expect(result.success).toBe(true);

    const insertCall = supabase
      .callsFor("logistics_entries")
      .find((c) => c.method === "insert");
    const payload = insertCall!.args[0] as Record<string, unknown>;
    expect(payload.sort_order).toBe(4);
    expect(autoCompleteTaskByPath).toHaveBeenCalledWith("e1", "logistics");
  });
});
