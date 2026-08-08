/** Event logistics — delivery, setup, and collection tracking. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Truck, Package, ArrowDownToLine, CalendarDays } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
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
import { OpsBriefingForm } from "@/components/briefing/OpsBriefingForm";

import { getEventById } from "@/lib/queries/events";
import { getBriefingResponse } from "@/lib/queries/briefing";
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
import { isStageAtOrAfter } from "@/lib/journey";
import { RequestChangePanel } from "@/components/briefing/RequestChangePanel";
import type { LogisticsEntry } from "@/types";
import { entityTitle, getEventNameForTitle } from "@/lib/queries/page-titles";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: entityTitle("Logistics", await getEventNameForTitle(id)) };
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

  // Once logistics are confirmed the ops team has planned against these
  // details, so customers can no longer edit them directly — changes go
  // through a request instead of silently overwriting the plan.
  const planLocked = isStageAtOrAfter(event.currentStage, "logistics_confirmed");
  const customerCanEdit = !isInternal && !planLocked;

  // The customer's ops/venue briefing lives on the (creative-gated) briefing
  // page, so Operations never sees it. Surface it read-only here — the
  // logistics lane Operations actually works in.
  const opsBrief = isInternal ? await getBriefingResponse(id, "ops") : null;

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
          canEdit={customerCanEdit}
        />
        <VenueAccessCard
          eventId={id}
          access={venueAccess}
          canEdit={customerCanEdit}
        />
        <OnsiteContactCard
          eventId={id}
          contact={onsiteContact}
          canEdit={customerCanEdit}
        />
        <LogisticsProviderCard
          eventId={id}
          provider={logisticsProvider}
          canEdit={isInternal}
        />
        {!isInternal && planLocked && (
          <RequestChangePanel eventId={id} formType="ops" />
        )}
      </section>

      {isInternal && (
        <>
          <Hairline className="opacity-40 my-2" />
          <section className="py-6">
            <div className="flex items-baseline gap-2 mb-4">
              <Package size={14} className="text-muted-foreground" />
              <EditorialEyebrow accent>Customer logistics brief</EditorialEyebrow>
            </div>
            <p className="text-sm text-muted-foreground max-w-[58ch] mb-4">
              Venue, access, power, and staffing details {event.account.name} shared
              for the build.
            </p>
            <OpsBriefingForm
              eventId={id}
              initialResponses={opsBrief?.responses ?? {}}
              isSubmitted={opsBrief?.is_submitted ?? false}
              readOnly
            />
          </section>
        </>
      )}

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
                : { label: "Open Timeline", href: `/events/${id}/timeline` }
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
