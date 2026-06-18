/** Game and product configuration portal. */
import { notFound, redirect } from "next/navigation";
import { Gamepad2, Package } from "lucide-react";

import { EventPageShell, EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameConfigForm } from "@/components/configuration/GameConfigForm";
import { ProductConfigForm } from "@/components/configuration/ProductConfigForm";

import { getEventById } from "@/lib/queries/events";
import {
  getGameConfiguration,
  getProductConfiguration,
} from "@/app/actions/game-config";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";

export default async function ConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "configuration")) redirect(`/events/${id}`);

  const [event, gameConfig, productConfig, unread] = await Promise.all([
    getEventById(id),
    getGameConfiguration(id),
    getProductConfiguration(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const hasGame = event.eventType === "activation" || event.eventType === "hybrid" || event.eventType === "custom" || !!event.machineType;
  const hasProduct = event.eventType === "sampling" || event.eventType === "vending";

  const subtitle = (() => {
    if (hasGame && hasProduct) return "Configure game parameters, prizes, and product setup for this event.";
    if (hasGame) return "Set up game parameters, prizes, form fields, and leaderboard settings.";
    if (hasProduct) return "Configure product lists, stock ratios, and sampling details.";
    return "Event configuration will appear here when applicable.";
  })();

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Configuration"
      title="Setup & configuration."
      subtitle={subtitle}
      isInternal={isInternal}
      viewerRole={user.role}
    >
      {!hasGame && !hasProduct ? (
        <section className="py-8">
          <EmptyState
            icon={Gamepad2}
            title="No configuration needed"
            description="This event type doesn't require game or product configuration."
          />
        </section>
      ) : (
        <div className="space-y-0">
          {hasGame && (
            <section className="py-8">
              <EditorialEyebrow accent>Game configuration</EditorialEyebrow>
              <div className="mt-4">
                <GameConfigForm
                  eventId={id}
                  config={gameConfig}
                  viewerRole={user.role}
                />
              </div>
            </section>
          )}

          {hasGame && hasProduct && <Hairline className="opacity-60" />}

          {hasProduct && (
            <section className="py-8">
              <EditorialEyebrow accent>Product configuration</EditorialEyebrow>
              <div className="mt-4">
                <ProductConfigForm
                  eventId={id}
                  config={productConfig}
                  viewerRole={user.role}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </EventPageShell>
  );
}
