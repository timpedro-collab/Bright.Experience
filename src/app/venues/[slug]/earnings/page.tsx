/** Venue operator earnings — revenue share and booked sponsorship revenue. */
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, Wallet } from "lucide-react";

import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardKpi } from "@/components/ui/DashboardKpi";
import { EmptyState } from "@/components/ui/EmptyState";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getEarningsByVenue } from "@/lib/queries/venue-earnings";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatMoneyFromPence } from "@/lib/currency";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VenueEarningsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const [earnings, unread] = await Promise.all([
    getEarningsByVenue(venue.id),
    getUnreadCount(user.id),
  ]);

  const { placements, bookedPence, sharePence, openPence, unconfiguredCount } =
    earnings;
  const configuredCount = placements.length - unconfiguredCount;

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
      unreadCount={unread}
      scope={venue.name}
      section="Earnings"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Earnings"
      subtitle="Your share of booked sponsorship revenue, computed under the revenue model set on each placement."
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardKpi
          label="Your share"
          value={formatMoneyFromPence(sharePence)}
          hint={`of ${formatMoneyFromPence(bookedPence)} booked`}
        />
        <DashboardKpi
          label="Booked revenue"
          value={formatMoneyFromPence(bookedPence)}
        />
        <DashboardKpi
          label="Open slot value"
          value={formatMoneyFromPence(openPence)}
        />
        <DashboardKpi
          label="Revenue models set"
          value={`${configuredCount}/${placements.length}`}
          hint="placements configured"
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--color-bb-cobalt)]" />
            By placement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {placements.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No placements yet"
              description="Earnings appear here once you add placements and sponsorship slots start booking. Set a revenue model on each placement so we can calculate your share."
              action={{
                label: "Add placement",
                href: `/venues/${slug}/placements`,
              }}
              size="sm"
              tone="flat"
            />
          ) : (
            <ul className="divide-y divide-border/50">
              {placements.map((p) => (
                <li
                  key={p.placementId}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {p.label}
                    </p>
                    {p.modelLabel ? (
                      <p className="mt-0.5 text-xs text-tertiary">
                        {p.modelLabel}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        No revenue model set — set one on the placements page
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {p.sharePence !== null
                        ? formatMoneyFromPence(p.sharePence)
                        : "—"}
                    </p>
                    <p className="text-xs text-quaternary">
                      {formatMoneyFromPence(p.bookedPence)} booked
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {placements.length > 0 && (
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href={`/venues/${slug}/earnings/statement`}>
              Monthly statement
            </Link>
          </Button>
        </div>
      )}
    </PortalPageShell>
  );
}
