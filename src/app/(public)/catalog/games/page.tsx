/** Games index — every active game with a category filter. */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GameCard } from "@/components/catalog/GameCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Container, Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { RidgeArtwork, EditorialEyebrow } from "@/components/brand";
import { getGames } from "@/lib/queries/games";

export const metadata: Metadata = {
  title: "Games",
  description:
    "Browse every Bright.Blue game — from one-tap arcade moments to memory matches and stage-driven crowd pulses.",
};

export default async function GamesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const games = await getGames();
  const categories = Array.from(
    new Set(games.map((g) => g.category).filter(Boolean) as string[])
  ).sort();
  const filterOptions = [
    { label: "All", value: "" },
    ...categories.map((c) => ({
      label: c.charAt(0).toUpperCase() + c.slice(1),
      value: c,
    })),
  ];
  const filtered =
    category && categories.includes(category)
      ? games.filter((g) => g.category === category)
      : games;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 ridge-color-cobalt"
          style={{ height: "clamp(240px, 28vw, 320px)" }}
        >
          <RidgeArtwork
            seed="catalog::games"
            lines={22}
            amplitude={70}
            className="text-[hsl(230,93%,53%)]"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background to-transparent"
          />
        </div>
        <Container className="relative pt-16 md:pt-20 pb-10">
          <EditorialEyebrow accent>The software</EditorialEyebrow>
          <h1 className="text-display mt-2 text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.1] text-foreground">
            The games.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg leading-relaxed">
            Every Bright.Blue activation runs on a game built for the moment —
            from sub-10-second arcade taps to multi-minute memory puzzles.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="brand">
              <Link href="/quiz">Find your match</Link>
            </Button>
            <Button asChild variant="glass">
              <Link href="/proposal">Get a proposal</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Section>
        <Container>
          {filterOptions.length > 1 && (
            <div className="mb-8">
              <CatalogFilters
                param="category"
                options={filterOptions}
                label="Filter games by category"
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-border/60 bg-muted/40 p-12 text-center text-muted-foreground">
              {category
                ? `No games in the "${category}" category right now.`
                : "The game catalogue is being prepared. Please check back soon."}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((g, i) => (
                <GameCard
                  key={g.slug}
                  game={{
                    name: g.name,
                    slug: g.slug,
                    category: g.category ?? undefined,
                    thumbnailUrl: g.thumbnail_url ?? undefined,
                  }}
                  index={i}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>

      <Section className="border-t border-border/60 bg-muted/30" spacing="md">
        <Container className="text-center">
          <h2 className="text-heading text-2xl font-semibold md:text-3xl">
            Not sure which game fits?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Our two-minute quiz pairs you with a machine and a game tuned to your
            event.
          </p>
          <Button asChild variant="brand" size="lg" className="mt-6">
            <Link href="/quiz">
              Take the quiz <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  );
}
