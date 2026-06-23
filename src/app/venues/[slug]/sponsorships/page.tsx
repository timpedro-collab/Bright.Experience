/** Sponsorship slot management — slots grouped by placement. */
import { redirect } from "next/navigation";
import { PortalPageShell, venueTabs } from "@/components/brand";
import { getUser } from "@/lib/auth";
import { getPartnerForUser } from "@/lib/queries/partners";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";
import { getUnreadCount } from "@/lib/queries/notifications";
import { createClient } from "@/lib/supabase/server";
import {
  VenueSponsorshipBoard,
  type PlacementWithSlots,
  type SponsorOption,
} from "@/components/venues/VenueSponsorshipBoard";
import { Card, CardContent } from "@/components/ui/card";
import { summariseSlots } from "@/components/venues/venue-helpers";
import { formatUSDFromCents } from "@/lib/currency";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SponsorshipsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const venue = await getVenueBySlug(slug);
  if (!venue) redirect("/");

  const partner = await getPartnerForUser(user.id);
  if (!partner || venue.partner_id !== partner.id) redirect("/");

  const supabase = await createClient();
  const [placements, unread, { data: accounts }] = await Promise.all([
    getPlacementsByVenue(venue.id),
    getUnreadCount(user.id),
    supabase.from("accounts").select("id, name").order("name"),
  ]);

  const sponsors: SponsorOption[] = (
    (accounts as Array<{ id: string; name: string }>) ?? []
  ).map((a) => ({ id: a.id, name: a.name }));
  const sponsorNameById = new Map(sponsors.map((s) => [s.id, s.name]));

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
            sponsorName: s.sponsor_account_id
              ? sponsorNameById.get(String(s.sponsor_account_id))
              : undefined,
          })),
        };
      })
  );

  const econ = summariseSlots(
    placementsWithSlots.flatMap((p) =>
      p.slots.map((s) => ({ status: s.status, price: s.price })),
    ),
  );

  const summaryStats = [
    { label: "Booked revenue", value: formatUSDFromCents(econ.bookedCents) },
    { label: "Open slot value", value: formatUSDFromCents(econ.openCents) },
    { label: "Fill rate", value: `${econ.fillRate}%` },
    {
      label: "Slots",
      value: `${econ.reserved}/${econ.total}`,
    },
  ];

  return (
    <PortalPageShell
      user={user}
      unreadCount={unread}
      scope={venue.name}
      section="Sponsorships"
      slug={slug}
      tabs={venueTabs(slug)}
      title="Sponsorships"
      subtitle="Sell your footfall — booked revenue, open slots, and who's in them."
    >
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-x-10 gap-y-4 p-5">
          {summaryStats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <VenueSponsorshipBoard
        placements={placementsWithSlots}
        sponsors={sponsors}
      />
    </PortalPageShell>
  );
}
