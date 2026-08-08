/** Venue operator dashboard — revenue, what's awaiting you, and your placements. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Building2,
  Sparkles,
  Ticket,
  PlusCircle,
  Monitor,
} from "lucide-react";

import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardKpi } from "@/components/ui/DashboardKpi";
import { EmptyState } from "@/components/ui/EmptyState";
import { VenueDetailsCard } from "@/components/venues/VenueStatWidgets";
import {
  VenueActionQueue,
  slotWindow,
  type VenueActionItem,
} from "@/components/venues/VenueActionQueue";
import {
  summariseSlots,
  venueStatusVariant,
  venueStatusLabel,
} from "@/components/venues/venue-helpers";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatMoneyFromPence } from "@/lib/currency";
import { formatDateGB, formatDateRangeGB } from "@/lib/dates";
import { entityTitle, getVenueNameForTitle } from "@/lib/queries/page-titles";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: entityTitle("Dashboard", await getVenueNameForTitle(slug)) };
}

export default async function VenueDashboardPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const placements = await getPlacementsByVenue(venue.id);
  const unread = await getUnreadCount(user.id);

  // Pull every slot once, keyed by placement, so we can show money + fill rate
  // and build the action queue without re-querying.
  const slotsByPlacement = await Promise.all(
    placements.map(async (p) => ({
      placement: p,
      slots: await getSlotsByPlacement(p.id),
    })),
  );
  const allSlots = slotsByPlacement.flatMap((s) => s.slots);
  const econ = summariseSlots(allSlots);

  const activeCount = placements.filter((p) => p.status === "active").length;

  // Build the "awaiting you" queue: open slots worth money, then placements
  // missing a machine.
  const openSlotItems: VenueActionItem[] = slotsByPlacement.flatMap(({ slots }) =>
    slots
      .filter((s) => s.status === "available")
      .map((s) => ({
        id: String(s.id),
        kind: "slot" as const,
        title: "Open sponsorship slot",
        detail: `${slotWindow(String(s.start_date), s.end_date ? String(s.end_date) : null)} · invite a sponsor`,
        valueCents: Number(s.price) || undefined,
      })),
  );
  const machinelessItems: VenueActionItem[] = placements
    .filter((p) => !p.machine_instance_id && p.status !== "completed")
    .map((p) => ({
      id: `pl-${p.id}`,
      kind: "placement" as const,
      title: "Placement needs a machine",
      detail: `${formatDateGB(String(p.start_date))} — confirm the hardware to lock it in`,
    }));
  const actionItems = [...openSlotItems, ...machinelessItems];

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
      unreadCount={unread}
      scope={venue.name}
      section="Dashboard"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Dashboard"
      subtitle="Your revenue, what needs you, and every placement at a glance."
      heroRight={
        <>
          <Button asChild variant="glass" size="sm">
            <Link href={`/venues/${slug}/packages`}>
              <Building2 className="h-4 w-4" /> Packages
            </Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link href={`/venues/${slug}/placements`}>
              <PlusCircle className="h-4 w-4" /> New placement
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardKpi
          label="Booked revenue"
          value={formatMoneyFromPence(econ.bookedCents)}
          hint={`${econ.booked} slot${econ.booked === 1 ? "" : "s"} booked · ${econ.confirmed} confirmed`}
        />
        <DashboardKpi
          label="Open slot value"
          value={formatMoneyFromPence(econ.openCents)}
          hint={`${econ.available} slot${econ.available === 1 ? "" : "s"} to sell`}
        />
        <DashboardKpi
          label="Fill rate"
          value={`${econ.fillRate}%`}
          hint={`${econ.booked} of ${econ.total} slots`}
        />
        <DashboardKpi
          label="Active placements"
          value={String(activeCount)}
          hint={`${placements.length} total`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VenueActionQueue
            items={actionItems}
            sponsorshipsHref={`/venues/${slug}/sponsorships`}
            placementsHref={`/venues/${slug}/placements`}
          />

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[var(--color-bb-cobalt)]" />
                Your placements
              </CardTitle>
              <Link
                href={`/venues/${slug}/placements`}
                className="text-xs font-medium text-[var(--color-bb-cobalt)] hover:underline"
              >
                Manage
              </Link>
            </CardHeader>
            <CardContent>
              {placements.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="Your placements"
                  description="Each placement ties a machine to a date range so you can sell sponsorship slots against your footfall. You haven't added one yet."
                  action={{ label: "Add Placement", href: `/venues/${slug}/placements` }}
                  size="sm"
                  tone="flat"
                />
              ) : (
                <ul className="divide-y divide-border/50">
                  {slotsByPlacement.map(({ placement: p, slots }) => {
                    const s = summariseSlots(slots);
                    const machine = (
                      p.machine_instances as { nickname?: string } | null
                    )?.nickname;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {machine ?? "Awaiting machine"}
                            </p>
                            <Badge variant={venueStatusVariant(p.status)}>
                              {venueStatusLabel(p.status)}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-tertiary">
                            {p.end_date
                              ? formatDateRangeGB(
                                  String(p.start_date),
                                  String(p.end_date),
                                )
                              : formatDateGB(String(p.start_date))}
                            {s.total > 0
                              ? ` · ${s.reserved}/${s.total} slots filled`
                              : " · no slots yet"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            {formatMoneyFromPence(s.bookedCents)}
                          </p>
                          <p className="text-[0.65rem] text-quaternary">
                            booked
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <VenueDetailsCard
          venue={venue}
          icons={{ mapPin: MapPin, building: Building2, sparkles: Sparkles, ticket: Ticket }}
        />
      </div>
    </PortalPageShell>
  );
}
