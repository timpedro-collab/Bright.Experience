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

import { EventPageShell } from "@/components/brand/event-page-shell";
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
import { deriveLiveStatus, type LiveStatus } from "@/lib/live-status";
import { hourlyCurveFromTotal } from "@/lib/metrics/drivers";
import { feedItemFromTelemetry } from "@/lib/metrics/feed-labels";
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

  // Same mapping the live route uses, so the seed and the first poll don't
  // relabel the same telemetry row differently.
  const initialFeed = telemetry.map((t: Record<string, unknown>) =>
    feedItemFromTelemetry(t)
  );

  const initialMachines = machines.map((m: Record<string, unknown>) => ({
    id: m.id ? String(m.id) : undefined,
    serial_number: String(m.serial_number ?? ""),
    nickname: m.nickname ? String(m.nickname) : undefined,
    status: String(m.status ?? "available"),
    last_heartbeat: m.last_heartbeat ? String(m.last_heartbeat) : undefined,
    firmware_version: m.firmware_version
      ? String(m.firmware_version)
      : undefined,
  }));

  const initialHourly: { hour: number; plays: number; leads: number }[] = [];
  const hourlyMap: Record<number, { plays: number; leads: number }> = {};
  for (let h = 8; h <= 20; h++) {
    hourlyMap[h] = { plays: 0, leads: 0 };
  }
  for (const t of telemetry) {
    const ts = String((t as Record<string, unknown>).timestamp ?? "");
    const hour = new Date(ts).getUTCHours();
    if (hour < 8 || hour > 20 || !hourlyMap[hour]) continue;
    const type = String((t as Record<string, unknown>).event_type ?? "");
    if (type.includes("play")) hourlyMap[hour].plays++;
    if (type === "lead_captured" || type === "lead") hourlyMap[hour].leads++;
  }
  for (let h = 8; h <= 20; h++) {
    initialHourly.push({ hour: h, ...hourlyMap[h] });
  }
  const hasHourlyData = initialHourly.some((h) => h.plays > 0 || h.leads > 0);
  if (!hasHourlyData) {
    const plays = Number(latestMetrics?.total_plays ?? 0);
    if (plays > 0) {
      const curve = hourlyCurveFromTotal(plays);
      for (let i = 0; i < initialHourly.length; i++) {
        const point = curve.find((c) => c.hour === initialHourly[i].hour);
        if (point) {
          initialHourly[i] = {
            hour: point.hour,
            plays: point.plays,
            leads: point.leads,
          };
        }
      }
    }
  }

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Live"
      title="Live dashboard."
      subtitle={`${isInternalRole(user.role) ? "Watch this activation perform in real time" : "Watch your activation perform in real time"}. Numbers refresh every 10 seconds.`}
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
          stock_remaining:
            latestMetrics?.stock_remaining != null
              ? Number(latestMetrics.stock_remaining)
              : null,
          stock_capacity:
            latestMetrics?.stock_capacity != null
              ? Number(latestMetrics.stock_capacity)
              : null,
          // The pace-based reload estimate needs hourly data; the polling
          // endpoint computes it on the first refresh after mount.
          reload_eta_minutes: null,
        }}
        initialHourly={initialHourly}
        initialFeed={initialFeed}
        initialMachines={initialMachines}
        isCustomer={!isInternalRole(user.role)}
      />
    </EventPageShell>
  );
}
