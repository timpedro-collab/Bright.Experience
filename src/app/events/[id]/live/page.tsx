/**
 * Live Event Dashboard — SSR initial data + client-side auto-refresh.
 *
 * The server component fetches the initial snapshot and passes it to
 * `LiveDashboardClient`, which then polls `/api/events/:id/live` every
 * 10 seconds. If Bright.Blue Cloud API is configured, the polling
 * endpoint will prefer Cloud data; otherwise it uses local webhook data.
 */
import { notFound, redirect } from "next/navigation";

import { EventPageShell } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { LiveDashboardClient } from "@/components/telemetry/LiveDashboardClient";

import { getUser } from "@/lib/auth";
import { getEventById } from "@/lib/queries/events";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getTelemetryByEvent } from "@/lib/queries/telemetry";
import { getMachineInstancesByEvent } from "@/lib/queries/machine-instances";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function LiveDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [event, latestMetrics, telemetry, machines, unread] =
    await Promise.all([
      getEventById(id),
      getLatestEventMetrics(id),
      getTelemetryByEvent(id, 30),
      getMachineInstancesByEvent(id),
      getUnreadCount(user.id),
    ]);
  if (!event) return notFound();

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

  const initialFeed = telemetry.map((t: Record<string, unknown>) => ({
    id: String(t.id),
    type: String(t.event_type ?? "unknown")
      .replace(/_.*/, "")
      .replace("captured", "lead"),
    message:
      feedLabels[String(t.event_type)] ?? String(t.event_type),
    timestamp: String(t.timestamp ?? ""),
  }));

  const initialMachines = machines.map((m: Record<string, unknown>) => ({
    serial_number: String(m.serial_number ?? ""),
    nickname: m.nickname ? String(m.nickname) : undefined,
    status: String(m.status ?? "available"),
    last_heartbeat: m.last_heartbeat ? String(m.last_heartbeat) : undefined,
    firmware_version: m.firmware_version
      ? String(m.firmware_version)
      : undefined,
  }));

  const initialHourly: { hour: number; plays: number; leads: number }[] = [];
  for (let h = 8; h <= 20; h++) {
    initialHourly.push({ hour: h, plays: 0, leads: 0 });
  }

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Live"
      title="Live dashboard."
      subtitle="Watch your activation perform in real time. Numbers refresh every 10 seconds."
      heroRight={
        <Badge variant="success" className="gap-2">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Live
        </Badge>
      }
    >
      <LiveDashboardClient
        eventId={id}
        initialMetrics={{
          total_plays: Number(latestMetrics?.total_plays ?? 0),
          total_leads: Number(latestMetrics?.total_leads ?? 0),
          total_interactions: Number(latestMetrics?.total_interactions ?? 0),
          total_prizes: Number(latestMetrics?.total_prizes ?? 0),
          avg_dwell_time: Number(latestMetrics?.avg_dwell_time ?? 0),
        }}
        initialHourly={initialHourly}
        initialFeed={initialFeed}
        initialMachines={initialMachines}
      />
    </EventPageShell>
  );
}
