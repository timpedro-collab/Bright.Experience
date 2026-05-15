/** Sponsorship slot management — slots grouped by placement. */
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
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

  const placements = await getPlacementsByVenue(venue.id);

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
    <AppShell user={user} isInternal={false}>
      <PageHeader
        title="Sponsorships"
        subtitle={`Sponsorship slots at ${venue.name}`}
        breadcrumbs={[
          { label: "Venues", href: "/" },
          { label: venue.name, href: `/venues/${slug}/dashboard` },
          { label: "Sponsorships" },
        ]}
      />

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
    </AppShell>
  );
}
