/** Live Event Dashboard — real-time telemetry view for an active event */
import { notFound, redirect } from "next/navigation";
import { Activity, Users, Gift, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LiveCounter } from "@/components/telemetry/LiveCounter";
import { HourlyChart } from "@/components/telemetry/HourlyChart";
import { LiveFeed } from "@/components/telemetry/LiveFeed";
import { MachineStatusCard } from "@/components/telemetry/MachineStatusCard";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
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

  const [event, latestMetrics, telemetry, machines, unread] = await Promise.all([
    getEventById(id),
    getLatestEventMetrics(id),
    getTelemetryByEvent(id, 50),
    getMachineInstancesByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);

  const totalPlays = Number(latestMetrics?.total_plays ?? 0);
  const totalLeads = Number(latestMetrics?.total_leads ?? 0);
  const totalPrizes = Number(latestMetrics?.total_prizes ?? 0);
  const avgDwellTime = Number(latestMetrics?.avg_dwell_time ?? 0);

  const feedItems = telemetry.map((t: Record<string, unknown>) => ({
    id: String(t.id),
    type: String(t.event_type ?? "unknown"),
    message: `${String(t.event_type ?? "event")} recorded`,
    timestamp: String(t.timestamp ?? t.created_at ?? ""),
  }));

  const hourlyData: { hour: number; plays: number; leads: number }[] = [];
  for (let h = 8; h <= 20; h++) {
    hourlyData.push({ hour: h, plays: 0, leads: 0 });
  }

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Live dashboard" />
      <PageHeader
        eyebrow="Real-time telemetry"
        title="Live dashboard"
        subtitle="Watch your activation perform in real time. Numbers refresh every few seconds."
        actions={
          <Badge variant="success" className="gap-2">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Live
          </Badge>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <LiveCounter label="Total plays" value={totalPlays} icon={<Activity size={20} />} />
        <LiveCounter label="Total leads" value={totalLeads} icon={<Users size={20} />} />
        <LiveCounter label="Prizes won" value={totalPrizes} icon={<Gift size={20} />} />
        <LiveCounter label="Avg dwell time" value={Math.round(avgDwellTime)} icon={<Clock size={20} />} />
      </div>

      <div className="mb-6">
        <HourlyChart data={hourlyData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card tone="subtle" className="p-6">
          <h2 className="text-heading text-base font-semibold text-foreground mb-4">Live activity</h2>
          <LiveFeed items={feedItems} />
        </Card>

        <Card tone="subtle" className="p-6">
          <h2 className="text-heading text-base font-semibold text-foreground mb-4">Machine status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {machines.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2 text-center py-6">No machines assigned</p>
            ) : (
              machines.map((m: Record<string, unknown>) => (
                <MachineStatusCard
                  key={String(m.id)}
                  machine={{
                    serialNumber: String(m.serial_number ?? ""),
                    nickname: m.nickname ? String(m.nickname) : undefined,
                    status: String(m.status ?? "available"),
                    lastHeartbeat: m.last_heartbeat ? String(m.last_heartbeat) : undefined,
                    firmwareVersion: m.firmware_version ? String(m.firmware_version) : undefined,
                  }}
                />
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
