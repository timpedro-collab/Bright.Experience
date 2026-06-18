/** Machine build — Operations configures the physical vend setup per event. */
import { notFound, redirect } from "next/navigation";
import { Package } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MachineBuildForm } from "@/components/configuration/MachineBuildForm";

import { getEventById } from "@/lib/queries/events";
import { getProductConfiguration } from "@/app/actions/game-config";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";

export default async function MachinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "machine")) redirect(`/events/${id}`);

  const [event, productConfig, unread] = await Promise.all([
    getEventById(id),
    getProductConfiguration(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  // QA verifies the build but does not author it (mirrors game config).
  const canEdit = isInternal && user.role !== "qa_lead";

  const products = productConfig?.productsJson ?? [];
  const productNames = products.map((p) => p.name).filter(Boolean);
  const multiProduct = products.length > 1;

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Machine"
      title="Machine build."
      subtitle="Record the physical vend setup — lanes, mechanisms, and which product loads where — against the customer's product mix."
      isInternal={isInternal}
      viewerRole={user.role}
    >
      <section className="py-8 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <EditorialEyebrow accent>Customer product mix</EditorialEyebrow>
          {productConfig?.totalUnits != null && (
            <span className="text-overline text-muted-foreground tabular-nums">
              {productConfig.totalUnits.toLocaleString()} units expected
            </span>
          )}
        </div>
        {productNames.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No product mix yet"
            description="The customer hasn't confirmed their products. Once they do, their mix appears here to build against."
            tone="flat"
          />
        ) : (
          <Card tone="subtle" className="p-5">
            <ul className="divide-y divide-border/50">
              {products.map((p, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                  <span className="text-foreground">{p.name || "Unnamed product"}</span>
                  {multiProduct && p.stockRatio != null && (
                    <span className="text-muted-foreground tabular-nums">
                      {p.stockRatio}% of mix
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>

      <Hairline className="opacity-60" />

      <section className="py-8">
        <EditorialEyebrow accent>The build</EditorialEyebrow>
        <div className="mt-4">
          <MachineBuildForm
            eventId={id}
            lanes={productConfig?.machineConfigJson ?? []}
            samplesReceivedAt={productConfig?.samplesReceivedAt ?? null}
            samplesTested={productConfig?.samplesTested ?? false}
            products={productNames}
            canEdit={canEdit}
          />
        </div>
      </section>
    </EventPageShell>
  );
}
