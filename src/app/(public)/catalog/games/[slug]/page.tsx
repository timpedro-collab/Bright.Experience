/** Game detail page — public */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameBySlug } from "@/lib/queries/games";
import { MachineCard } from "@/components/catalog/MachineCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.name,
    description: game.description ?? `Bright.Blue interactive game — ${game.name}.`,
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

  const junctionRows = (game.machine_games as unknown as { machines: Record<string, unknown> }[] | null) ?? [];
  const machines = junctionRows.map((mg) => mg.machines).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-12">
        <div className="relative aspect-video rounded-[var(--radius-card)] bg-gradient-to-br from-surface-glass to-card-dark flex items-center justify-center mb-8 overflow-hidden">
          {game.thumbnail_url ? (
            <Image
              src={game.thumbnail_url}
              alt={game.name}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <span className="text-6xl font-bold text-brand/20">{game.name[0]}</span>
          )}
        </div>
        <h1 className="text-heading text-3xl font-bold text-foreground mb-2">{game.name}</h1>
        {game.category && <Badge variant="secondary" className="mb-4">{game.category}</Badge>}
        {game.description && (
          <p className="text-sm text-text-secondary max-w-3xl mt-4">{game.description}</p>
        )}
      </div>

      {(objectives.length > 0 || suitableFor.length > 0) && (
        <>
          <Separator className="my-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {objectives.length > 0 && (
              <div>
                <h2 className="text-heading text-lg font-semibold text-foreground mb-3">Best For</h2>
                <div className="flex flex-wrap gap-2">
                  {objectives.map((obj) => (
                    <Badge key={obj} variant="outline">{obj}</Badge>
                  ))}
                </div>
              </div>
            )}
            {suitableFor.length > 0 && (
              <div>
                <h2 className="text-heading text-lg font-semibold text-foreground mb-3">Suitable For</h2>
                <div className="flex flex-wrap gap-2">
                  {suitableFor.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {machines.length > 0 && (
        <>
          <Separator className="my-8" />
          <h2 className="text-heading text-xl font-semibold text-foreground mb-6">Compatible Machines</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((m, i) => (
              <MachineCard
                key={String(m.id)}
                machine={{ name: String(m.name), slug: String(m.slug), tagline: m.tagline as string | undefined, heroImageUrl: m.hero_image_url as string | undefined }}
                index={i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
