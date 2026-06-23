/** Placement management page — calendar view and placement board with create + status controls. */
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PlacementCalendar } from "@/components/venues/PlacementCalendar";
import { VenuePlacementBoard } from "@/components/venues/VenuePlacementBoard";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PlacementsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const [placements, unread] = await Promise.all([
    getPlacementsByVenue(venue.id),
    getUnreadCount(user.id),
  ]);

  const calendarData = placements.map((p) => ({
    id: p.id,
    startDate: p.start_date,
    endDate: p.end_date ?? undefined,
    status: p.status,
    machineName:
      (p.machine_instances as { nickname?: string })?.nickname ?? undefined,
  }));

  const boardData = placements.map((p) => ({
    id: p.id,
    machineName:
      (p.machine_instances as { nickname?: string })?.nickname ?? undefined,
    startDate: p.start_date,
    endDate: p.end_date ?? undefined,
    status: p.status,
    notes: (p.notes as string | null) ?? undefined,
  }));

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.name}
      section="Placements"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Placements"
      subtitle={`Machine placements at ${venue.name}`}
    >
      <div className="space-y-6">
        <PlacementCalendar placements={calendarData} />
        <VenuePlacementBoard venueId={venue.id} placements={boardData} />
      </div>
    </PortalPageShell>
  );
}
