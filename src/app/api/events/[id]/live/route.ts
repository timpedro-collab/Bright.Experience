/**
 * GET /api/events/:id/live — polled by the live dashboard client component.
 *
 * Returns the latest metrics snapshot, recent telemetry feed, machine
 * statuses, hourly breakdown for the current day, and a per-machine roll-up
 * grouped by zone for shows running a fleet.
 *
 * If Bright.Blue Cloud API credentials are configured, this endpoint
 * first tries to pull a fresh snapshot from Cloud. If unavailable or
 * not configured, it falls back to local DB data populated by webhooks.
 *
 * Auth: requires a valid Supabase session cookie.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLiveSnapshot } from "@/lib/brightblue/client";
import { getEventMetricTotals } from "@/lib/queries/event-metrics";
import { hourlyCurveFromTotal } from "@/lib/metrics/drivers";
import {
  buildMachineBreakdown,
  groupBreakdownByZone,
  type FleetMachineRow,
  type TelemetryRow,
} from "@/lib/metrics/fleet";
import { feedItemFromTelemetry } from "@/lib/metrics/feed-labels";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  // Event-scoped authorization: verify the user can access this event
  const { data: eventAccess } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!eventAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cloudSnapshot = await getLiveSnapshot(eventId);

  if (cloudSnapshot) {
    return NextResponse.json({
      source: "cloud",
      metrics: {
        total_plays: cloudSnapshot.total_plays,
        total_leads: cloudSnapshot.total_leads,
        total_interactions: cloudSnapshot.total_interactions,
        total_prizes: cloudSnapshot.total_prizes,
        avg_dwell_time: cloudSnapshot.avg_dwell_time,
        stock_remaining: null,
        stock_capacity: null,
        reload_eta_minutes: null,
      },
      hourly: cloudSnapshot.hourly,
      machines: cloudSnapshot.machines,
      // Cloud's snapshot contract has no per-machine split yet; the fleet
      // board falls back to the local roll-up rather than showing a
      // half-populated one. Tracked in docs/13-dev-handover-priorities.md.
      machine_breakdown: [],
      zones: [],
      feed: [],
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [metrics, telemetryRes, machinesRes, hourlyRes] = await Promise.all([
    // Event-to-date totals summed across daily snapshots — the same number
    // the report and the leads list carry, never one day's figures alone.
    getEventMetricTotals(eventId),

    // `machine_instance_id` travels with each row so a per-machine view can
    // filter this feed instead of asking for its own endpoint.
    supabase
      .from("telemetry_events")
      .select("id, event_type, payload_json, timestamp, machine_instance_id")
      .eq("event_id", eventId)
      .order("timestamp", { ascending: false })
      .limit(30),

    supabase
      .from("machine_instances")
      .select(
        "id, serial_number, nickname, zone, mission, status, last_heartbeat, firmware_version"
      )
      .eq("current_event_id", eventId)
      .order("serial_number"),

    // Also the source for the per-machine roll-up, so the fleet board and
    // the hourly curve always describe the same window of the same day.
    supabase
      .from("telemetry_events")
      .select("event_type, timestamp, machine_instance_id")
      .eq("event_id", eventId)
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay)
      .order("timestamp"),
  ]);

  const telemetry = telemetryRes.data ?? [];
  const machines = machinesRes.data ?? [];
  const rawHourly = hourlyRes.data ?? [];

  const hourlyMap: Record<number, { plays: number; leads: number }> = {};
  for (let h = 0; h <= 23; h++) {
    hourlyMap[h] = { plays: 0, leads: 0 };
  }
  for (const row of rawHourly) {
    // Bucket in UTC — the SSR live page buckets with getUTCHours(), and the
    // day window above is UTC-bounded, so a server-local getHours() would
    // shift the whole curve on any non-UTC deployment.
    const hour = new Date(String(row.timestamp)).getUTCHours();
    const type = String(row.event_type);
    if (type.includes("play")) hourlyMap[hour].plays++;
    if (type === "lead_captured" || type === "lead") hourlyMap[hour].leads++;
  }

  let hourly = Object.entries(hourlyMap)
    .map(([h, v]) => ({ hour: Number(h), ...v }))
    .filter((h) => h.hour >= 8 && h.hour <= 20);

  // No same-day raw telemetry (e.g. a completed event whose by-hour rows were
  // never streamed): synthesize the curve from the latest snapshot total so the
  // post-event view still shows a believable time-of-day breakdown that totals
  // to the headline metrics.
  const hasHourlyData = hourly.some((h) => h.plays > 0 || h.leads > 0);
  if (!hasHourlyData && metrics && metrics.totalPlays > 0) {
    hourly = hourlyCurveFromTotal(metrics.totalPlays, metrics.peakHour ?? 14);
  }

  // Per-machine roll-up over today's telemetry. Machines with no rows still
  // appear with zero counts — a silent unit is the point of the fleet board.
  const machineBreakdown = buildMachineBreakdown(
    machines as unknown as FleetMachineRow[],
    rawHourly as unknown as TelemetryRow[]
  );

  const feed = telemetry.map((t: Record<string, unknown>) =>
    feedItemFromTelemetry(t)
  );

  // Reload estimate: stock depletes roughly one unit per play (a completed
  // game ≈ a prize), so the recent play pace projects minutes until empty.
  const stockRemaining = metrics?.stockRemaining ?? null;
  const stockCapacity = metrics?.stockCapacity ?? null;
  let reloadEtaMinutes: number | null = null;
  if (stockRemaining != null && stockRemaining > 0) {
    const nowHour = new Date().getUTCHours();
    const recentPlays = hourly
      .filter((h) => h.hour === nowHour || h.hour === nowHour - 1)
      .reduce((sum, h) => sum + h.plays, 0);
    const playsPerMinute = recentPlays / 120;
    if (playsPerMinute > 0) {
      reloadEtaMinutes = Math.round(stockRemaining / playsPerMinute);
    }
  }

  return NextResponse.json({
    source: "local",
    metrics: metrics
      ? {
          total_plays: metrics.totalPlays,
          total_leads: metrics.totalLeads,
          total_interactions: metrics.totalInteractions,
          total_prizes: metrics.totalPrizes,
          avg_dwell_time: metrics.avgDwellTime,
          stock_remaining: stockRemaining,
          stock_capacity: stockCapacity,
          reload_eta_minutes: reloadEtaMinutes,
        }
      : {
          total_plays: 0,
          total_leads: 0,
          total_interactions: 0,
          total_prizes: 0,
          avg_dwell_time: 0,
          stock_remaining: null,
          stock_capacity: null,
          reload_eta_minutes: null,
        },
    hourly,
    machines: machines.map((m: Record<string, unknown>) => ({
      id: m.id,
      serial_number: m.serial_number,
      nickname: m.nickname,
      zone: m.zone ?? null,
      mission: m.mission ?? null,
      status: m.status ?? "available",
      last_heartbeat: m.last_heartbeat,
      firmware_version: m.firmware_version,
    })),
    machine_breakdown: machineBreakdown,
    zones: groupBreakdownByZone(machineBreakdown),
    feed,
  });
}
