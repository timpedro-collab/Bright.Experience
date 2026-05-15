/** Card displaying a single sponsorship slot with status and reserve action. */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface SponsorshipSlotCardProps {
  slot: {
    id: string;
    startDate: string;
    endDate: string;
    price?: number;
    status: string;
  };
  onReserve?: (slotId: string) => void;
}

const STATUS_CONFIG: Record<string, { class: string; label: string }> = {
  available: { class: "bg-emerald-500/20 text-emerald-400", label: "Available" },
  reserved: { class: "bg-amber-500/20 text-amber-400", label: "Reserved" },
  active: { class: "bg-blue-500/20 text-blue-400", label: "Active" },
  completed: { class: "bg-zinc-500/20 text-zinc-400", label: "Completed" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function SponsorshipSlotCard({ slot, onReserve }: SponsorshipSlotCardProps) {
  const config = STATUS_CONFIG[slot.status] ?? STATUS_CONFIG.available;

  return (
    <Card className="card-interactive">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs", config.class)}>
            {config.label}
          </Badge>
          {slot.price != null && (
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <DollarSign size={14} className="text-brand" />
              {slot.price.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar size={12} />
          <span>
            {formatDate(slot.startDate)} — {formatDate(slot.endDate)}
          </span>
        </div>

        {slot.status === "available" && onReserve && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onReserve(slot.id)}
          >
            Reserve Slot
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
