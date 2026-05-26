/** Leads — list of all captured leads for an event with metrics summary. */
import { notFound, redirect } from "next/navigation";
import { Users, TrendingUp, Star, Clock } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { MetricCard } from "@/components/telemetry/MetricCard";
import { LeadTable } from "@/components/telemetry/LeadTable";

import { getUser } from "@/lib/auth";
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaysLeads = leads.filter(
    (l: { captured_at: string }) => new Date(l.captured_at) >= todayStart,
  ).length;

  const sourceMap: Record<string, number> = {};
  leads.forEach((l: { source: string }) => {
    sourceMap[l.source] = (sourceMap[l.source] ?? 0) + 1;
  });
  const topSource =
    Object.keys(sourceMap).length > 0
      ? Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0][0]
      : "—";

  const tableLeads = leads.map(
    (l: {
      id: string;
      contact_name: string;
      contact_email: string;
      contact_phone?: string;
      source: string;
      captured_at: string;
    }) => ({
      id: l.id,
      contactName: l.contact_name,
      contactEmail: l.contact_email,
      contactPhone: l.contact_phone,
      source: l.source,
      capturedAt: l.captured_at,
    }),
  );

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Leads"
      title="Captured leads."
      subtitle={`${leadCount} contacts captured.${todaysLeads > 0 ? ` ${todaysLeads} from today.` : " Pull in more by sharing the live link."}`}
    >
      <section className="py-8">
        <EditorialEyebrow accent>The headlines</EditorialEyebrow>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            value={
              metrics?.total_leads != null
                ? Math.round(Number(metrics.total_leads) / 8)
                : "—"
            }
            icon={<Clock size={20} />}
          />
        </div>
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow>Every lead</EditorialEyebrow>
        <div className="mt-4">
          <LeadTable leads={tableLeads} />
        </div>
      </section>
    </EventPageShell>
  );
}
