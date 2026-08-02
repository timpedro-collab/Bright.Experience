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
import {
  batchDigest,
  telemetryExternalId,
} from "@/lib/webhooks/telemetry-idempotency";
import { dispatchNotification } from "@/lib/notifications/dispatch";

/** Ops get a reload alert when stock first drops to this share of capacity. */
const LOW_STOCK_THRESHOLD = 0.15;

/**
 * What a handler did, when it's worth telling the sender.
 *
 * `skipped` means "accepted and deliberately not stored" — a 200 that stops the
 * retry loop for a payload no amount of retrying will fix.
 */
interface HandlerOutcome {
  skipped?: string;
}

/**
 * Acknowledge a payload we can't attribute, instead of failing it.
 *
 * A serial we don't hold is not a transient fault: it's a machine registered in
 * Cloud but not here (a new unit, a swapped board, a rig on someone's bench).
 * Returning 500 makes Cloud retry the same batch until it gives up, which buries
 * the real failures in its delivery log and ours. The event is recorded in
 * Sentry as a message so the gap is visible without being paged for it.
 */
function acknowledgeUnknownSerial(
  eventType: string,
  serial: string
): HandlerOutcome {
  const detail = `[webhook:brightblue] ${eventType}: no machine instance for serial ${serial} — acknowledged without storing`;
  console.warn(detail);
  Sentry.captureMessage(detail, {
    level: "warning",
    tags: { webhook_event_type: eventType, machine_serial: serial },
  });
  return { skipped: "unknown_machine_serial" };
}

export async function POST(request: Request) {
  const result = await parseWebhookRequest(request);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }

  const { body, rawBody } = result;
  const eventType = String(body.event_type ?? "");

  try {
    let outcome: HandlerOutcome = {};

    switch (eventType) {
      case "telemetry.batch":
        outcome = await handleTelemetryBatch(body, rawBody);
        break;
      case "lead.captured":
        outcome = await handleLeadCaptured(body);
        break;
      case "machine.heartbeat":
        outcome = await handleMachineHeartbeat(body);
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

    return NextResponse.json({
      received: true,
      event_type: eventType,
      ...(outcome.skipped ? { skipped: outcome.skipped } : {}),
    });
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
 *     { "id": "<cloud event id>", "type": "play_started", "timestamp": "ISO", "payload": {} },
 *     { "type": "play_completed", "timestamp": "ISO", "payload": { "score": 42 } }
 *   ]
 * }
 * ```
 *
 * `events[].id` is optional but strongly preferred: it is the idempotency key.
 * Without it the key is derived from the raw body, which still makes a
 * byte-identical redelivery a no-op but not a re-send with, say, a regenerated
 * timestamp. See `lib/webhooks/telemetry-idempotency.ts`.
 */
async function handleTelemetryBatch(
  body: Record<string, unknown>,
  rawBody: string
): Promise<HandlerOutcome> {
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
    .maybeSingle();

  if (!instance) {
    return acknowledgeUnknownSerial("telemetry.batch", serial);
  }

  const digest = batchDigest(rawBody);
  const rows = events.map((e: Record<string, unknown>, index: number) => ({
    machine_instance_id: instance.id,
    event_id: eventId,
    external_event_id: telemetryExternalId(e, digest, index),
    event_type: String(e.type ?? "unknown"),
    timestamp: e.timestamp ? String(e.timestamp) : new Date().toISOString(),
    payload_json: (e.payload as Record<string, unknown>) ?? {},
  }));

  // A redelivery lands on the same keys and is dropped rather than counted
  // twice — plays, prizes and interactions all come off these rows.
  const { error } = await supabase
    .from("telemetry_events")
    .upsert(rows, { onConflict: "external_event_id", ignoreDuplicates: true });
  if (error) throw new Error(`Telemetry insert failed: ${error.message}`);

  await refreshSnapshotAfterIngest(supabase, eventId);
  return {};
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
 *     "custom_fields": { "linkedin": "..." },
 *     "consented_at": "ISO"        // when the GDPR checkbox was ticked
 *   }
 * }
 * ```
 * `consent: true` (boolean) is also accepted — it stamps consent at ingest
 * time for machine firmware that doesn't send a timestamp.
 */
async function handleLeadCaptured(
  body: Record<string, unknown>
): Promise<HandlerOutcome> {
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
    if (!inst) {
      // The lead is the valuable part, so store it against the event and lose
      // only the per-machine attribution.
      console.warn(
        `[webhook:brightblue] lead.captured: no machine instance for serial ${serial} — storing the lead unattributed`
      );
    }
  }

  // Consent state from the capture form: an explicit timestamp wins;
  // a bare `consent: true` flag is stamped at ingest time.
  const consentedAt = contact.consented_at
    ? String(contact.consented_at)
    : contact.consent === true
      ? new Date().toISOString()
      : null;

  const { error } = await supabase.from("leads").insert({
    event_id: eventId,
    machine_instance_id: machineInstanceId,
    contact_name: String(contact.name ?? ""),
    contact_email: String(contact.email),
    contact_phone: contact.phone ? String(contact.phone) : null,
    custom_fields_json: (contact.custom_fields as Record<string, unknown>) ?? {},
    source: "webhook",
    consented_at: consentedAt,
  });

  if (error) throw new Error(`Lead insert failed: ${error.message}`);
  return {};
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
async function handleMachineHeartbeat(
  body: Record<string, unknown>
): Promise<HandlerOutcome> {
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

  // `select` so a serial that matches nothing is distinguishable from a
  // successful update — an update touching zero rows is not an error.
  // `serial_number` is unique, so at most one row comes back.
  const { data: updated, error } = await supabase
    .from("machine_instances")
    .update(update)
    .eq("serial_number", serial)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Heartbeat update failed: ${error.message}`);
  if (!updated) {
    return acknowledgeUnknownSerial("machine.heartbeat", serial);
  }
  return {};
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

  // Stock: capacity is what ops loaded (product_configurations.total_units);
  // remaining is capacity minus every prize dispensed across the whole event,
  // not just today. Also read today's previous reading so the low-stock alert
  // fires exactly once, when the level first crosses the threshold.
  const [productConfigRes, prizesAllTimeRes, existingSnapshotRes] = await Promise.all([
    supabase
      .from("product_configurations")
      .select("total_units")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("telemetry_events")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("event_type", "prize_awarded"),
    supabase
      .from("event_metrics_snapshot")
      .select("stock_remaining")
      .eq("event_id", eventId)
      .eq("snapshot_date", today)
      .maybeSingle(),
  ]);

  const capacity: number | null = productConfigRes.data?.total_units ?? null;
  const stockRemaining =
    capacity != null
      ? Math.max(0, capacity - (prizesAllTimeRes.count ?? 0))
      : null;

  await supabase.from("event_metrics_snapshot").upsert(
    {
      event_id: eventId,
      snapshot_date: today,
      total_plays: playsRes.count ?? 0,
      total_interactions: interactionsRes.count ?? 0,
      total_leads: leadsRes.count ?? 0,
      total_prizes: prizesRes.count ?? 0,
      ...(capacity != null
        ? { stock_capacity: capacity, stock_remaining: stockRemaining }
        : {}),
    },
    { onConflict: "event_id,snapshot_date" }
  );

  if (capacity != null && stockRemaining != null) {
    const threshold = Math.floor(capacity * LOW_STOCK_THRESHOLD);
    const previous = existingSnapshotRes.data?.stock_remaining as number | null | undefined;
    const justCrossed =
      stockRemaining <= threshold && (previous == null || previous > threshold);

    if (justCrossed) {
      try {
        const { data: event } = await supabase
          .from("events")
          .select("name")
          .eq("id", eventId)
          .maybeSingle();
        await dispatchNotification(
          "machine.stock_low",
          {
            eventId,
            eventName: (event?.name as string) ?? "your event",
            stockRemaining: String(stockRemaining),
            stockCapacity: String(capacity),
            entityType: "event",
            entityId: eventId,
          },
          { supabaseClient: supabase }
        );
      } catch (notifyErr) {
        console.error(`[webhook:brightblue] stock_low notify failed for ${eventId}`, notifyErr);
      }
    }
  }
}
