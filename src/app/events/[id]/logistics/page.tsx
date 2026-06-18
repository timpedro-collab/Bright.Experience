/** Event logistics — delivery, setup, and collection tracking. */
import { notFound, redirect } from "next/navigation";
import { Truck, Package, ArrowDownToLine, CalendarDays } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogisticsTimeline } from "@/components/logistics/LogisticsTimeline";
import { AddLogisticsEntryForm } from "@/components/logistics/AddLogisticsEntryForm";
import { LogisticsCustomerSummary } from "@/components/logistics/LogisticsCustomerSummary";
import { OnsiteContactCard } from "@/components/logistics/OnsiteContactCard";
import { DeliveryWindowsCard } from "@/components/logistics/DeliveryWindowsCard";
import { VenueAccessCard } from "@/components/logistics/VenueAccessCard";
import { LogisticsProviderCard } from "@/components/logistics/LogisticsProviderCard";
import { DispatchRunSheet } from "@/components/logistics/DispatchRunSheet";

import { VenueRequirementsSection } from "@/components/logistics/VenueRequirementsSection";

import { getEventById } from "@/lib/queries/events";
import { getLogisticsByEvent } from "@/lib/queries/logistics";
import {
  getOnsiteContact,
  getDeliveryWindows,
  getVenueAccess,
  getLogisticsProvider,
} from "@/app/actions/logistics";
import { getVenueRequirements } from "@/app/actions/venue-requirements";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import type { LogisticsEntry } from "@/types";

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
  delivery: { label: "Delivery", icon: Truck },
  setup: { label: "Setup", icon: Package },
  collection: { label: "De-rig / Collection", icon: ArrowDownToLine },
};

function groupByType(entries: LogisticsEntry[]) {
  const groups: Record<string, LogisticsEntry[]> = {};
  for (const entry of entries) {
    const key = entry.entryType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  return groups;
}

export default async function LogisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "logistics")) redirect(`/events/${id}`);
  const [
    event,
    entries,
    venueReqs,
    onsiteContact,
    deliveryWindows,
    venueAccess,
    logisticsProvider,
    unread,
  ] = await Promise.all([
    getEventById(id),
    getLogisticsByEvent(id),
    getVenueRequirements(id),
    getOnsiteContact(id),
    getDeliveryWindows(id),
    getVenueAccess(id),
    getLogisticsProvider(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const grouped = groupByType(entries);
  const typeOrder = ["delivery", "setup", "collection"];
  const visibleGroups = typeOrder.filter((t) => grouped[t]?.length);

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Logistics"
      title="On the day."
      subtitle="Delivery, setup, and collection — everything that makes the experience land smoothly."
      isInternal={isInternal}
      viewerRole={user.role}
    >
      <section className="py-6 space-y-6">
        <DeliveryWindowsCard
          eventId={id}
          windows={deliveryWindows}
          canEdit={!isInternal}
        />
        <VenueAccessCard
          eventId={id}
          access={venueAccess}
          canEdit={!isInternal}
        />
        <OnsiteContactCard
          eventId={id}
          contact={onsiteContact}
          canEdit={!isInternal}
        />
        <LogisticsProviderCard
          eventId={id}
          provider={logisticsProvider}
          canEdit={isInternal}
        />
      </section>

      <Hairline className="opacity-40 my-2" />

      {isInternal && entries.length > 0 && (
        <section className="py-6">
          <DispatchRunSheet event={event} entries={entries} />
        </section>
      )}

      {isInternal && (
        <section className="py-6">
          <AddLogisticsEntryForm eventId={id} />
        </section>
      )}

      {entries.length === 0 ? (
        <section className="py-8">
          <EmptyState
            icon={Truck}
            title="No logistics entries yet"
            description="Delivery, setup, and collection details will appear here once logistics are confirmed."
            action={
              isInternal
                ? undefined
                : { label: "View timeline", href: `/events/${id}/timeline` }
            }
            tone="flat"
          />
        </section>
      ) : isInternal ? (
        <div className="space-y-2">
          {visibleGroups.map((type, gi) => {
            const meta = TYPE_META[type] ?? TYPE_META.delivery;
            const Icon = meta.icon;
            return (
              <section key={type} className="py-6">
                <div className="flex items-baseline gap-2 mb-4">
                  <Icon size={14} className="text-muted-foreground" />
                  <EditorialEyebrow>{meta.label}</EditorialEyebrow>
                </div>
                <LogisticsTimeline
                  eventId={id}
                  entries={grouped[type]}
                  isInternal={isInternal}
                />
                {gi < visibleGroups.length - 1 && <Hairline className="mt-6 opacity-60" />}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="py-8">
          <div className="flex items-baseline gap-2 mb-4">
            <CalendarDays size={14} className="text-muted-foreground" />
            <EditorialEyebrow>Delivery summary</EditorialEyebrow>
          </div>
          <LogisticsCustomerSummary entries={entries} />
        </section>
      )}
      {(isInternal || venueReqs.length > 0) && (
        <>
          <Hairline className="opacity-40 my-4" />
          <VenueRequirementsSection
            eventId={id}
            requirements={venueReqs}
            isInternal={isInternal}
          />
        </>
      )}
    </EventPageShell>
  );
}
