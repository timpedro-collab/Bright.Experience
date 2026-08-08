/** Magazine-style machine PDP — hero, specs, compatible games, packages */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Sparkles, Boxes, Cog, Check, Package, MapPin } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/catalog/GameCard";
import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { MediaGallery, type MediaItem } from "@/components/catalog/MediaGallery";
import { getMachineBySlug } from "@/lib/queries/machines";
import { getBenchmarks } from "@/lib/queries/benchmarks";
import {
  playsBenchmarkForMachine,
  formatPlaysBenchmark,
} from "@/lib/metrics/machine-benchmarks";
import { getTier, formatBandAmount } from "@/lib/pricing/tiers";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const m = await getMachineBySlug(slug);
  if (!m) return { title: "Machine not found" };
  return {
    title: m.name,
    description: m.tagline ?? m.description ?? "",
    openGraph: m.hero_image_url
      ? { images: [{ url: m.hero_image_url }] }
      : undefined,
  };
}

export default async function MachineDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const machine = await getMachineBySlug(slug);
  if (!machine) return notFound();

  const showstopper = getTier("showstopper")!;
  const fromPrice = formatBandAmount(
    showstopper.bands.uk.currency,
    showstopper.bands.uk.lowMinor,
  );

  const benchmarks = await getBenchmarks({ machineType: machine.name });
  const plays = playsBenchmarkForMachine(machine.name, benchmarks);

  const junctionRows =
    (machine.machine_games as unknown as { games: Record<string, unknown> }[] | null) ?? [];
  const games = junctionRows.map((mg) => mg.games).filter(Boolean);
  const packages = (machine.packages as Record<string, unknown>[] | null) ?? [];

  return (
    <>
      <Section spacing="md" className="border-b border-border/60">
        <Container>
          <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground">Catalog</Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/catalog/machines" className="hover:text-foreground">Machines</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/80">{machine.name}</span>
          </nav>

          <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <Badge variant="default" className="mb-4">Machine</Badge>
              <h1 className="text-display text-4xl text-foreground md:text-6xl">
                {machine.name}
              </h1>
              {machine.tagline && (
                <p className="mt-4 text-lg text-muted-foreground md:text-xl">
                  {machine.tagline}
                </p>
              )}
              {machine.description && (
                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
                  {machine.description}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" variant="brand" asChild>
                  <Link href={packages[0] ? `/proposal?package=${String(packages[0].slug)}` : "/proposal"}>
                    Request a quote
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="glass" asChild>
                  <Link href="/quiz">
                    <Sparkles className="h-4 w-4" /> Find similar
                  </Link>
                </Button>
              </div>
              {/* One killer stat, one all-in price line, one link — the
                  feature list lives further down, not in the hero. */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {plays && (
                  <span className="inline-flex items-baseline gap-1.5">
                    <span className="font-medium text-foreground">
                      {formatPlaysBenchmark(plays)}
                    </span>
                    <span className="text-xs">
                      fleet benchmark · {plays.sampleSize} measured events
                    </span>
                  </span>
                )}
                <span>
                  <span className="font-medium text-foreground">
                    From {fromPrice}
                  </span>{" "}
                  — wrap, game, crew and delivery included
                </span>
                <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
                  See activation tiers
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-border bg-[radial-gradient(ellipse_at_center,hsl(230,93%,53%,0.25),transparent_55%)]">
              {machine.hero_image_url ? (
                <Image
                  src={machine.hero_image_url}
                  alt={machine.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-heading text-8xl font-bold text-white/15">
                    {machine.name[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {(() => {
        const capacity = (machine.capacity_label as string | null) ?? null;
        const mechanisms = (machine.mechanisms as string[] | null) ?? [];
        const dispenses = (machine.dispenses as string[] | null) ?? [];
        const features = (machine.features as string[] | null) ?? [];
        const bestFor = (machine.best_for as string[] | null) ?? [];
        const hasSpecs =
          Boolean(capacity) ||
          mechanisms.length > 0 ||
          dispenses.length > 0 ||
          features.length > 0 ||
          bestFor.length > 0;
        if (!hasSpecs) return null;

        const dispenseLabel = dispenses.length > 0 ? "What it dispenses" : "Capabilities";
        const dispenseItems = dispenses.length > 0 ? dispenses : features;

        return (
          <Section className="border-b border-border/60">
            <Container>
              <div className="grid gap-12 md:grid-cols-2">
                <div>
                  <p className="text-overline text-muted-foreground mb-2">Specifications</p>
                  <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
                    At a glance
                  </h2>
                  <dl className="mt-6 space-y-5">
                    {capacity && (
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-[hsl(189,100%,75%)]">
                          <Boxes className="h-4 w-4" />
                        </span>
                        <div>
                          <dt className="text-overline text-muted-foreground">Capacity</dt>
                          <dd className="text-base font-medium text-foreground">{capacity}</dd>
                        </div>
                      </div>
                    )}
                    {mechanisms.length > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-[hsl(189,100%,75%)]">
                          <Cog className="h-4 w-4" />
                        </span>
                        <div>
                          <dt className="text-overline text-muted-foreground">
                            {mechanisms.length === 1 ? "Format" : "Dispense mechanisms"}
                          </dt>
                          <dd className="mt-1.5 flex flex-wrap gap-1.5">
                            {mechanisms.map((m) => (
                              <Badge key={m} variant="outline">
                                {m}
                              </Badge>
                            ))}
                          </dd>
                        </div>
                      </div>
                    )}
                  </dl>

                  {dispenseItems.length > 0 && (
                    <div className="mt-8">
                      <p className="text-overline text-muted-foreground mb-3 flex items-center gap-2">
                        <Package className="h-3.5 w-3.5" /> {dispenseLabel}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {dispenseItems.map((d) => (
                          <span
                            key={d}
                            className="rounded-full border border-border/60 bg-muted/30 px-3 py-1 text-sm text-foreground/80"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {bestFor.length > 0 && (
                  <div>
                    <p className="text-overline text-muted-foreground mb-2 flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" /> Where it works well
                    </p>
                    <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
                      Best-fit moments
                    </h2>
                    <ul className="mt-6 space-y-3">
                      {bestFor.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 rounded-[var(--radius-card)] border border-border/50 bg-muted/20 p-4"
                        >
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(189,100%,75%)]" />
                          <span className="text-sm leading-relaxed text-foreground/90 md:text-base">
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Container>
          </Section>
        );
      })()}

      {(() => {
        const raw = (machine.gallery_urls as string[] | null) ?? [];
        const galleryItems: MediaItem[] = raw.map((url) => ({
          url,
          type: (url.endsWith(".mp4") || url.endsWith(".webm") ? "video" : "image") as "video" | "image",
        }));
        if (galleryItems.length === 0) return null;
        return (
          <Section className="border-b border-border/60">
            <Container>
              <div className="mb-6">
                <p className="text-overline text-muted-foreground mb-2">Gallery</p>
                <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
                  See it in action
                </h2>
              </div>
              <MediaGallery items={galleryItems} />
            </Container>
          </Section>
        );
      })()}

      {games.length > 0 && (
        <Section className="border-b border-border/60">
          <Container>
            <div className="mb-8">
              <p className="text-overline text-muted-foreground mb-2">Compatible games</p>
              <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
                Games that run on the {machine.name}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((g, i) => (
                <GameCard
                  key={String(g.id)}
                  game={{
                    name: String(g.name),
                    slug: String(g.slug),
                    category: g.category as string | undefined,
                    thumbnailUrl: g.thumbnail_url as string | undefined,
                  }}
                  index={i}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {packages.length > 0 && (
        <Section>
          <Container>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-overline text-muted-foreground mb-2">Packages</p>
                <h2 className="text-heading text-3xl font-bold text-foreground md:text-4xl">
                  Configure your activation
                </h2>
              </div>
              <Button asChild variant="glass" size="sm">
                <Link href="/catalog/packages">Compare all packages</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p, i) => (
                <PackageTierCard
                  key={String(p.id)}
                  pkg={{
                    name: String(p.name),
                    slug: String(p.slug),
                    tier: String(p.tier),
                    durationDays: p.duration_days as number | null,
                    featuresJson: (p.features_json as string[] | undefined) ?? [],
                    isBookable: p.is_bookable as boolean,
                  }}
                  featured={i === 1}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
