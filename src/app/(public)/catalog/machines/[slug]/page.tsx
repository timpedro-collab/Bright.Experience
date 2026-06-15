/** Magazine-style machine PDP — hero, specs, compatible games, packages */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";

import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/catalog/GameCard";
import { PackageTierCard } from "@/components/catalog/PackageTierCard";
import { MediaGallery, type MediaItem } from "@/components/catalog/MediaGallery";
import { getMachineBySlug } from "@/lib/queries/machines";

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

  const junctionRows =
    (machine.machine_games as unknown as { games: Record<string, unknown> }[] | null) ?? [];
  const games = junctionRows.map((mg) => mg.games).filter(Boolean);
  const packages = (machine.packages as Record<string, unknown>[] | null) ?? [];

  return (
    <>
      <Section spacing="md" className="border-b border-white/[0.06]">
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
                  <Link href={packages[0] ? `/catalog/packages/${String(packages[0].slug)}` : "/proposal"}>
                    {packages[0]?.is_bookable ? "Book this machine" : "Request a quote"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="glass" asChild>
                  <Link href="/quiz">
                    <Sparkles className="h-4 w-4" /> Find similar
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-white/10 bg-[radial-gradient(ellipse_at_center,hsl(230,93%,53%,0.25),transparent_55%)]">
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
        const raw = (machine.gallery_urls as string[] | null) ?? [];
        const galleryItems: MediaItem[] = raw.map((url) => ({
          url,
          type: (url.endsWith(".mp4") || url.endsWith(".webm") ? "video" : "image") as "video" | "image",
        }));
        if (galleryItems.length === 0) return null;
        return (
          <Section className="border-b border-white/[0.06]">
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
        <Section className="border-b border-white/[0.06]">
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
                    basePrice: p.base_price as number | null,
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
