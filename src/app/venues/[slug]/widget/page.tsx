/** Public iframe target for the compact venue advertising widget. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VenueWidgetCard } from "@/components/venues/VenueWidgetCard";
import { getPublicVenueMedia } from "@/lib/queries/public-venue-media";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Compact embeddable widget page — no chrome, sized for sidebar iframes. */
export default async function VenueWidgetPage({ params }: Props) {
  const { slug } = await params;
  // Anonymous surface: the public read model already applies the venue
  // approval step (live SKUs only) and only returns marketing-safe fields.
  const media = await getPublicVenueMedia(slug);
  if (!media) notFound();
  const { openSlots } = media;

  const openSlotCount = openSlots.length;

  const pricedSlots = openSlots
    .map((s) => s.pricePence)
    .filter((p): p is number => p != null);

  const fromPricePence =
    pricedSlots.length > 0 ? Math.min(...pricedSlots) : null;

  const earliest = openSlots
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  const nextWindow = earliest
    ? { start: earliest.startDate, end: earliest.endDate }
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <VenueWidgetCard
        venueName={media.venue.name}
        openSlotCount={openSlotCount}
        fromPricePence={fromPricePence}
        nextWindow={nextWindow}
        advertiseHref={`/venues/${slug}/advertise?utm_source=embed&utm_medium=widget`}
      />
    </main>
  );
}
