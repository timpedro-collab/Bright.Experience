/** Presentational prize/sample stock telemetry for an event snapshot. */
import { Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const LOW_STOCK_PERCENT = 25;
const CRITICAL_STOCK_PERCENT = 15;

export interface StockTelemetryCardProps {
  stockRemaining: number | null;
  stockCapacity: number | null;
  totalPrizes: number;
}

function stockPercent(remaining: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.round((remaining / capacity) * 100);
}

/** Renders remaining stock, capacity progress, and prizes dispensed. */
export function StockTelemetryCard({
  stockRemaining,
  stockCapacity,
  totalPrizes,
}: StockTelemetryCardProps) {
  const hasCapacity =
    stockCapacity != null && stockCapacity > 0 && stockRemaining != null;
  const percent = hasCapacity
    ? stockPercent(stockRemaining, stockCapacity)
    : null;

  const barTone =
    percent == null
      ? "bg-primary"
      : percent < CRITICAL_STOCK_PERCENT
        ? "[&>div]:bg-destructive"
        : percent < LOW_STOCK_PERCENT
          ? "[&>div]:bg-warning"
          : "[&>div]:bg-primary";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-muted-foreground" />
          <CardTitle className="text-base font-semibold">
            Prize &amp; sample stock
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCapacity ? (
          <>
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {stockRemaining!.toLocaleString("en-US")} of{" "}
                  {stockCapacity!.toLocaleString("en-US")} units remaining
                </p>
                <span className="text-sm font-medium tabular-nums">{percent}%</span>
              </div>
              <Progress
                value={percent ?? 0}
                className={cn("h-2", barTone)}
                aria-label="Stock remaining"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {totalPrizes.toLocaleString("en-US")}
              </span>{" "}
              prizes dispensed
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No stock plan configured — capacity comes from the product
            configuration.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
