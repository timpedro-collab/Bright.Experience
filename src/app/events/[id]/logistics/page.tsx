/** Event logistics page — delivery, setup, and collection tracking */
import { notFound, redirect } from "next/navigation";
import { Truck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogisticsTimeline } from "@/components/logistics/LogisticsTimeline";
import { getEventById } from "@/lib/queries/events";
import { getLogisticsByEvent } from "@/lib/queries/logistics";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function LogisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, entries, unread] = await Promise.all([
    getEventById(id),
    getLogisticsByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Logistics" />
      <PageHeader
        eyebrow="On the day"
        title="Logistics"
        subtitle="Delivery, setup, and collection — everything that makes the experience land smoothly."
      />
      {entries.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No logistics entries yet"
          description="Delivery, setup, and collection details will appear here once logistics are confirmed."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      ) : (
        <LogisticsTimeline eventId={id} entries={entries} isInternal={isInternal} />
      )}
    </AppShell>
  );
}
