/** Game and product configuration portal. */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Gamepad2 } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameConfigForm } from "@/components/configuration/GameConfigForm";
import { FleetConfigTabs } from "@/components/configuration/FleetConfigTabs";
import { ProductConfigForm } from "@/components/configuration/ProductConfigForm";

import { getEventById } from "@/lib/queries/events";
import { getFleetByEvent } from "@/lib/queries/machine-instances";
import {
  getGameConfigurations,
  getProductConfiguration,
} from "@/app/actions/game-config";
import { findDefaultConfig } from "@/lib/configuration/resolve-config";
import { getUnreadCount } from "@/lib/queries/notifications";
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
  return { title: entityTitle("Configuration", await getEventNameForTitle(id)) };
}

export default async function ConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "configuration")) redirect(`/events/${id}`);

  const [event, gameConfigs, productConfig, fleet, unread] = await Promise.all([
    getEventById(id),
    getGameConfigurations(id),
    getProductConfiguration(id),
    getFleetByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  // A single-machine activation keeps the plain form; only a real fleet gets
  // the scope switcher, so the common case stays as simple as it was.
  const hasFleet = fleet.length > 1;
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
                {hasFleet ? (
                  <FleetConfigTabs
                    eventId={id}
                    fleet={fleet}
                    configs={gameConfigs}
                    viewerRole={user.role}
                  />
                ) : (
                  <GameConfigForm
                    eventId={id}
                    config={findDefaultConfig(gameConfigs)}
                    viewerRole={user.role}
                  />
                )}
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
