/**
 * GET /api/events/:id/live — polled by the live dashboard client component.
 *
 * Returns the latest metrics snapshot, recent telemetry feed, machine
 * statuses, and hourly breakdown for the current day.
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
      },
      hourly: cloudSnapshot.hourly,
      machines: cloudSnapshot.machines,
      feed: [],
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const [metricsRes, telemetryRes, machinesRes, hourlyRes] = await Promise.all([
    supabase
      .from("event_metrics_snapshot")
      .select("*")
      .eq("event_id", eventId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("telemetry_events")
      .select("id, event_type, payload_json, timestamp")
      .eq("event_id", eventId)
      .order("timestamp", { ascending: false })
      .limit(30),

    supabase
      .from("machine_instances")
      .select("id, serial_number, nickname, status, last_heartbeat, firmware_version")
      .eq("current_event_id", eventId),

    supabase
      .from("telemetry_events")
      .select("event_type, timestamp")
      .eq("event_id", eventId)
      .gte("timestamp", startOfDay)
      .lte("timestamp", endOfDay)
      .order("timestamp"),
  ]);

  const metrics = metricsRes.data;
  const telemetry = telemetryRes.data ?? [];
  const machines = machinesRes.data ?? [];
  const rawHourly = hourlyRes.data ?? [];

  const hourlyMap: Record<number, { plays: number; leads: number }> = {};
  for (let h = 0; h <= 23; h++) {
    hourlyMap[h] = { plays: 0, leads: 0 };
  }
  for (const row of rawHourly) {
    const hour = new Date(String(row.timestamp)).getHours();
    const type = String(row.event_type);
    if (type.includes("play")) hourlyMap[hour].plays++;
    if (type === "lead_captured" || type === "lead") hourlyMap[hour].leads++;
  }

  const hourly = Object.entries(hourlyMap)
    .map(([h, v]) => ({ hour: Number(h), ...v }))
    .filter((h) => h.hour >= 8 && h.hour <= 20);

  const feedLabels: Record<string, string> = {
    play_started: "Game session started",
    play_completed: "Game completed",
    lead_captured: "New lead captured",
    prize_awarded: "Prize dispensed",
    heartbeat: "Machine check-in",
    interaction: "Screen interaction",
    survey_completed: "Survey submitted",
    linkedin_follow: "LinkedIn follow",
    qr_scan: "QR code scanned",
  };

  const feed = telemetry.map((t: Record<string, unknown>) => ({
    id: String(t.id),
    type: String(t.event_type ?? "unknown")
      .replace(/_.*/, "")
      .replace("captured", "lead"),
    message: feedLabels[String(t.event_type)] ?? String(t.event_type),
    timestamp: String(t.timestamp ?? ""),
  }));

  return NextResponse.json({
    source: "local",
    metrics: metrics
      ? {
          total_plays: metrics.total_plays ?? 0,
          total_leads: metrics.total_leads ?? 0,
          total_interactions: metrics.total_interactions ?? 0,
          total_prizes: metrics.total_prizes ?? 0,
          avg_dwell_time: metrics.avg_dwell_time ?? 0,
        }
      : { total_plays: 0, total_leads: 0, total_interactions: 0, total_prizes: 0, avg_dwell_time: 0 },
    hourly,
    machines: machines.map((m: Record<string, unknown>) => ({
      serial_number: m.serial_number,
      nickname: m.nickname,
      status: m.status ?? "available",
      last_heartbeat: m.last_heartbeat,
      firmware_version: m.firmware_version,
    })),
    feed,
  });
}
