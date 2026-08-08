/**
 * Tests for spawnSlotFulfilmentTasks — idempotent sold-slot checklist spawning.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";
import {
  SLOT_FULFILMENT_TEMPLATE,
  spawnSlotFulfilmentTasks,
} from "./slot-fulfilment";

let supabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => supabase,
}));

const SLOT_ID = "s1111111-1111-1111-1111-111111111111";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const TARGET_PATH = `sponsor-slot/${SLOT_ID}`;
const START_DATE = "2026-09-01";

beforeEach(() => {
  supabase = createMockSupabase();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-03T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function expectedDueDate(startDate: string, daysBeforeDoors: number): string {
  const start = new Date(`${startDate}T00:00:00`);
  const due = new Date(start);
  due.setDate(due.getDate() - daysBeforeDoors);
  const floor = new Date();
  floor.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const chosen = due.getTime() < floor.getTime() ? floor : due;
  // Local date parts, matching the source: toISOString() would shift local
  // midnight back a day in timezones east of UTC.
  const y = chosen.getFullYear();
  const m = String(chosen.getMonth() + 1).padStart(2, "0");
  const d = String(chosen.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("spawnSlotFulfilmentTasks", () => {
  it("spawns all 5 tasks with correct titles, due dates, and target_path", async () => {
    supabase.queueTableResponses("tasks", [
      { data: [], error: null },
      { data: null, error: null },
    ]);

    const result = await spawnSlotFulfilmentTasks({
      slotId: SLOT_ID,
      eventId: EVENT_ID,
      sponsorName: "Acme Corp",
      startDate: START_DATE,
    });

    expect(result).toEqual({ spawned: 5 });

    const insertCall = supabase.callsFor("tasks").find((c) => c.method === "insert");
    expect(insertCall).toBeDefined();
    const rows = insertCall!.args[0] as Array<{
      event_id: string;
      title: string;
      description: string;
      task_type: string;
      category: string;
      status: string;
      priority: string;
      target_path: string;
      due_date: string;
      is_blocking: boolean;
      customer_visible: boolean;
      sort_order: number;
    }>;

    expect(rows).toHaveLength(5);

    rows.forEach((row, index) => {
      const template = SLOT_FULFILMENT_TEMPLATE[index];
      expect(row.event_id).toBe(EVENT_ID);
      expect(row.target_path).toBe(TARGET_PATH);
      expect(row.title).toBe(
        template.title.replace("{sponsor}", "Acme Corp"),
      );
      expect(row.description).toBe(
        template.description.replace("{sponsor}", "Acme Corp"),
      );
      expect(row.task_type).toBe("internal_action");
      expect(row.category).toBe(template.category);
      expect(row.status).toBe("pending");
      expect(row.priority).toBe(template.priority);
      expect(row.due_date).toBe(
        expectedDueDate(START_DATE, template.daysBeforeDoors),
      );
      expect(row.is_blocking).toBe(template.isBlocking);
      expect(row.customer_visible).toBe(false);
      expect(row.sort_order).toBe(index);
    });
  });

  it("is idempotent — second call spawns 0", async () => {
    supabase.queueTableResponses("tasks", [
      { data: [], error: null },
      { data: null, error: null },
      { data: [{ id: "existing-task" }], error: null },
    ]);

    const first = await spawnSlotFulfilmentTasks({
      slotId: SLOT_ID,
      eventId: EVENT_ID,
      sponsorName: "Acme Corp",
      startDate: START_DATE,
    });
    expect(first).toEqual({ spawned: 5 });

    const second = await spawnSlotFulfilmentTasks({
      slotId: SLOT_ID,
      eventId: EVENT_ID,
      sponsorName: "Acme Corp",
      startDate: START_DATE,
    });
    expect(second).toEqual({ spawned: 0 });

    const insertCalls = supabase
      .callsFor("tasks")
      .filter((c) => c.method === "insert");
    expect(insertCalls).toHaveLength(1);
  });

  it('substitutes "sponsor" when sponsorName is null', async () => {
    supabase.queueTableResponses("tasks", [
      { data: [], error: null },
      { data: null, error: null },
    ]);

    await spawnSlotFulfilmentTasks({
      slotId: SLOT_ID,
      eventId: EVENT_ID,
      sponsorName: null,
      startDate: START_DATE,
    });

    const insertCall = supabase.callsFor("tasks").find((c) => c.method === "insert");
    const rows = insertCall!.args[0] as Array<{ title: string; description: string }>;

    expect(rows[0].title).toBe("Collect sponsor artwork — sponsor");
    expect(rows[3].title).toBe("Configure game + data capture for sponsor");
  });

  it("clamps past due dates to today", async () => {
    vi.setSystemTime(new Date("2026-08-20T12:00:00Z"));

    supabase.queueTableResponses("tasks", [
      { data: [], error: null },
      { data: null, error: null },
    ]);

    await spawnSlotFulfilmentTasks({
      slotId: SLOT_ID,
      eventId: EVENT_ID,
      sponsorName: "Acme Corp",
      startDate: START_DATE,
    });

    const insertCall = supabase.callsFor("tasks").find((c) => c.method === "insert");
    const rows = insertCall!.args[0] as Array<{ due_date: string }>;

    expect(rows[0].due_date).toBe("2026-08-20");
    expect(rows[4].due_date).toBe("2026-08-30");
  });

  it("returns 0 without throwing when the insert errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    supabase.queueTableResponses("tasks", [
      { data: [], error: null },
      { data: null, error: { message: "insert failed" } },
    ]);

    await expect(
      spawnSlotFulfilmentTasks({
        slotId: SLOT_ID,
        eventId: EVENT_ID,
        sponsorName: "Acme Corp",
        startDate: START_DATE,
      }),
    ).resolves.toEqual({ spawned: 0 });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[spawnSlotFulfilmentTasks] insert failed",
      expect.objectContaining({ message: "insert failed" }),
    );

    consoleSpy.mockRestore();
  });
});
