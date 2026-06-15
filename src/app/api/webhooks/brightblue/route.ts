/**
 * Inbound webhook handler for Bright.Blue Cloud.
 *
 * INTEGRATION: Bright.Blue Cloud
 *
 * Accepts HMAC-signed POST payloads from the Bright.Blue Cloud platform.
 * Each payload has an `event_type` field that routes to the correct handler.
 *
 * Supported event types:
 *   - telemetry.batch    — bulk telemetry events from machines
 *   - lead.captured      — a new lead was captured at the machine
 *   - machine.heartbeat  — periodic health ping from a machine
 *   - report.ready       — post-show report data is available
 *
 * Webhook URL: POST /api/webhooks/brightblue
 * Auth: HMAC-SHA256 via `x-bb-signature` header
 * Secret env: BRIGHTBLUE_WEBHOOK_SECRET
 *
 * CTO note: Each handler function is self-contained. To add a new event
 * type, add a case to the switch and a corresponding handler function.
 */

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { parseWebhookRequest } from "@/lib/webhooks/verify";

export async function POST(request: Request) {
  const result = await parseWebhookRequest(request);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }

  const { body } = result;
  const eventType = String(body.event_type ?? "");

  try {
    switch (eventType) {
      case "telemetry.batch":
        await handleTelemetryBatch(body);
        break;
      case "lead.captured":
        await handleLeadCaptured(body);
        break;
      case "machine.heartbeat":
        await handleMachineHeartbeat(body);
        break;
      case "report.ready":
        await handleReportReady(body);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown event_type: ${eventType}` },
          { status: 422 }
        );
    }

    return NextResponse.json({ received: true, event_type: eventType });
  } catch (err) {
    Sentry.captureException(err, { tags: { webhook_event_type: eventType } });
    console.error(`[webhook:brightblue] ${eventType} failed:`, err);
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}

/* ───────────────────────── Handlers ───────────────────────── */

/**
 * Ingest a batch of telemetry events from Bright.Blue Cloud.
 *
 * Expected shape:
 * ```json
 * {
 *   "event_type": "telemetry.batch",
 *   "machine_serial": "BB-001",
 *   "event_id": "<uuid>",
 *   "events": [
 *     { "type": "play_started", "timestamp": "ISO", "payload": {} },
 *     { "type": "play_completed", "timestamp": "ISO", "payload": { "score": 42 } }
 *   ]
 * }
 * ```
 */
async function handleTelemetryBatch(body: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  const serial = String(body.machine_serial ?? "");
  const eventId = String(body.event_id ?? "");
  const events = Array.isArray(body.events) ? body.events : [];

  if (!serial || !eventId || events.length === 0) {
    throw new Error("Missing machine_serial, event_id, or empty events array");
  }

  const { data: instance } = await supabase
    .from("machine_instances")
    .select("id")
    .eq("serial_number", serial)
    .single();

  if (!instance) {
    throw new Error(`Machine instance not found for serial: ${serial}`);
  }

  const rows = events.map((e: Record<string, unknown>) => ({
    machine_instance_id: instance.id,
    event_id: eventId,
    event_type: String(e.type ?? "unknown"),
    timestamp: e.timestamp ? String(e.timestamp) : new Date().toISOString(),
    payload_json: (e.payload as Record<string, unknown>) ?? {},
  }));

  const { error } = await supabase.from("telemetry_events").insert(rows);
  if (error) throw new Error(`Telemetry insert failed: ${error.message}`);

  await refreshSnapshotAfterIngest(supabase, eventId);
}

/**
 * Capture a lead from the machine's game/survey flow.
 *
 * Expected shape:
 * ```json
 * {
 *   "event_type": "lead.captured",
 *   "event_id": "<uuid>",
 *   "machine_serial": "BB-001",
 *   "contact": {
 *     "name": "Jane Doe",
 *     "email": "jane@example.com",
 *     "phone": "+44...",
 *     "custom_fields": { "linkedin": "..." }
 *   }
 * }
 * ```
 */
async function handleLeadCaptured(body: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  const eventId = String(body.event_id ?? "");
  const serial = body.machine_serial ? String(body.machine_serial) : null;
  const contact = (body.contact as Record<string, unknown>) ?? {};

  if (!eventId || !contact.email) {
    throw new Error("Missing event_id or contact.email");
  }

  let machineInstanceId: string | null = null;
  if (serial) {
    const { data: inst } = await supabase
      .from("machine_instances")
      .select("id")
      .eq("serial_number", serial)
      .maybeSingle();
    machineInstanceId = inst?.id ?? null;
  }

  const { error } = await supabase.from("leads").insert({
    event_id: eventId,
    machine_instance_id: machineInstanceId,
    contact_name: String(contact.name ?? ""),
    contact_email: String(contact.email),
    contact_phone: contact.phone ? String(contact.phone) : null,
    custom_fields_json: (contact.custom_fields as Record<string, unknown>) ?? {},
    source: "webhook",
  });

  if (error) throw new Error(`Lead insert failed: ${error.message}`);
}

/**
 * Machine heartbeat — updates last_heartbeat and optionally firmware.
 *
 * Expected shape:
 * ```json
 * {
 *   "event_type": "machine.heartbeat",
 *   "machine_serial": "BB-001",
 *   "firmware_version": "2.4.1",
 *   "status": "online"
 * }
 * ```
 */
async function handleMachineHeartbeat(body: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  const serial = String(body.machine_serial ?? "");
  if (!serial) throw new Error("Missing machine_serial");

  const VALID_STATUSES = new Set(["available", "deployed", "maintenance", "retired"]);
  const rawStatus = body.status ? String(body.status) : "deployed";
  const mappedStatus = VALID_STATUSES.has(rawStatus) ? rawStatus : "deployed";

  const update: Record<string, unknown> = {
    last_heartbeat: new Date().toISOString(),
    status: mappedStatus,
  };

  if (body.firmware_version) {
    update.firmware_version = String(body.firmware_version);
  }

  const { error } = await supabase
    .from("machine_instances")
    .update(update)
    .eq("serial_number", serial);

  if (error) throw new Error(`Heartbeat update failed: ${error.message}`);
}

/**
 * Post-show report data — ingests final metrics once an event concludes.
 *
 * Expected shape:
 * ```json
 * {
 *   "event_type": "report.ready",
 *   "event_id": "<uuid>",
 *   "report": {
 *     "total_plays": 2401,
 *     "total_leads": 312,
 *     "total_interactions": 5100,
 *     "total_prizes": 180,
 *     "avg_dwell_time": 47.2,
 *     "hourly_breakdown": [ { "hour": 9, "plays": 100, "leads": 12 }, ... ],
 *     "generated_at": "ISO"
 *   }
 * }
 * ```
 */
async function handleReportReady(body: Record<string, unknown>) {
  const supabase = getServiceRoleClient();
  const eventId = String(body.event_id ?? "");
  const report = (body.report as Record<string, unknown>) ?? {};

  if (!eventId) throw new Error("Missing event_id");

  const { error: metricsError } = await supabase
    .from("event_metrics_snapshot")
    .upsert(
      {
        event_id: eventId,
        snapshot_date: new Date().toISOString().slice(0, 10),
        total_plays: Number(report.total_plays ?? 0),
        total_leads: Number(report.total_leads ?? 0),
        total_interactions: Number(report.total_interactions ?? 0),
        total_prizes: Number(report.total_prizes ?? 0),
        avg_dwell_time: Number(report.avg_dwell_time ?? 0),
        is_final: true,
      },
      { onConflict: "event_id,snapshot_date" }
    );

  if (metricsError) {
    throw new Error(`Metrics upsert failed: ${metricsError.message}`);
  }

  if (Array.isArray(report.hourly_breakdown)) {
    const rows = (report.hourly_breakdown as Record<string, unknown>[]).map(
      (h) => ({
        event_id: eventId,
        hour: Number(h.hour ?? 0),
        plays: Number(h.plays ?? 0),
        leads: Number(h.leads ?? 0),
        snapshot_date: new Date().toISOString().slice(0, 10),
      })
    );
    await supabase.from("hourly_metrics").upsert(rows, {
      onConflict: "event_id,snapshot_date,hour",
    });
  }
}

/* ─────────── Shared: Refresh metrics snapshot after live ingest ─────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshSnapshotAfterIngest(supabase: any, eventId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [playsRes, interactionsRes, leadsRes, prizesRes] = await Promise.all([
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("event_type", ["play_started", "play_completed"])
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("event_type", "heartbeat")
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .gte("captured_at", startOfDay)
      .lte("captured_at", endOfDay),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_type", "prize_awarded")
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay),
  ]);

  await supabase.from("event_metrics_snapshot").upsert(
    {
      event_id: eventId,
      snapshot_date: today,
      total_plays: playsRes.count ?? 0,
      total_interactions: interactionsRes.count ?? 0,
      total_leads: leadsRes.count ?? 0,
      total_prizes: prizesRes.count ?? 0,
    },
    { onConflict: "event_id,snapshot_date" }
  );
}
