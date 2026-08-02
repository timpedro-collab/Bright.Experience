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
    className: "bg-muted text-muted-foreground",
  },
  reserved: {
    label: "Reserved",
    className: "bg-warning/10 text-warning",
  },
  active: {
    label: "Live",
    className: "bg-success/10 text-success",
  },
  completed: {
    label: "Complete",
    className: "bg-brand/10 text-brand",
  },
};

export function SlotStatusBadge({ status }: { status: string }) {
  const style = SLOT_STATUS_STYLES[status] ?? SLOT_STATUS_STYLES.available;
  return (
    <Badge className={cn("border-0 text-[0.65rem]", style.className)}>
      {style.label}
    </Badge>
  );
}
