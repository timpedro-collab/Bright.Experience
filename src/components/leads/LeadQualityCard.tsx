/** Presentational card summarising verified lead quality for an event. */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeadQualitySummary } from "@/lib/queries/lead-quality";
import { cn } from "@/lib/utils";

function formatRowCount(count: number): string {
  return count > 0 ? count.toLocaleString("en-US") : "—";
}

const BREAKDOWN_ROWS: Array<{
  key: keyof Pick<
    LeadQualitySummary,
    "total" | "repeatPlayers" | "disposable" | "invalid" | "unchecked"
  >;
  label: string;
}> = [
  { key: "total", label: "Total captured" },
  { key: "repeatPlayers", label: "Repeat players (deduped out)" },
  { key: "disposable", label: "Disposable domains" },
  { key: "invalid", label: "Invalid addresses" },
  { key: "unchecked", label: "Awaiting check (unchecked)" },
];

/** Headline verified-lead count plus a compact quality breakdown. */
export function LeadQualityCard({ summary }: { summary: LeadQualitySummary }) {
  if (summary.total === 0) {
    return (
      <Card tone="subtle">
        <CardHeader className="pb-3">
          <CardTitle>Lead quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No leads captured yet.</p>
        </CardContent>
      </Card>
    );
  }

  const showScreeningNote =
    summary.unchecked > 0 && summary.unchecked === summary.total;

  return (
    <Card tone="subtle">
      <CardHeader className="pb-3">
        <CardTitle>Lead quality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p
            className="text-heading text-4xl font-bold tabular-nums text-foreground"
            aria-label={`${summary.verified} verified leads`}
          >
            {summary.verified.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            verified leads — deduped, syntax-checked, no disposable domains
          </p>
        </div>

        <dl className="space-y-2">
          {BREAKDOWN_ROWS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd
                className={cn(
                  "font-medium tabular-nums text-foreground",
                  summary[key] === 0 && "text-muted-foreground",
                )}
              >
                {formatRowCount(summary[key])}
              </dd>
            </div>
          ))}
        </dl>

        {showScreeningNote && (
          <p className="text-xs text-muted-foreground">
            Quality screening runs as leads arrive.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
