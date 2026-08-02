/**
 * Proof from other activations, as numbers rather than adjectives.
 *
 * A sponsor deciding on a slot has no reference point for what one of these
 * machines does, and the fastest way to give them one is somebody else's
 * result. Only studies carrying a hard number get here — see
 * `toCaseStudyProof` — because a strip that mixes numbers with prose makes the
 * prose look like the excuse.
 */

import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CaseStudyProof } from "@/lib/marketing/case-study-stats";

interface CaseStudyStripProps {
  studies: CaseStudyProof[];
  title?: string;
}

export function CaseStudyStrip({
  studies,
  title = "What these machines have done elsewhere",
}: CaseStudyStripProps) {
  if (studies.length === 0) return null;

  return (
    <section>
      <p className="text-heading text-sm font-semibold text-foreground">{title}</p>
      {/* A single study stretched across three columns turns its photo into a
          billboard; the grid only goes wide once there is enough to fill it. */}
      <div
        className={cn(
          "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2",
          studies.length > 2 && "lg:grid-cols-3"
        )}
      >
        {studies.map((study) => (
          <Card key={study.id} className="overflow-hidden">
            {study.heroImageUrl && (
              <div className="relative aspect-[16/10] w-full bg-foreground/5">
                <Image
                  src={study.heroImageUrl}
                  alt={study.clientName ?? study.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="p-4">
              <p className="text-sm font-medium text-foreground">
                {study.clientName ?? study.title}
              </p>
              <ul className="mt-2 space-y-1">
                {study.stats.map((stat) => (
                  <li key={stat.label} className="text-xs text-muted-foreground">
                    <span className="font-semibold tabular-nums text-foreground">
                      {stat.value}
                    </span>{" "}
                    {stat.label}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
