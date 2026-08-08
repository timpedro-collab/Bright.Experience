/** Prize and sample stock telemetry — capacity and remaining units. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Package } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow } from "@/components/brand";
import { StockTelemetryCard } from "@/components/events/StockTelemetryCard";

import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventById } from "@/lib/queries/events";
import { getEventMetricTotals } from "@/lib/queries/event-metrics";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { entityTitle, getEventNameForTitle } from "@/lib/queries/page-titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: entityTitle("Stock", await getEventNameForTitle(id)) };
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "logistics")) redirect(`/events/${id}`);

  const [event, unread, metricTotals] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
    // Stock levels come from the latest day; prize counts sum across days.
    getEventMetricTotals(id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const stockRemaining = metricTotals?.stockRemaining ?? null;
  const stockCapacity = metricTotals?.stockCapacity ?? null;
  const totalPrizes = metricTotals?.totalPrizes ?? 0;

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Stock"
      title="Stock on the floor."
      subtitle="Prize and sample capacity — what's left and what's gone."
      isInternal={isInternal}
      viewerRole={user.role}
    >
      <section className="py-8 space-y-8">
        <div>
          <div className="mb-4 flex items-baseline gap-2">
            <Package size={14} className="text-muted-foreground" />
            <EditorialEyebrow accent>Inventory</EditorialEyebrow>
          </div>
          <StockTelemetryCard
            stockRemaining={stockRemaining}
            stockCapacity={stockCapacity}
            totalPrizes={totalPrizes}
          />
        </div>
      </section>
    </EventPageShell>
  );
}
