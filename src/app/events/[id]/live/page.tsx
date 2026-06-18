/**
 * Live Event Dashboard — SSR initial data + client-side auto-refresh.
 *
 * The server component fetches the initial snapshot and passes it to
 * `LiveDashboardClient`, which then polls `/api/events/:id/live` every
 * 10 seconds. If Bright.Blue Cloud API is configured, the polling
 * endpoint will prefer Cloud data; otherwise it uses local webhook data.
 */
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Info } from "lucide-react";

import { EventPageShell } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { LiveDashboardClient } from "@/components/telemetry/LiveDashboardClient";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { getEventById } from "@/lib/queries/events";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getTelemetryByEvent } from "@/lib/queries/telemetry";
import { getMachineInstancesByEvent } from "@/lib/queries/machine-instances";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatDateMedium } from "@/lib/dates";
import { deriveLiveStatus, type LiveStatus } from "@/lib/live-status";
import type { UserRole } from "@/types";

function LiveBadge({ status }: { status: LiveStatus }) {
  if (status.state === "live") {
    return (
      <Badge variant="success" className="gap-2">
        <span className="size-1.5 rounded-full bg-success animate-pulse" />
        Live
      </Badge>
    );
  }
  if (status.state === "standby") {
    return <Badge variant="warning">Standby</Badge>;
  }
  if (status.state === "ended") {
    return <Badge variant="muted">Event ended</Badge>;
  }
  return (
    <Badge variant="info" className="gap-2">
      Scheduled {status.startLabel}
    </Badge>
  );
}

function endedLink(
  role: UserRole,
  eventId: string,
): { href: string; label: string } {
  if (canViewSection(role, "reports"))
    return { href: `/events/${eventId}/reports`, label: "View your reports" };
  if (canViewSection(role, "timeline"))
    return { href: `/events/${eventId}/timeline`, label: "View the timeline" };
  if (canViewSection(role, "logistics"))
    return { href: `/events/${eventId}/logistics`, label: "Review logistics" };
  return { href: `/events/${eventId}`, label: "Back to overview" };
}

function LiveContextBanner({
  status,
  eventId,
  viewerRole,
}: {
  status: LiveStatus;
  eventId: string;
  viewerRole: UserRole;
}) {
  if (status.state === "scheduled") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-info/25 bg-info/8 p-4 mb-6">
        <Info className="mt-0.5 size-4 shrink-0 text-info" />
        <p className="text-sm text-muted-foreground">
          Your live dashboard will activate on event day. Data will begin
          streaming when the machine goes online.{" "}
          {status.startLabel && (
            <span className="font-medium text-foreground">
              Event starts {status.startLabel}.
            </span>
          )}
        </p>
      </div>
    );
  }
  if (status.state === "ended") {
    const link = endedLink(viewerRole, eventId);
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 mb-6">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          This event has concluded.{" "}
          <Link
            href={link.href}
            className="font-medium text-primary underline underline-offset-2"
          >
            {link.label}
          </Link>{" "}
          for the wrap-up.
        </p>
      </div>
    );
  }
  return null;
}

export default async function LiveDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "live")) redirect(`/events/${id}`);

  const [event, latestMetrics, telemetry, machines, unread] =
    await Promise.all([
      getEventById(id),
      getLatestEventMetrics(id),
      getTelemetryByEvent(id, 30),
      getMachineInstancesByEvent(id),
      getUnreadCount(user.id),
    ]);
  if (!event) return notFound();

  const liveStatus = deriveLiveStatus(event);

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
    message: feedLabels[String(t.event_type)] ?? String(t.event_type),
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
      isInternal={isInternalRole(user.role)}
      heroRight={
        <div className="flex items-center gap-3">
          <ExportMenu eventId={id} view="live" />
          <LiveBadge status={liveStatus} />
        </div>
      }
    >
      <LiveContextBanner status={liveStatus} eventId={id} viewerRole={user.role} />
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
