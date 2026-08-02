/** Tests for the Bright.Blue Cloud inbound webhook route handler. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeSignature } from "@/lib/webhooks/verify";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

const TEST_SECRET = "test-webhook-secret-32chars-long!";

let mockSupabase: MockSupabase;
const dispatchNotification = vi.fn(async (..._args: unknown[]) => []);

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => mockSupabase,
}));
vi.mock("@/lib/notifications/dispatch", () => ({
  dispatchNotification: (...args: unknown[]) => dispatchNotification(...args),
}));

function buildSignedRequest(
  body: Record<string, unknown>,
  secret = TEST_SECRET
): Request {
  const raw = JSON.stringify(body);
  const sig = computeSignature(raw, secret);
  return new Request("http://localhost/api/webhooks/brightblue", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bb-signature": sig,
    },
    body: raw,
  });
}

function buildUnsignedRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/webhooks/brightblue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/webhooks/brightblue", () => {
  const originalSecret = process.env.BRIGHTBLUE_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.BRIGHTBLUE_WEBHOOK_SECRET = TEST_SECRET;
    mockSupabase = createMockSupabase();
    mockSupabase.setDefaultResponse({ data: null, error: null });
    dispatchNotification.mockClear();
  });

  afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.BRIGHTBLUE_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.BRIGHTBLUE_WEBHOOK_SECRET;
    }
  });

  /* ─── Auth / validation ─── */

  it("returns 401 for an invalid signature", async () => {
    const { POST } = await import("./route");
    const req = buildUnsignedRequest({ event_type: "telemetry.batch" });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/signature/i);
  });

  it("returns 422 for an unknown event_type", async () => {
    const { POST } = await import("./route");
    const req = buildSignedRequest({ event_type: "unknown.type" });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toMatch(/unknown.type/i);
  });

  it("returns 503 when webhook secret is not configured", async () => {
    delete process.env.BRIGHTBLUE_WEBHOOK_SECRET;

    const { POST } = await import("./route");
    const raw = JSON.stringify({ event_type: "telemetry.batch" });
    const req = new Request("http://localhost/api/webhooks/brightblue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: raw,
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  /* ─── telemetry.batch ─── */

  it("handles telemetry.batch and inserts rows", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });
    mockSupabase.setTableResponse("telemetry_events", {
      data: null,
      error: null,
    });
    mockSupabase.setTableResponse("event_metrics_snapshot", {
      data: null,
      error: null,
    });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "telemetry.batch",
      machine_serial: "BB-001",
      event_id: "00000000-0000-4000-8000-000000000001",
      events: [
        { type: "play_started", timestamp: "2026-06-15T10:00:00Z", payload: {} },
        { type: "play_completed", timestamp: "2026-06-15T10:05:00Z", payload: { score: 42 } },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.event_type).toBe("telemetry.batch");

    const upsert = mockSupabase
      .callsFor("telemetry_events")
      .find((c) => c.method === "upsert");
    expect(upsert).toBeDefined();
    const rows = upsert!.args[0] as Record<string, unknown>[];
    expect(rows).toHaveLength(2);
    // Every row carries an idempotency key, and the conflict target ignores
    // a redelivery instead of duplicating the batch.
    expect(rows.every((r) => typeof r.external_event_id === "string")).toBe(true);
    expect(upsert!.args[1]).toMatchObject({
      onConflict: "external_event_id",
      ignoreDuplicates: true,
    });
  });

  it("writes the same idempotency keys when Cloud redelivers a batch", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });

    const { POST } = await import("./route");
    const payload = {
      event_type: "telemetry.batch",
      machine_serial: "BB-001",
      event_id: "00000000-0000-4000-8000-000000000001",
      events: [
        { type: "play_started", timestamp: "2026-06-15T10:00:00Z", payload: {} },
      ],
    };

    await POST(buildSignedRequest(payload));
    const first = mockSupabase.callsFor("telemetry_events").find((c) => c.method === "upsert");

    mockSupabase = createMockSupabase();
    mockSupabase.setDefaultResponse({ data: null, error: null });
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });

    await POST(buildSignedRequest(payload));
    const second = mockSupabase.callsFor("telemetry_events").find((c) => c.method === "upsert");

    expect((second!.args[0] as Record<string, unknown>[])[0]!.external_event_id).toBe(
      (first!.args[0] as Record<string, unknown>[])[0]!.external_event_id
    );
  });

  it("prefers Cloud's own event id as the key when the payload carries one", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });

    const { POST } = await import("./route");
    await POST(
      buildSignedRequest({
        event_type: "telemetry.batch",
        machine_serial: "BB-001",
        event_id: "00000000-0000-4000-8000-000000000001",
        events: [{ id: "cloud-evt-77", type: "play_started" }],
      })
    );

    const upsert = mockSupabase
      .callsFor("telemetry_events")
      .find((c) => c.method === "upsert");
    const rows = upsert!.args[0] as Record<string, unknown>[];
    expect(rows[0]!.external_event_id).toBe("bb:cloud-evt-77");
  });

  it("acknowledges a batch for a serial we don't hold instead of making Cloud retry", async () => {
    // No machine instance for the serial.
    mockSupabase.setTableResponse("machine_instances", { data: null, error: null });

    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        event_type: "telemetry.batch",
        machine_serial: "BB-UNKNOWN",
        event_id: "00000000-0000-4000-8000-000000000001",
        events: [{ type: "play_started", timestamp: "2026-06-15T10:00:00Z" }],
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.skipped).toBe("unknown_machine_serial");
    // Nothing stored, and no snapshot recomputed off a batch we dropped.
    expect(mockSupabase.callsFor("telemetry_events")).toHaveLength(0);
    expect(mockSupabase.callsFor("event_metrics_snapshot")).toHaveLength(0);
  });

  it("still fails a batch that is missing its identifiers, so Cloud retries", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        event_type: "telemetry.batch",
        machine_serial: "BB-001",
        events: [],
      })
    );

    expect(res.status).toBe(500);
  });

  /* ─── lead.captured ─── */

  it("handles lead.captured and inserts a lead", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });
    mockSupabase.setTableResponse("leads", {
      data: null,
      error: null,
    });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "lead.captured",
      event_id: "00000000-0000-4000-8000-000000000001",
      machine_serial: "BB-001",
      contact: {
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+447700900000",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.event_type).toBe("lead.captured");

    const leadCalls = mockSupabase.callsFor("leads");
    expect(leadCalls.some((c) => c.method === "insert")).toBe(true);
  });

  it("keeps a lead whose machine serial we don't recognise, unattributed", async () => {
    mockSupabase.setTableResponse("machine_instances", { data: null, error: null });
    mockSupabase.setTableResponse("leads", { data: null, error: null });

    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        event_type: "lead.captured",
        event_id: "00000000-0000-4000-8000-000000000001",
        machine_serial: "BB-UNKNOWN",
        contact: { email: "jane@example.com" },
      })
    );

    expect(res.status).toBe(200);
    const insert = mockSupabase.callsFor("leads").find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.contact_email).toBe("jane@example.com");
    expect(payload.machine_instance_id).toBeNull();
  });

  it("stamps consented_at when the capture form recorded consent", async () => {
    mockSupabase.setTableResponse("leads", { data: null, error: null });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "lead.captured",
      event_id: "00000000-0000-4000-8000-000000000001",
      contact: {
        email: "jane@adyen.com",
        consented_at: "2026-07-24T10:00:00Z",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const insert = mockSupabase
      .callsFor("leads")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.consented_at).toBe("2026-07-24T10:00:00Z");
  });

  it("leaves consented_at null when consent was not recorded", async () => {
    mockSupabase.setTableResponse("leads", { data: null, error: null });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "lead.captured",
      event_id: "00000000-0000-4000-8000-000000000001",
      contact: { email: "jane@adyen.com" },
    });

    await POST(req);
    const insert = mockSupabase
      .callsFor("leads")
      .find((c) => c.method === "insert");
    const payload = insert!.args[0] as Record<string, unknown>;
    expect(payload.consented_at).toBeNull();
  });

  /* ─── machine.heartbeat ─── */

  it("handles machine.heartbeat and updates the machine", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "machine.heartbeat",
      machine_serial: "BB-001",
      firmware_version: "2.4.1",
      status: "deployed",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.event_type).toBe("machine.heartbeat");

    const calls = mockSupabase.callsFor("machine_instances");
    expect(calls.some((c) => c.method === "update")).toBe(true);
    expect(json.skipped).toBeUndefined();
  });

  it("acknowledges a heartbeat from a serial we don't hold", async () => {
    // The update matches no row, which PostgREST does not treat as an error.
    mockSupabase.setTableResponse("machine_instances", { data: null, error: null });

    const { POST } = await import("./route");
    const res = await POST(
      buildSignedRequest({
        event_type: "machine.heartbeat",
        machine_serial: "BB-UNKNOWN",
        status: "deployed",
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe("unknown_machine_serial");
  });

  /* ─── report.ready ─── */

  it("handles report.ready and upserts metrics", async () => {
    mockSupabase.setTableResponse("event_metrics_snapshot", {
      data: null,
      error: null,
    });
    mockSupabase.setTableResponse("hourly_metrics", {
      data: null,
      error: null,
    });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "report.ready",
      event_id: "00000000-0000-4000-8000-000000000001",
      report: {
        total_plays: 2401,
        total_leads: 312,
        total_interactions: 5100,
        total_prizes: 180,
        avg_dwell_time: 47.2,
        hourly_breakdown: [
          { hour: 9, plays: 100, leads: 12 },
          { hour: 10, plays: 150, leads: 20 },
        ],
        generated_at: "2026-06-15T18:00:00Z",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.event_type).toBe("report.ready");

    const metricsCalls = mockSupabase.callsFor("event_metrics_snapshot");
    expect(metricsCalls.some((c) => c.method === "upsert")).toBe(true);
  });

  /* ─── live stock ─── */

  it("writes stock to the snapshot and alerts ops when it first runs low", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });
    // Count queries on telemetry_events resolve with this count — 95 prizes
    // dispensed against a capacity of 100 leaves 5 (≤ the 15% threshold).
    mockSupabase.setTableResponse("telemetry_events", {
      data: null,
      error: null,
      count: 95,
    });
    mockSupabase.setTableResponse("product_configurations", {
      data: { total_units: 100 },
      error: null,
    });
    mockSupabase.setTableResponse("event_metrics_snapshot", {
      data: null, // no previous reading today → this ingest crosses the line
      error: null,
    });
    mockSupabase.setTableResponse("events", {
      data: { name: "Galaxy Launch" },
      error: null,
    });

    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "telemetry.batch",
      machine_serial: "BB-001",
      event_id: "00000000-0000-4000-8000-000000000001",
      events: [{ type: "prize_awarded", timestamp: "2026-07-24T12:00:00Z", payload: {} }],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const upsert = mockSupabase
      .callsFor("event_metrics_snapshot")
      .find((c) => c.method === "upsert");
    const payload = upsert!.args[0] as Record<string, unknown>;
    expect(payload.stock_capacity).toBe(100);
    expect(payload.stock_remaining).toBe(5);

    expect(dispatchNotification).toHaveBeenCalledWith(
      "machine.stock_low",
      expect.objectContaining({
        eventName: "Galaxy Launch",
        stockRemaining: "5",
        stockCapacity: "100",
      }),
      expect.anything()
    );
  });

  it("does not alert when capacity is unknown", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: { id: "inst-001" },
      error: null,
    });
    mockSupabase.setTableResponse("telemetry_events", {
      data: null,
      error: null,
      count: 40,
    });
    // No product configuration row → capacity unknown → no stock fields.
    const { POST } = await import("./route");
    const req = buildSignedRequest({
      event_type: "telemetry.batch",
      machine_serial: "BB-001",
      event_id: "00000000-0000-4000-8000-000000000001",
      events: [{ type: "prize_awarded", timestamp: "2026-07-24T12:00:00Z", payload: {} }],
    });

    await POST(req);
    const upsert = mockSupabase
      .callsFor("event_metrics_snapshot")
      .find((c) => c.method === "upsert");
    const payload = upsert!.args[0] as Record<string, unknown>;
    expect(payload.stock_capacity).toBeUndefined();
    expect(dispatchNotification).not.toHaveBeenCalled();
  });
});
