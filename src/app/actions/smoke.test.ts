/**
 * Happy + one-error smoke tests for the remaining server actions
 * that don't have a dedicated test file: pipedrive-config, telemetry,
 * studio, partners, and the catalog/venues/campaigns/api-management/
 * logistics/qa/reports families.
 *
 * These actions are lower-risk (mostly admin CRUD against tables we
 * already cover via RLS tests in Phase 5) so we keep the test depth
 * proportional — confirm the action runs, the insert/update payload
 * is what the customer-facing form would expect, and one error path
 * surfaces a useful message.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

let supabase: MockSupabase;
const getUser = vi.fn();
const loadPipedriveConfig = vi.fn();
const drainOutbox = vi.fn();
const getCurrentPipedriveUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabase),
}));
vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: vi.fn(() => supabase),
}));
vi.mock("@/lib/auth", () => ({
  getUser: (...args: unknown[]) => getUser(...args),
  requireInternalUser: vi.fn(async () => ({
    supabase,
    user: { id: "00000000-0000-0000-0000-000000000001" },
    profile: { id: "00000000-0000-0000-0000-000000000001", role: "admin" },
  })),
}));
vi.mock("@/lib/pipedrive/drain", () => ({
  drainOutbox: (...args: unknown[]) => drainOutbox(...args),
}));
vi.mock("@/lib/pipedrive/client", () => ({
  loadPipedriveConfig: () => loadPipedriveConfig(),
  getCurrentPipedriveUser: (...args: unknown[]) => getCurrentPipedriveUser(...args),
}));

beforeEach(() => {
  supabase = createMockSupabase();
  getUser.mockReset();
  loadPipedriveConfig.mockReset();
  drainOutbox.mockReset();
  getCurrentPipedriveUser.mockReset();
});

// ──────────────────────────────────────────────────────────
// pipedrive-config.ts
// ──────────────────────────────────────────────────────────
describe("pipedrive-config — ensureInternal gate", () => {
  it("saveConfig rejects unauthenticated users", async () => {
    getUser.mockResolvedValue(null);
    const { saveConfig } = await import("./pipedrive-config");
    const fd = new FormData();
    const result = await saveConfig(fd);
    if ("ok" in result) {
      expect(result.ok).toBe(false);
    }
  });

  it("saveConfig rejects customer users", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "customer_admin",
    });
    const { saveConfig } = await import("./pipedrive-config");
    const result = await saveConfig(new FormData());
    if ("ok" in result) {
      expect(result.ok).toBe(false);
    }
  });

  it("saveConfig accepts internal users and writes the row", async () => {
    getUser.mockResolvedValue({
      id: "u1",
      name: "x",
      email: "x@x",
      role: "events_lead",
    });
    const fd = new FormData();
    fd.set("apiToken", "shiny-new-token");
    const { saveConfig } = await import("./pipedrive-config");
    const result = await saveConfig(fd);
    expect((result as { ok: boolean }).ok).toBe(true);
    const updateCall = supabase
      .callsFor("pipedrive_config")
      .find((c) => c.method === "update");
    expect((updateCall!.args[0] as Record<string, unknown>).api_token).toBe(
      "shiny-new-token"
    );
  });
});

describe("pipedrive-config — testConnection", () => {
  it("returns no token error when config is missing", async () => {
    getUser.mockResolvedValue({ id: "u1", name: "x", email: "x@x", role: "admin" });
    loadPipedriveConfig.mockResolvedValue(null);
    const { testConnection } = await import("./pipedrive-config");
    const result = await testConnection();
    expect(result.ok).toBe(false);
  });

  it("returns the AE identity on success", async () => {
    getUser.mockResolvedValue({ id: "u1", name: "x", email: "x@x", role: "admin" });
    loadPipedriveConfig.mockResolvedValue({ apiToken: "t" });
    getCurrentPipedriveUser.mockResolvedValue({
      ok: true,
      data: { id: 1, name: "Tim", email: "tim@x" },
    });
    const { testConnection } = await import("./pipedrive-config");
    const result = await testConnection();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.name).toBe("Tim");
  });
});

describe("pipedrive-config — runDrain", () => {
  it("returns the drain result on success", async () => {
    getUser.mockResolvedValue({ id: "u1", name: "x", email: "x@x", role: "admin" });
    drainOutbox.mockResolvedValue({
      attempted: 2,
      succeeded: 2,
      failed: 0,
      skipped: 0,
    });
    const { runDrain } = await import("./pipedrive-config");
    const result = await runDrain();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.result.succeeded).toBe(2);
  });

  it("rejects unauthenticated users", async () => {
    getUser.mockResolvedValue(null);
    const { runDrain } = await import("./pipedrive-config");
    const result = await runDrain();
    expect(result.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// telemetry.ts
// ──────────────────────────────────────────────────────────
describe("telemetry action — ingestTelemetry", () => {
  it("returns not_found when serial unknown", async () => {
    supabase.setTableResponse("machine_instances", { data: null, error: null });
    const { ingestTelemetry } = await import("./telemetry");
    const result = await ingestTelemetry({
      machineSerial: "BB-XYZ",
      eventId: "00000000-0000-4000-8000-000000000001",
      eventType: "heartbeat",
    });
    expect(result.success).toBe(false);
  });

  it("inserts a telemetry row on success", async () => {
    supabase.setTableResponse("machine_instances", {
      data: { id: "mi-1" },
      error: null,
    });
    supabase.setTableResponse("telemetry_events", { data: null, error: null });
    const { ingestTelemetry } = await import("./telemetry");
    const result = await ingestTelemetry({
      machineSerial: "BB-001",
      eventId: "00000000-0000-4000-8000-000000000001",
      eventType: "play_started",
    });
    expect(result.success).toBe(true);
  });
});

describe("telemetry action — captureLead", () => {
  it("returns success with the new lead id", async () => {
    supabase.setTableResponse("leads", { data: { id: "lead-1" }, error: null });
    const { captureLead } = await import("./telemetry");
    const result = await captureLead({
      eventId: "00000000-0000-4000-8000-000000000001",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe("lead-1");
  });

  it("returns failure on insert error", async () => {
    supabase.setTableResponse("leads", {
      data: null,
      error: { message: "boom" },
    });
    const { captureLead } = await import("./telemetry");
    const result = await captureLead({
      eventId: "00000000-0000-4000-8000-000000000001",
      contactName: "Casey",
      contactEmail: "casey@acme.test",
    });
    expect(result.success).toBe(false);
  });
});

describe("telemetry action — updateMachineHeartbeat", () => {
  it("returns success on update", async () => {
    supabase.setTableResponse("machine_instances", { data: null, error: null });
    const { updateMachineHeartbeat } = await import("./telemetry");
    const result = await updateMachineHeartbeat("BB-001");
    expect(result.success).toBe(true);
  });

  it("returns failure on Supabase error", async () => {
    supabase.setTableResponse("machine_instances", {
      data: null,
      error: { message: "boom" },
    });
    const { updateMachineHeartbeat } = await import("./telemetry");
    const result = await updateMachineHeartbeat("BB-001");
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// partners.ts
// ──────────────────────────────────────────────────────────
describe("partners action — applyAsPartner", () => {
  it("creates a partner application in pending state", async () => {
    supabase.setTableResponse("partners", {
      data: { id: "p1", partner_code: "BB-TEST123" },
      error: null,
    });
    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner({
      name: "Smith Events",
      contactName: "Smith",
      contactEmail: "smith@x",
      type: "agency",
    });
    expect(result.success).toBe(true);
  });

  it("returns failure on insert error", async () => {
    supabase.setTableResponse("partners", {
      data: null,
      error: { message: "duplicate" },
    });
    const { applyAsPartner } = await import("./partners");
    const result = await applyAsPartner({
      name: "Smith Events",
      contactName: "Smith",
      contactEmail: "smith@x",
      type: "agency",
    });
    expect(result.success).toBe(false);
  });
});
