/**
 * Tests for game configuration actions — auth, QA read-only rule, capture
 * quality validation, and the save/submit happy paths.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";
import { defaultCaptureRules } from "@/lib/capture-rules";

let supabase: MockSupabase;
const autoCompleteTaskByPath = vi.fn();
const getUser = vi.fn();
const pushEventConfig = vi.fn(async (..._args: unknown[]) => true);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/server/tasks", () => ({
  autoCompleteTaskByPath: (...args: unknown[]) => autoCompleteTaskByPath(...args),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
}));
vi.mock("@/lib/brightblue/client", () => ({
  pushEventConfig: (...args: unknown[]) => pushEventConfig(...args),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

const VALID_CONFIG = {
  prizeMode: "guaranteed" as const,
  prizesJson: [{ name: "Coke 330ml", quantity: 100 }],
  formFieldsJson: [{ label: "Email", type: "email" as const, required: true }],
  includeScoreInExport: false,
  leaderboardEnabled: false,
  gameParametersJson: {},
  idleScreenConfigJson: {},
  captureRulesJson: defaultCaptureRules(),
  retentionDays: 60,
  brandedLanding: false,
};

beforeEach(() => {
  supabase = createMockSupabase();
  autoCompleteTaskByPath.mockReset();
  getUser.mockReset();
  getUser.mockResolvedValue({ id: "u1", role: "customer_admin" });
  pushEventConfig.mockClear();
});

describe("saveGameConfiguration", () => {
  it("rejects an unauthenticated caller", async () => {
    supabase.setUser(null);
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, VALID_CONFIG);
    expect(result.success).toBe(false);
  });

  it("rejects QA — they verify the configuration but cannot author it", async () => {
    supabase.setUser({ id: "u1" });
    getUser.mockResolvedValue({ id: "u1", role: "qa_lead" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, VALID_CONFIG);
    expect(result.success).toBe(false);
  });

  it("rejects a retention window outside the allowed range", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, {
      ...VALID_CONFIG,
      retentionDays: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/at least 1 day/i);
  });

  it("persists capture rules, retention, and branding on save", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, {
      ...VALID_CONFIG,
      retentionDays: 90,
      brandedLanding: true,
    });
    expect(result.success).toBe(true);

    const insert = supabase
      .callsFor("game_configurations")
      .find((c) => c.method === "insert");
    expect(insert).toBeDefined();
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.capture_rules_json).toEqual(defaultCaptureRules());
    expect(payload.retention_days).toBe(90);
    expect(payload.branded_landing).toBe(true);
    // A draft save must not close the customer's configuration task and
    // must not push a half-finished config to the machine stack.
    expect(autoCompleteTaskByPath).not.toHaveBeenCalled();
    expect(pushEventConfig).not.toHaveBeenCalled();
  });

  it("writes the show-wide default when no machine is named", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    await saveGameConfiguration(EVENT_ID, VALID_CONFIG);

    const calls = supabase.callsFor("game_configurations");
    // The scope lookup uses `is(machine_instance_id, null)` rather than eq,
    // because NULL is the default scope rather than a value to match.
    expect(
      calls.some((c) => c.method === "is" && c.args[0] === "machine_instance_id")
    ).toBe(true);
    const insert = calls.find((c) => c.method === "insert");
    expect((insert!.args[0] as Record<string, unknown>).machine_instance_id).toBeNull();
  });

  it("writes a machine-scoped override when a machine is named", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, {
      ...VALID_CONFIG,
      machineInstanceId: MACHINE_ID,
      captureMethod: "badge_scan",
    });
    expect(result.success).toBe(true);

    const insert = supabase
      .callsFor("game_configurations")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.machine_instance_id).toBe(MACHINE_ID);
    expect(payload.capture_method).toBe("badge_scan");
  });

  it("updates in place rather than inserting when the scope already exists", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("game_configurations", {
      data: { id: "gc-existing" },
      error: null,
    });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, VALID_CONFIG);
    expect(result.success).toBe(true);

    const calls = supabase.callsFor("game_configurations");
    expect(calls.some((c) => c.method === "update")).toBe(true);
    expect(calls.some((c) => c.method === "insert")).toBe(false);
  });

  it("rejects a machine id that is not a uuid", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, {
      ...VALID_CONFIG,
      machineInstanceId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("completes the task and pushes the config to Cloud on submit", async () => {
    supabase.setUser({ id: "u1" });
    const { saveGameConfiguration } = await import("./game-config");
    const result = await saveGameConfiguration(EVENT_ID, VALID_CONFIG, true);
    expect(result.success).toBe(true);
    expect(autoCompleteTaskByPath).toHaveBeenCalledWith(EVENT_ID, "configuration");

    expect(pushEventConfig).toHaveBeenCalledTimes(1);
    const wire = pushEventConfig.mock.calls[0][0] as Record<string, unknown>;
    expect(wire.event_id).toBe(EVENT_ID);
    expect(wire.version).toBe(2);
    expect((wire.capture_rules as Record<string, unknown>).business_emails_only).toBe(true);
  });

  it("ships one resolved block per deployed machine on submit", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("machine_instances", {
      data: [
        {
          id: MACHINE_ID,
          serial_number: "BV-2001",
          nickname: null,
          zone: "Registration",
          mission: "welcome_gift",
        },
      ],
      error: null,
    });
    const { saveGameConfiguration } = await import("./game-config");
    await saveGameConfiguration(EVENT_ID, VALID_CONFIG, true);

    const wire = pushEventConfig.mock.calls[0][0] as Record<string, unknown>;
    const machines = wire.machines as Record<string, unknown>[];
    expect(machines).toHaveLength(1);
    expect(machines[0].serial_number).toBe("BV-2001");
    expect(machines[0].zone).toBe("Registration");
    expect(machines[0].mission).toBe("welcome_gift");
  });
});

describe("getGameConfiguration", () => {
  it("fills safe capture defaults for rows written before the feature", async () => {
    supabase.setUser({ id: "u1" });
    supabase.setTableResponse("game_configurations", {
      data: {
        id: "gc1",
        event_id: EVENT_ID,
        prize_mode: "random",
        prizes_json: [],
        form_fields_json: [],
        capture_rules_json: {},
        retention_days: null,
        branded_landing: null,
        status: "draft",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    const { getGameConfiguration } = await import("./game-config");
    const config = await getGameConfiguration(EVENT_ID);
    expect(config).not.toBeNull();
    expect(config!.captureRulesJson).toEqual(defaultCaptureRules());
    expect(config!.retentionDays).toBe(60);
    expect(config!.brandedLanding).toBe(false);
  });
});
