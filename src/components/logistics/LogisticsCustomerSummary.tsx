/** Simplified logistics summary for customer-facing view — key dates & status */
import { Truck, Package, ArrowDownToLine, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { LogisticsEntry } from "@/types";

const TYPE_LABELS: Record<string, { label: string; Icon: React.ElementType }> = {
  delivery: { label: "Delivery", Icon: Truck },
  setup: { label: "Setup", Icon: Package },
  collection: { label: "Collection", Icon: ArrowDownToLine },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

interface LogisticsCustomerSummaryProps {
  entries: LogisticsEntry[];
}

export function LogisticsCustomerSummary({ entries }: LogisticsCustomerSummaryProps) {
  const keyEntries = entries.filter(
    (e) => e.entryType === "delivery" || e.entryType === "setup" || e.entryType === "collection"
  );

  if (keyEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Logistics details will appear here once confirmed by the team.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {keyEntries.map((entry) => {
        const meta = TYPE_LABELS[entry.entryType] ?? TYPE_LABELS.delivery;
        const isComplete = entry.status === "completed";
        return (
          <Card key={entry.id} className="p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <meta.Icon
                size={16}
                className={cn(
                  isComplete ? "text-success" : "text-muted-foreground"
                )}
              />
              <h4 className="text-sm font-semibold text-foreground">
                {meta.label}
              </h4>
            </div>

            {entry.scheduledDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock size={12} />
                {formatDate(entry.scheduledDate)}
                {entry.scheduledTime && ` at ${entry.scheduledTime}`}
              </p>
            )}

            <div className="flex items-center gap-1.5 text-xs">
              {isComplete ? (
                <>
                  <CheckCircle2 size={12} className="text-success" />
                  <span className="text-success font-medium">Completed</span>
                </>
              ) : (
                <>
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      entry.status === "in_transit"
                        ? "bg-warning"
                        : entry.status === "confirmed"
                          ? "bg-brand"
                          : "bg-muted-foreground/40"
                    )}
                  />
                  <span className="text-muted-foreground capitalize">
                    {entry.status.replace("_", " ")}
                  </span>
                </>
              )}
            </div>

            {entry.trackingReference && (
              <p className="text-xs text-muted-foreground mt-auto pt-2 border-t border-border/30">
                Ref: {entry.trackingReference}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
