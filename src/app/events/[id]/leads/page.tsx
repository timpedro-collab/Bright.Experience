/** Leads Page — list of all captured leads for an event with metrics summary */
import { notFound, redirect } from "next/navigation";
import { Users, TrendingUp, Star, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/telemetry/MetricCard";
import { LeadTable } from "@/components/telemetry/LeadTable";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getEventById } from "@/lib/queries/events";
import { getLeadsByEvent, getLeadCount } from "@/lib/queries/leads";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [event, leads, leadCount, metrics, unread] = await Promise.all([
    getEventById(id),
    getLeadsByEvent(id),
    getLeadCount(id),
    getLatestEventMetrics(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysLeads = leads.filter(
    (l: { captured_at: string }) => new Date(l.captured_at) >= todayStart
  ).length;

  const sourceMap: Record<string, number> = {};
  leads.forEach((l: { source: string }) => {
    sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1;
  });
  const topSource =
    Object.keys(sourceMap).length > 0
      ? Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  const tableLeads = leads.map((l: { id: string; contact_name: string; contact_email: string; contact_phone?: string; source: string; captured_at: string }) => ({
    id: l.id,
    contactName: l.contact_name,
    contactEmail: l.contact_email,
    contactPhone: l.contact_phone,
    source: l.source,
    capturedAt: l.captured_at,
  }));

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Leads" />
      <PageHeader
        eyebrow="Engagement"
        title="Leads"
        subtitle={`${leadCount} captured contacts. ${todaysLeads > 0 ? `${todaysLeads} from today.` : "Pull in more by sharing the live link."}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total leads"
          value={leadCount}
          icon={<Users size={20} />}
        />
        <MetricCard
          label="Today's leads"
          value={todaysLeads}
          icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="Top source"
          value={topSource}
          icon={<Star size={20} />}
        />
        <MetricCard
          label="Avg per hour"
          value={metrics?.total_leads != null ? Math.round(Number(metrics.total_leads) / 8) : "—"}
          icon={<Clock size={20} />}
        />
      </div>

      <Card tone="subtle" className="p-6">
        <LeadTable leads={tableLeads} />
      </Card>
    </AppShell>
  );
}
