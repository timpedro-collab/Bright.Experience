/** Report highlights grid — photo gallery with optional stat overlays */
import NextImage from "next/image";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon } from "lucide-react";

interface Highlight {
  url?: string;
  caption?: string;
  stat?: string;
}

interface ReportHighlightsProps {
  highlights: Highlight[];
}

// Decorative tile fills stay in the cobalt→cyan brand family — status
// colours (success/warning/destructive) are information, never decoration.
const GRADIENT_PLACEHOLDERS = [
  "from-brand/30 to-brand-soft/20",
  "from-brand-soft/30 to-brand-cyan/15",
  "from-brand-cyan/25 to-brand/15",
  "from-brand-deep/35 to-brand-soft/20",
  "from-brand/20 to-brand-cyan/25",
  "from-brand-soft/20 to-brand/30",
];

/** Renders a 3-column photo grid with optional stat overlays and gradient placeholders */
export function ReportHighlights({ highlights }: ReportHighlightsProps) {
  if (highlights.length === 0) return null;

  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-heading text-base font-semibold text-foreground">
          Event Highlights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {highlights.map((item, i) => (
            <div key={i} className="relative group overflow-hidden rounded-[var(--radius-card)]">
              {item.url ? (
                <div className="relative h-48 w-full overflow-hidden rounded-[var(--radius-card)]">
                  <NextImage
                    src={item.url}
                    alt={item.caption ?? `Highlight ${i + 1}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div
                  className={cn(
                    "w-full h-48 rounded-[var(--radius-card)] bg-gradient-to-br flex items-center justify-center",
                    GRADIENT_PLACEHOLDERS[i % GRADIENT_PLACEHOLDERS.length]
                  )}
                >
                  <ImageIcon
                    size={32}
                    className="text-muted-foreground opacity-40"
                  />
                </div>
              )}

              {item.stat && (
                <Badge variant="info" className="absolute top-3 right-3 backdrop-blur-sm">
                  {item.stat}
                </Badge>
              )}

              {item.caption && (
                /* Literal scrim + white caption over photography — correct in
                   both themes, don't tokenize (contract §2.7). */
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-[var(--radius-card)]">
                  <p className="text-xs text-white font-medium">
                    {item.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
