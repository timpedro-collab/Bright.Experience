/** Predicted vs Actual comparison table — shows delta between forecasted and real metrics */
"use client";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PredictedVsActualProps {
  predictions: Record<string, number>;
  actuals: Record<string, number>;
  /** Hide the card title when an external eyebrow already labels the section. */
  hideTitle?: boolean;
}

/** Formats metric keys from snake_case to Title Case */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Calculates percentage delta between actual and predicted */
function calcDelta(predicted: number, actual: number): number {
  if (predicted === 0) return actual > 0 ? 100 : 0;
  return ((actual - predicted) / predicted) * 100;
}

/** Renders a side-by-side comparison of predicted vs actual values with delta indicators */
export function PredictedVsActual({
  predictions,
  actuals,
  hideTitle = false,
}: PredictedVsActualProps) {
  const metrics = Object.keys(predictions);

  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      {!hideTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="text-heading text-base font-semibold text-foreground">
            Predicted vs actual
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={hideTitle ? "pt-6" : "pt-0"}>
        <div className="space-y-0">
          {/* Header row */}
          <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border/60">
            <span className="text-overline text-muted-foreground">Metric</span>
            <span className="text-overline text-muted-foreground text-right">
              Predicted
            </span>
            <span className="text-overline text-muted-foreground text-right">
              Actual
            </span>
            <span className="text-overline text-muted-foreground text-right">
              Delta
            </span>
          </div>

          {metrics.map((key) => {
            const predicted = predictions[key] ?? 0;
            const actual = actuals[key] ?? 0;
            const delta = calcDelta(predicted, actual);
            const isPositive = delta >= 0;

            return (
              <div
                key={key}
                className="grid grid-cols-4 gap-4 py-3 border-b border-border/60 last:border-0"
              >
                <span className="text-sm text-muted-foreground">
                  {formatLabel(key)}
                </span>
                <span className="text-sm text-muted-foreground text-right tabular-nums">
                  {predicted.toLocaleString("en-US")}
                </span>
                <span className="text-sm text-foreground font-medium text-right tabular-nums">
                  {actual.toLocaleString("en-US")}
                </span>
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 text-sm font-medium tabular-nums",
                    isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
