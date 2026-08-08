/**
 * Bright Index placement chip — the badge (when earned) or the honest
 * band label, with the sample size that makes the claim credible.
 */
import Link from "next/link";
import { Award } from "lucide-react";

import type { IndexPlacement } from "@/lib/bright-index/percentile";
import { cn } from "@/lib/utils";

export function IndexPlacementChip({
  placement,
  className,
}: {
  placement: IndexPlacement;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {placement.badge ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/8 px-3 py-1 text-xs font-semibold text-brand">
          <Award size={12} />
          {placement.badge}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">{placement.label}</span>
      )}
      <Link
        href="/bright-index"
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        vs {placement.sampleSize} events on the Bright Index
      </Link>
    </div>
  );
}
