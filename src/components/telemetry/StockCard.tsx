/**
 * Live stock banner — prizes/samples remaining, a depletion bar, and a
 * reload estimate at the current play pace, so ops plan the reload from
 * the dashboard instead of being messaged from the stand (P2.2).
 */
"use client";

import { PackageOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStableStatus } from "@/hooks/useStableStatus";

/** Share of capacity at which the display flips to the "reload soon" state. */
const LOW_STOCK_THRESHOLD = 0.15;

interface StockCardProps {
  remaining: number;
  capacity: number;
  /** Minutes until empty at the current play pace; null when pace is unknown. */
  reloadEtaMinutes: number | null;
}

function formatEta(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `~${hours}h ${rest}m` : `~${hours}h`;
}

export function StockCard({ remaining, capacity, reloadEtaMinutes }: StockCardProps) {
  const pct = capacity > 0 ? Math.min(100, Math.round((remaining / capacity) * 100)) : 0;
  const rawLow = capacity > 0 && remaining <= capacity * LOW_STOCK_THRESHOLD;
  // Low-stock colours flip at the 15% threshold — debounce so the bar doesn't strobe.
  const isLow = useStableStatus(rawLow);

  return (
    <Card
      className={cn(
        "border-glass-border bg-surface-glass backdrop-blur-sm",
        isLow && "border-warning/40"
      )}
    >
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isLow ? "bg-warning/10 text-warning" : "bg-brand/10 text-brand"
          )}
        >
          <PackageOpen size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-muted-foreground">Stock remaining</p>
            <p className="text-heading text-lg font-bold tabular-nums text-foreground">
              {remaining.toLocaleString("en-US")}
              <span className="text-sm font-medium text-muted-foreground">
                {" "}
                / {capacity.toLocaleString("en-US")}
              </span>
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Stock remaining"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-700",
                isLow ? "bg-warning" : "bg-brand"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p
            className={cn(
              "mt-1.5 text-xs",
              isLow ? "font-medium text-warning" : "text-muted-foreground"
            )}
          >
            {remaining === 0
              ? "Machine is empty — reload needed now."
              : reloadEtaMinutes != null
                ? `${isLow ? "Running low — " : ""}empty in ${formatEta(reloadEtaMinutes)} at the current pace.`
                : isLow
                  ? "Running low — plan a reload."
                  : `${pct}% of the loaded stock is still available.`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
