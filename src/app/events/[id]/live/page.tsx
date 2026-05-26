/** Live Event Dashboard — real-time telemetry view for an active event. */
import { notFound, redirect } from "next/navigation";
import { Activity, Users, Gift, Clock } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { LiveCounter } from "@/components/telemetry/LiveCounter";
import { HourlyChart } from "@/components/telemetry/HourlyChart";
import { LiveFeed } from "@/components/telemetry/LiveFeed";
import { MachineStatusCard } from "@/components/telemetry/MachineStatusCard";

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

  const [event, latestMetrics, telemetry, machines, unread] = await Promise.all([
    getEventById(id),
    getLatestEventMetrics(id),
    getTelemetryByEvent(id, 50),
    getMachineInstancesByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

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
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Live"
      title="Live dashboard."
      subtitle="Watch your activation perform in real time. Numbers refresh every few seconds."
      heroRight={
        <Badge variant="success" className="gap-2">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Live
        </Badge>
      }
    >
      <section className="py-8">
        <EditorialEyebrow accent>Right now</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <LiveCounter
            label="Total plays"
            value={totalPlays}
            icon={<Activity size={20} />}
          />
          <LiveCounter
            label="Total leads"
            value={totalLeads}
            icon={<Users size={20} />}
          />
          <LiveCounter
            label="Prizes won"
            value={totalPrizes}
            icon={<Gift size={20} />}
          />
          <LiveCounter
            label="Avg dwell time"
            value={Math.round(avgDwellTime)}
            icon={<Clock size={20} />}
          />
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow>By the hour</EditorialEyebrow>
        <div className="mt-4">
          <HourlyChart data={hourlyData} />
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <EditorialEyebrow>Live feed</EditorialEyebrow>
          <div className="mt-4">
            <LiveFeed items={feedItems} />
          </div>
        </div>
        <div>
          <EditorialEyebrow>Machine status</EditorialEyebrow>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {machines.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2 py-6">
                No machines assigned
              </p>
            ) : (
              machines.map((m: Record<string, unknown>) => (
                <MachineStatusCard
                  key={String(m.id)}
                  machine={{
                    serialNumber: String(m.serial_number ?? ""),
                    nickname: m.nickname ? String(m.nickname) : undefined,
                    status: String(m.status ?? "available"),
                    lastHeartbeat: m.last_heartbeat
                      ? String(m.last_heartbeat)
                      : undefined,
                    firmwareVersion: m.firmware_version
                      ? String(m.firmware_version)
                      : undefined,
                  }}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </EventPageShell>
  );
}
