/** Game detail page — editorial layout matching the machine PDP. */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";

import { getGameBySlug } from "@/lib/queries/games";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MachineCard } from "@/components/catalog/MachineCard";
import {
  EditionShell,
  EditionChrome,
  RidgeHero,
  EditionBody,
  EditionFooter,
} from "@/components/brand/edition-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand/editorial";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return {
    title: `${game.name} — Bright.Blue Games`,
    description:
      game.description ?? `Bright.Blue interactive game — ${game.name}.`,
    openGraph: game.thumbnail_url
      ? { images: [{ url: game.thumbnail_url }] }
      : undefined,
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return notFound();

  const objectives = (game.objectives as string[]) ?? [];
  const suitableFor = (game.suitable_for as string[]) ?? [];

  const junctionRows =
    (game.machine_games as unknown as {
      machines: Record<string, unknown>;
    }[] | null) ?? [];
  const machines = junctionRows.map((mg) => mg.machines).filter(Boolean);

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Catalog", href: "/catalog" },
          { label: "Games", href: "/catalog/games" },
          { label: game.name },
        ]}
      />

      <RidgeHero
        seed={`game::${slug}`}
        eyebrow={
          <div className="flex items-center gap-2">
            <Gamepad2 size={14} />
            {game.category ?? "Interactive Game"}
          </div>
        }
        title={game.name}
        subtitle={game.description}
        rightSlot={
          game.category && (
            <Badge variant="secondary">{game.category}</Badge>
          )
        }
      />

      <EditionBody>
        {game.thumbnail_url && (
          <section className="mb-10">
            <div className="relative aspect-video rounded-[var(--radius-card)] overflow-hidden border border-border/30">
              <Image
                src={game.thumbnail_url}
                alt={game.name}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </section>
        )}

        {(objectives.length > 0 || suitableFor.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
            {objectives.length > 0 && (
              <div>
                <EditorialEyebrow accent>Best for</EditorialEyebrow>
                <div className="flex flex-wrap gap-2 mt-3">
                  {objectives.map((obj) => (
                    <Badge key={obj} variant="outline">
                      {obj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {suitableFor.length > 0 && (
              <div>
                <EditorialEyebrow accent>Suitable for</EditorialEyebrow>
                <div className="flex flex-wrap gap-2 mt-3">
                  {suitableFor.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <Hairline className="opacity-60" />

        {machines.length > 0 && (
          <section className="py-8">
            <EditorialEyebrow accent>Compatible machines</EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[52ch]">
              This game runs on the following machines. Pick one to see
              pricing and packages.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {machines.map((m, i) => (
                <MachineCard
                  key={String(m.id)}
                  machine={{
                    name: String(m.name),
                    slug: String(m.slug),
                    tagline: m.tagline as string | undefined,
                    heroImageUrl: m.hero_image_url as string | undefined,
                  }}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        <Hairline className="opacity-60" />

        {/* Bottom CTA band */}
        <section className="py-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <div className="flex-1">
            <h2 className="text-heading text-xl font-bold text-foreground">
              Ready to play?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-[52ch]">
              Take our 2-minute quiz to find the perfect machine and package
              for your event, or browse the full catalog.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="brand">
              <Link href="/quiz">
                Take the quiz
                <ArrowRight size={14} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/catalog/games">
                <ArrowLeft size={14} />
                All games
              </Link>
            </Button>
          </div>
        </section>
      </EditionBody>

      <EditionFooter />
    </EditionShell>
  );
}
