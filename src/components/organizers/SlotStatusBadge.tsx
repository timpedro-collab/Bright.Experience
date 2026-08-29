/**
 * Status chip for a sponsorship slot.
 *
 * Shared by the Show Command inventory list and the sponsors tab so a slot
 * never reads one way on one screen and another way on the next.
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SLOT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  available: {
    label: "Available",
    className: "bg-muted text-muted-foreground border-border",
  },
  reserved: {
    label: "Reserved",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  active: {
    label: "Live",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  completed: {
    label: "Complete",
    className: "bg-success/15 text-success border-success/30",
  },
};

export function SlotStatusBadge({ status }: { status: string }) {
  const style = SLOT_STATUS_STYLES[status] ?? SLOT_STATUS_STYLES.available;
  return (
    <Badge className={cn("text-[0.65rem]", style.className)}>
      {style.label}
    </Badge>
  );
}
