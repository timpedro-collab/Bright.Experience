/**
 * The executive tier of the three-audience report: cost-per-lead, engaged
 * minutes, and benchmark context in one glance — the slide a CMO forwards
 * to a CFO without editing.
 */
import { Card, CardContent } from "@/components/ui/card";
import {
  engagedMinutes,
  formatEngagedMinutes,
  costPerEngagedMinutePence,
} from "@/lib/metrics/engaged-minutes";
import { cn } from "@/lib/utils";

interface ExecutiveSummaryProps {
  totalPlays: number;
  totalLeads: number;
  avgDwellSeconds: number | null;
  totalCostPence: number;
  costPerLeadPence: number | null;
  /** Pre-written benchmark verdict sentences, e.g. "18% above the venue-class median". */
  verdictSentences?: string[];
}

function formatPence(pence: number): string {
  const pounds = pence / 100;
  return pounds >= 100
    ? `£${Math.round(pounds).toLocaleString("en-GB")}`
    : `£${pounds.toFixed(2)}`;
}

export function ExecutiveSummary({
  totalPlays,
  totalLeads,
  avgDwellSeconds,
  totalCostPence,
  costPerLeadPence: cpl,
  verdictSentences = [],
}: ExecutiveSummaryProps) {
  const minutes = engagedMinutes(totalPlays, avgDwellSeconds);
  const perMinute = costPerEngagedMinutePence(
    totalCostPence > 0 ? totalCostPence : null,
    minutes,
  );

  const stats: Array<{ label: string; value: string; sub?: string }> = [];

  if (minutes != null) {
    stats.push({
      label: "Engaged minutes",
      value: minutes.toLocaleString("en-GB"),
      sub: formatEngagedMinutes(minutes),
    });
  }
  if (cpl != null && totalCostPence > 0 && totalLeads > 0) {
    stats.push({
      label: "Cost per lead",
      value: formatPence(cpl),
      sub: `${totalLeads.toLocaleString("en-GB")} leads captured`,
    });
  }
  if (perMinute != null) {
    stats.push({
      label: "Cost per engaged minute",
      value: formatPence(perMinute),
      sub: "voluntary brand attention, telemetry-verified",
    });
  }

  if (stats.length === 0 && verdictSentences.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="pt-6">
        <div
          className={cn(
            "grid gap-6",
            stats.length === 1 && "grid-cols-1",
            stats.length === 2 && "grid-cols-1 sm:grid-cols-2",
            stats.length >= 3 && "grid-cols-1 sm:grid-cols-3",
          )}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                {stat.value}
              </p>
              {stat.sub && (
                <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
        {verdictSentences.length > 0 && (
          <ul className="mt-5 space-y-1 border-t border-border/60 pt-4">
            {verdictSentences.map((sentence) => (
              <li key={sentence} className="text-sm text-foreground">
                {sentence}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
