/** Public iframe target for the compact venue advertising widget. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VenueWidgetCard } from "@/components/venues/VenueWidgetCard";
import { getVenueBySlug } from "@/lib/queries/venues";
import { getPlacementsByVenue } from "@/lib/queries/placements";
import { getSlotsByPlacement } from "@/lib/queries/sponsorship-slots";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Compact embeddable widget page — no chrome, sized for sidebar iframes. */
export default async function VenueWidgetPage({ params }: Props) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  const placements = await getPlacementsByVenue(venue.id);
  const livePlacements = placements.filter(
    (p) =>
      (p.status === "active" || p.status === "planned") &&
      p.sku_status !== "draft",
  );

  const slotGroups = await Promise.all(
    livePlacements.map((p) => getSlotsByPlacement(p.id)),
  );
  const openSlots = slotGroups
    .flat()
    .filter((s) => s.status === "available");

  const openSlotCount = openSlots.length;

  const pricedSlots = openSlots
    .map((s) => (s.price != null ? Number(s.price) : null))
    .filter((p): p is number => p != null);

  const fromPricePence =
    pricedSlots.length > 0 ? Math.min(...pricedSlots) : null;

  const earliest = openSlots
    .slice()
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

  const nextWindow = earliest
    ? { start: earliest.start_date, end: earliest.end_date }
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <VenueWidgetCard
        venueName={venue.name}
        openSlotCount={openSlotCount}
        fromPricePence={fromPricePence}
        nextWindow={nextWindow}
        advertiseHref={`/venues/${slug}/advertise?utm_source=embed&utm_medium=widget`}
      />
    </main>
  );
}
