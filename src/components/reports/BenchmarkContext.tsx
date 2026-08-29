/** Presentational card comparing an event to its prior show and venue-class medians. */
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BenchmarkContext } from "@/lib/queries/benchmark-context";
import type { BenchmarkVerdict } from "@/lib/metrics/benchmark-compare";

function DirectionIndicator({ direction }: { direction: BenchmarkVerdict["direction"] }) {
  const className = cn(
    "inline-flex shrink-0",
    direction === "above" && "text-success",
    direction === "level" && "text-muted-foreground",
    direction === "below" && "text-warning",
  );

  if (direction === "above") {
    return <ArrowUp size={14} className={className} aria-hidden />;
  }
  if (direction === "below") {
    return <ArrowDown size={14} className={className} aria-hidden />;
  }
  return <Minus size={14} className={className} aria-hidden />;
}

function VerdictRow({ verdict }: { verdict: BenchmarkVerdict }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <DirectionIndicator direction={verdict.direction} />
      <div>
        <p className="font-medium text-foreground">{verdict.label}</p>
        <p className="text-muted-foreground">{verdict.sentence}</p>
      </div>
    </li>
  );
}

/** Renders benchmark comparisons against the prior event and venue-class medians. */
export function BenchmarkContextCard({ context }: { context: BenchmarkContext }) {
  const { lastEvent, venueClass } = context;

  if (!lastEvent && !venueClass) return null;

  return (
    <Card tone="subtle">
      <CardHeader className="pb-3">
        <CardTitle className="text-heading text-base font-semibold text-foreground">
          In context
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {lastEvent ? (
          <section role="region" aria-label={`vs your last event — ${lastEvent.eventName}`}>
            <h3 className="text-sm font-medium text-foreground">
              vs your last event — {lastEvent.eventName}
            </h3>
            <ul className="mt-3 space-y-3">
              {lastEvent.verdicts.map((verdict) => (
                <VerdictRow key={`last-${verdict.metric}`} verdict={verdict} />
              ))}
            </ul>
          </section>
        ) : null}

        {venueClass ? (
          <section
            role="region"
            aria-label={`vs venues like this one (n = ${venueClass.sampleSize})`}
          >
            <h3 className="text-sm font-medium text-foreground">
              vs venues like this one (n = {venueClass.sampleSize})
            </h3>
            {venueClass.sampleSize < 5 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Early data — treat as directional.
              </p>
            ) : null}
            <ul className="mt-3 space-y-3">
              {venueClass.verdicts.map((verdict) => (
                <VerdictRow key={`venue-${verdict.metric}`} verdict={verdict} />
              ))}
            </ul>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
