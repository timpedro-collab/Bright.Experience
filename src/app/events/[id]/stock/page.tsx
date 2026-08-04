/** Prize and sample stock telemetry — capacity, remaining units, and live sharing. */
import { notFound, redirect } from "next/navigation";
import { Package } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow } from "@/components/brand";
import { LiveShareControls } from "@/components/events/LiveShareControls";
import { StockTelemetryCard } from "@/components/events/StockTelemetryCard";

import { getUnreadCount } from "@/lib/queries/notifications";
import { getEventById } from "@/lib/queries/events";
import { getLatestEventMetrics } from "@/lib/queries/event-metrics";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { createClient } from "@/lib/supabase/server";

export default async function StockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "logistics")) redirect(`/events/${id}`);

  const [event, unread, latestMetrics] = await Promise.all([
    getEventById(id),
    getUnreadCount(user.id),
    getLatestEventMetrics(id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const supabase = await createClient();
  const { data: shareRow } = await supabase
    .from("events")
    .select("live_share_token, live_share_expires_at")
    .eq("id", id)
    .maybeSingle();

  const stockRemaining =
    latestMetrics?.stock_remaining != null
      ? Number(latestMetrics.stock_remaining)
      : null;
  const stockCapacity =
    latestMetrics?.stock_capacity != null
      ? Number(latestMetrics.stock_capacity)
      : null;
  const totalPrizes = Number(latestMetrics?.total_prizes ?? 0);

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Stock"
      title="Stock on the floor."
      subtitle="Prize and sample capacity — what's left, what's gone, and a view-only link for stakeholders."
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

        <div>
          <EditorialEyebrow className="mb-3">Live dashboard link</EditorialEyebrow>
          <p className="mb-4 max-w-[58ch] text-sm text-muted-foreground">
            Share headline metrics with stakeholders who do not have portal
            access. The link is view-only and expires automatically.
          </p>
          <LiveShareControls
            eventId={id}
            token={(shareRow?.live_share_token as string | null) ?? null}
            expiresAt={(shareRow?.live_share_expires_at as string | null) ?? null}
          />
        </div>
      </section>
    </EventPageShell>
  );
}
