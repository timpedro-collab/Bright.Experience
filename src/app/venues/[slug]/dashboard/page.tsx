/** Venue operator dashboard — calendar-first view with placements & sponsorship slots */
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Monitor,
  Calendar,
  Ticket,
  Building2,
  Sparkles,
  PlusCircle,
} from "lucide-react";

import { PortalPageShell, venueTabs } from "@/components/brand";
import { NextStepCard } from "@/components/layout/NextStepCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompactStat, VenueDetailsCard } from "@/components/venues/VenueStatWidgets";
import { buildWeeklyRunway } from "@/components/venues/venue-helpers";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { formatDateMedium } from "@/lib/dates";

interface Props {
  params: Promise<{ slug: string }>;
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

  const activePlacements = placements.filter((p) => p.status === "active");
  const plannedPlacements = placements.filter((p) => p.status === "planned");

  const allSlots = (
    await Promise.all(activePlacements.map((p) => getSlotsByPlacement(p.id)))
  ).flat();
  const availableSlots = allSlots.filter((s) => s.status === "available");
  const reservedSlots = allSlots.filter((s) => s.status === "reserved");

  const weeks = buildWeeklyRunway(placements);

  const nextStepDescription = availableSlots.length > 0
    ? `${availableSlots.length} sponsorship slot${availableSlots.length === 1 ? " is" : "s are"} available across your active placements. Open the slot list to invite sponsors.`
    : plannedPlacements.length > 0
      ? `${plannedPlacements.length} placement${plannedPlacements.length === 1 ? " is" : "s are"} planned. Confirm machine arrival dates to keep your runway tight.`
      : "Add your first placement to unlock sponsorship slot sales.";

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.address ? `${venue.address}` : "Venue runway"}
      section="Dashboard"
      slug={slug}
      tabs={venueTabs(slug)}
      title={venue.name}
      subtitle="Live placements, calendar runway, and available sponsorship slots."
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
      <div className="mb-6">
        <NextStepCard
          eyebrow="Your next step"
          title={availableSlots.length > 0
            ? "You have sponsorship slots ready to sell"
            : plannedPlacements.length > 0
              ? "Lock in your planned placements"
              : "Add your first placement"}
          description={nextStepDescription}
          primaryAction={{
            label: availableSlots.length > 0 ? "Manage slots" : "Open placements",
            href: availableSlots.length > 0
              ? `/venues/${slug}/sponsorships`
              : `/venues/${slug}/placements`,
          }}
          secondaryAction={{ label: "View packages", href: `/venues/${slug}/packages` }}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-3 rounded-[var(--radius-card)] border border-white/[0.06] bg-[hsl(233,50%,9%)] px-6 py-4">
        <CompactStat
          icon={Monitor}
          label="Active placements"
          value={activePlacements.length}
          tone={activePlacements.length > 0 ? "success" : "default"}
        />
        <CompactStat
          icon={Calendar}
          label="Planned"
          value={plannedPlacements.length}
          tone={plannedPlacements.length > 0 ? "info" : "default"}
        />
        <CompactStat
          icon={Ticket}
          label="Available slots"
          value={availableSlots.length}
          tone={availableSlots.length > 0 ? "warning" : "default"}
        />
        <CompactStat
          icon={Sparkles}
          label="Reserved"
          value={reservedSlots.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card tone="subtle" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>12-week runway</CardTitle>
            <span className="text-overline text-muted-foreground">
              From today
            </span>
          </CardHeader>
          <CardContent>
            {placements.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No placements scheduled"
                description="Add a placement to start seeing it on your runway."
                action={{ label: "Add a placement", href: `/venues/${slug}/placements` }}
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-overline text-muted-foreground">Wk {idx + 1}</p>
                      <p className="text-sm text-foreground tabular-nums">
                        {formatDateMedium(week.weekStart.toISOString())}
                      </p>
                    </div>
                    <div className="flex-1">
                      {week.placements.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Open availability</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {week.placements.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/8 px-2 py-0.5 text-xs text-foreground"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(230,93%,53%,0.7)]" />
                              {(p.machine_instances as { nickname?: string })?.nickname ?? "Machine"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <VenueDetailsCard
          venue={venue}
          icons={{ mapPin: MapPin, building: Building2, sparkles: Sparkles, ticket: Ticket }}
        />
      </div>
    </PortalPageShell>
  );
}
