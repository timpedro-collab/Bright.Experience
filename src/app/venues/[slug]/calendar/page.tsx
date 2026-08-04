/** Venue dark-day calendar — idle days with no sponsorship on the market. */
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { DarkDayBoard } from "@/components/venues/DarkDayBoard";

import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { darkDayGaps, totalDarkDays } from "@/lib/venues/dark-days";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function VenueCalendarPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const unread = await getUnreadCount(user.id);

  const allPlacements = await getPlacementsByVenue(venue.id);
  const placements = allPlacements.filter(
    (p) => p.status === "active" || p.status === "planned",
  );

  if (placements.length === 0) {
    return (
      <PortalPageShell
        user={user}
        roleLabel={venueRoleLabel(user.role)}
        unreadCount={unread}
        scope={venue.name}
        section="Calendar"
        slug={slug}
        tabs={venueTabs(slug)}
        title="Dark days"
        subtitle="Days your machines stand idle with nothing on the market. Open a gap and it goes straight onto your public advertise page."
      >
        <EmptyState
          icon={CalendarDays}
          title="No live placements"
          description="Dark days only exist where a machine is placed. Add a placement first."
          action={{ label: "Add placement", href: `/venues/${slug}/placements` }}
          size="sm"
          tone="flat"
        />
      </PortalPageShell>
    );
  }

  const slotsByPlacement = await Promise.all(
    placements.map(async (p) => ({
      placement: p,
      slots: await getSlotsByPlacement(p.id),
    })),
  );

  const boardPlacements = slotsByPlacement.map(({ placement: p, slots }) => ({
    placementId: p.id,
    label:
      [p.sku_code, p.location_label ?? p.notes].filter(Boolean).join(" · ") ||
      "Placement",
    windowStart: String(p.start_date),
    windowEnd: p.end_date ? String(p.end_date) : null,
    gaps: darkDayGaps(
      String(p.start_date),
      p.end_date ? String(p.end_date) : null,
      slots,
    ),
  }));

  const uncoveredDays = boardPlacements.reduce(
    (sum, p) => sum + totalDarkDays(p.gaps),
    0,
  );

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
      unreadCount={unread}
      scope={venue.name}
      section="Calendar"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Dark days"
      subtitle="Days your machines stand idle with nothing on the market. Open a gap and it goes straight onto your public advertise page."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {uncoveredDays} uncovered day{uncoveredDays === 1 ? "" : "s"} across{" "}
        {boardPlacements.length} placement
        {boardPlacements.length === 1 ? "" : "s"}
      </p>
      <DarkDayBoard placements={boardPlacements} />
    </PortalPageShell>
  );
}
