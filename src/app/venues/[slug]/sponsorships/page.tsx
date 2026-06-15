/** Sponsorship slot management — slots grouped by placement. */
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs } from "@/components/brand";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { SponsorshipSlotCard } from "@/components/venues/SponsorshipSlotCard";

interface Props {
  params: Promise<{ slug: string }>;
}

interface PlacementWithSlots {
  id: string;
  startDate: string;
  endDate?: string;
  machineName?: string;
  slots: Array<{
    id: string;
    startDate: string;
    endDate: string;
    price?: number;
    status: string;
  }>;
}

export default async function SponsorshipsPage({ params }: Props) {
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

  const placementsWithSlots: PlacementWithSlots[] = await Promise.all(
    placements
      .filter((p) => p.status === "active" || p.status === "planned")
      .map(async (p) => {
        const rawSlots = await getSlotsByPlacement(p.id);
        return {
          id: p.id,
          startDate: p.start_date,
          endDate: p.end_date ?? undefined,
          machineName:
            (p.machine_instances as { nickname?: string })?.nickname ??
            undefined,
          slots: rawSlots.map((s) => ({
            id: s.id,
            startDate: s.start_date,
            endDate: s.end_date,
            price: s.price != null ? Number(s.price) : undefined,
            status: s.status,
          })),
        };
      })
  );

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.name}
      section="Sponsorships"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Sponsorships"
      subtitle={`Sponsorship slots at ${venue.name}`}
    >
      <div className="space-y-6">
        {placementsWithSlots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No active placements with sponsorship slots.
              </p>
            </CardContent>
          </Card>
        ) : (
          placementsWithSlots.map((placement) => (
            <Card key={placement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {placement.machineName ?? "Machine Placement"}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {new Date(placement.startDate).toLocaleDateString("en-GB")}
                    {placement.endDate &&
                      ` — ${new Date(placement.endDate).toLocaleDateString("en-GB")}`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {placement.slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sponsorship slots configured for this placement.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {placement.slots.map((slot) => (
                      <SponsorshipSlotCard key={slot.id} slot={slot} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PortalPageShell>
  );
}
