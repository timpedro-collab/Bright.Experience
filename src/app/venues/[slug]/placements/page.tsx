/** Placement management page — calendar view and placement board with create + status controls. */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs, venueRoleLabel } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getUnreadCount } from "@/lib/queries/notifications";
import { PlacementCalendar } from "@/components/venues/PlacementCalendar";
import { VenuePlacementBoard } from "@/components/venues/VenuePlacementBoard";
import { parseRevenueModel } from "@/lib/venues/revenue-model";
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
  return { title: entityTitle("Placements", await getVenueNameForTitle(slug)) };
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
    skuCode: (p.sku_code as string | null) ?? null,
    locationLabel: (p.location_label as string | null) ?? null,
    footfallEstimate:
      p.footfall_estimate != null ? Number(p.footfall_estimate) : null,
    maxSlotsPerSponsor:
      p.max_slots_per_sponsor != null ? Number(p.max_slots_per_sponsor) : null,
    // Pre-register rows carry no sku_status; they were backfilled live.
    skuStatus: (p.sku_status === "draft" ? "draft" : "live") as "draft" | "live",
    revenueModel: parseRevenueModel(p.pricing_model_json),
  }));

  return (
    <PortalPageShell
      user={user}
      roleLabel={venueRoleLabel(user.role)}
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
