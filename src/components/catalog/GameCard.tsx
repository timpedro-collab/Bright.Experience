/** Game card for catalog grids — editorial preview tile */
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: {
    name: string;
    slug: string;
    category?: string;
    thumbnailUrl?: string | null;
  };
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  return (
    <Link
      href={`/catalog/games/${game.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-[var(--radius-card)] border border-border",
        "bg-card shadow-[var(--bb-shadow-card)]",
        "transition-all duration-300",
        "hover:border-ring/40 hover:-translate-y-1 hover:shadow-[var(--bb-shadow-premium)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "stagger-item"
      )}
      style={{ "--stagger-index": index } as React.CSSProperties}
    >
      <div className="relative aspect-video overflow-hidden bg-[radial-gradient(circle_at_50%_50%,hsl(230,93%,53%,0.18),transparent_60%)]">
        {game.thumbnailUrl ? (
          <Image
            src={game.thumbnailUrl}
            alt={game.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-heading text-5xl font-bold text-foreground/10">
              {game.name[0]}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all group-hover:bg-primary group-hover:border-primary">
          <Play className="h-3 w-3 fill-current" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <h3 className="text-heading text-sm font-semibold text-foreground truncate">
          {game.name}
        </h3>
        {game.category && (
          <Badge variant="outline" className="shrink-0 capitalize">
            {game.category}
          </Badge>
        )}
      </div>
    </Link>
  );
}
