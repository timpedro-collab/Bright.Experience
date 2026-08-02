/**
 * What a unit like this usually does — the evidence behind a sponsor pitch
 * and the number an ops team plans stock against.
 *
 * Ranges only, always with the sample size behind them. A single number would
 * be read as a commitment, and the first show that lands under it costs more
 * trust than the tidier line ever bought.
 *
 * Renders nothing at all when we hold no comparable data, which is deliberate:
 * an absent line is honest, an invented one is not.
 */

import { Activity, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  expectationBasisLabel,
  formatRange,
  type Expectation,
} from "@/lib/metrics/expected-performance";

interface ExpectedPerformanceProps {
  plays: Expectation | null;
  leads: Expectation | null;
  /** Days the unit is on the floor, for the whole-show total. */
  days: number;
  /** Heading, so the same card can front an organizer page or a sponsor pitch. */
  title?: string;
}

function Line({
  icon: Icon,
  label,
  expectation,
  days,
}: {
  icon: React.ElementType;
  label: string;
  expectation: Expectation;
  days: number;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon size={12} /> {label}
      </p>
      <p className="text-heading mt-1 text-2xl font-bold tabular-nums text-foreground">
        {formatRange(expectation.perDayLow, expectation.perDayHigh)}
      </p>
      <p className="text-xs text-muted-foreground">
        a day
        {days > 1
          ? ` · ${formatRange(
              expectation.totalLow,
              expectation.totalHigh
            )} across ${days} days`
          : ""}
      </p>
    </div>
  );
}

export function ExpectedPerformance({
  plays,
  leads,
  days,
  title = "What a unit like this usually does",
}: ExpectedPerformanceProps) {
  if (!plays && !leads) return null;
  const basis = expectationBasisLabel((plays ?? leads)!);

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-heading text-sm font-semibold text-foreground">{title}</p>
        <div className="mt-4 grid grid-cols-2 gap-6">
          {plays && (
            <Line icon={Activity} label="Plays" expectation={plays} days={days} />
          )}
          {leads && (
            <Line icon={Users} label="Leads" expectation={leads} days={days} />
          )}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {`${basis}. A range, not a promise — footfall, placement and how long the doors are open all move it.`}
        </p>
      </CardContent>
    </Card>
  );
}
