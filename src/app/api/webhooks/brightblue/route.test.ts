/** Tests for the Bright.Blue Cloud inbound webhook route handler. */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { computeSignature } from "@/lib/webhooks/verify";
import { createMockSupabase, type MockSupabase } from "@/test/supabase";

const TEST_SECRET = "test-webhook-secret-32chars-long!";

let mockSupabase: MockSupabase;

vi.mock("@/lib/supabase/service-role", () => ({
  getServiceRoleClient: () => mockSupabase,
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

    const insertCalls = mockSupabase.callsFor("telemetry_events");
    expect(insertCalls.some((c) => c.method === "insert")).toBe(true);
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

  /* ─── machine.heartbeat ─── */

  it("handles machine.heartbeat and updates the machine", async () => {
    mockSupabase.setTableResponse("machine_instances", {
      data: null,
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
});
