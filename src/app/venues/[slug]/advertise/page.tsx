/**
 * Public advertiser-facing page for a venue — browse open ad slots against the
 * venue's footfall and request one. Intentionally unauthenticated: this is the
 * demand side of the venue media marketplace (and the target of the venue's
 * embeddable widget).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PublicSiteChrome } from "@/components/public/PublicSiteChrome";
import { Container, Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPublicVenueMedia } from "@/lib/queries/public-venue-media";
import { formatMoneyFromPence } from "@/lib/currency";
import {
  VenueAdvertiseBoard,
  type AdvertiseSlot,
} from "@/components/venues/VenueAdvertiseBoard";

interface Props {
  params: Promise<{ slug: string }>;
}

// The service-role read model uses no request APIs, so without this Next
// would cache the route and advertisers would see stale inventory.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const media = await getPublicVenueMedia(slug);
  if (!media) return { title: "Venue not found" };
  return {
    title: `Advertise at ${media.venue.name} · Bright.Blue`,
    description: `Book interactive ad slots against the footfall at ${media.venue.name}.`,
  };
}

export default async function VenueAdvertisePage({ params }: Props) {
  const { slug } = await params;
  // Anonymous surface: the public read model already applies the venue
  // approval step (live SKUs only) and returns marketing-safe fields only.
  const media = await getPublicVenueMedia(slug);
  if (!media) notFound();
  const { venue, placements, packages } = media;

  const placementById = new Map(placements.map((p) => [p.id, p]));
  const openSlots = media.openSlots.map<AdvertiseSlot>((s) => {
    const placement = placementById.get(s.placementId);
    return {
      id: s.id,
      unitName: placement?.unitName ?? "Boulevard unit",
      format: placement?.format ?? undefined,
      locationNote: placement?.locationNote ?? undefined,
      startDate: s.startDate,
      endDate: s.endDate,
      price: s.pricePence ?? undefined,
    };
  });

  const fromPrice = openSlots
    .map((s) => s.price ?? Infinity)
    .reduce((a, b) => Math.min(a, b), Infinity);

  const stats = [
    venue.capacity
      ? { label: "Daily capacity", value: venue.capacity.toLocaleString("en-US") }
      : null,
    { label: "Digital screens", value: String(placements.length) },
    { label: "Slots open now", value: String(openSlots.length) },
    Number.isFinite(fromPrice)
      ? { label: "From", value: `${formatMoneyFromPence(fromPrice)}/wk` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <PublicSiteChrome>
      {/* Hero */}
      <Section className="border-b border-border/40 bg-[radial-gradient(circle_at_20%_20%,hsl(218,90%,30%,0.18),transparent_55%)]">
        <Container className="py-16">
          <Badge variant="info" className="mb-4">
            Venue media · {venue.name}
          </Badge>
          <h1 className="text-display max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            Advertise to the footfall at {venue.name}.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Put your brand on interactive Bright.Blue screens across the
            concourse — sponsor a show running in the halls, or simply reach the
            thousands of visitors moving through every day.
          </p>

          {stats.length > 0 && (
            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Open slots */}
      <Section>
        <Container className="py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-overline text-[var(--color-bb-cobalt)]">
                Open inventory
              </p>
              <h2 className="text-heading mt-1 text-2xl font-bold">
                Available ad slots
              </h2>
            </div>
          </div>
          <VenueAdvertiseBoard slots={openSlots} />
        </Container>
      </Section>

      {/* Packages / rate card */}
      {packages.length > 0 && (
        <Section className="border-t border-border/40">
          <Container className="py-14">
            <p className="text-overline text-[var(--color-bb-cobalt)]">
              Turnkey buys
            </p>
            <h2 className="text-heading mt-1 text-2xl font-bold">Packages</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id}>
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-foreground">{pkg.name}</h3>
                      {pkg.includesBrightBlue && (
                        <Badge variant="info" className="shrink-0">
                          Managed
                        </Badge>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                    )}
                    {pkg.pricePence != null && (
                      <p className="text-lg font-bold text-brand">
                        {formatMoneyFromPence(pkg.pricePence)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA */}
      <Section className="border-t border-border/40">
        <Container className="py-16 text-center">
          <h2 className="text-heading text-2xl font-bold">
            Not sure which screens are right for you?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell us your campaign and dates and the {venue.name} team will put
            together the perfect package against the right footfall.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/proposal"
              className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-bb-cobalt)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Talk to the team <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>
    </PublicSiteChrome>
  );
}
