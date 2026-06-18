/**
 * PlacementPlaceholder — the clearly-marked stand-in shown inside a machine
 * preview's overlay rect when no real creative (or final Theo art) is present.
 *
 * It tells everyone exactly which machine + which position this slot is for
 * (letter badge + label), so the absence of art reads as "reserved, awaiting
 * upload" rather than a broken render.
 */

import { cn } from "@/lib/utils";
import type { PlacementSlotDefinition } from "@/lib/asset-requirements/slot-registry";

interface PlacementPlaceholderProps {
  slot: PlacementSlotDefinition;
  className?: string;
  style?: React.CSSProperties;
}

export function PlacementPlaceholder({
  slot,
  className,
  style,
}: PlacementPlaceholderProps) {
  return (
    <div
      aria-label={`Placeholder: ${slot.placeholderLabel}`}
      className={cn(
        "pointer-events-none absolute flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-primary/50 bg-primary/10 p-1 text-center backdrop-blur-[1px]",
        className,
      )}
      style={style}
    >
      <span className="inline-flex size-5 items-center justify-center rounded-full border border-primary/50 bg-primary/20 text-[10px] font-bold text-primary">
        {slot.slotLetter}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wide text-primary/90">
        Placeholder
      </span>
      <span className="line-clamp-2 text-[9px] leading-tight text-foreground/70">
        {slot.placementLabel}
      </span>
    </div>
  );
}
