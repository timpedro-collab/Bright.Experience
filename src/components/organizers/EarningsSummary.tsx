/** Portfolio-level earnings figures for the organizer rev-share dashboard. */
import { Card, CardContent } from "@/components/ui/card";
import { formatMoneyFromPence } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { OrganizerEarnings } from "@/lib/queries/organizer-earnings";

interface EarningsSummaryProps {
  earnings: OrganizerEarnings;
}

export function EarningsSummary({ earnings }: EarningsSummaryProps) {
  const stats = [
    {
      label: "Earned to date",
      value: formatMoneyFromPence(earnings.soldMarginPence),
      isCount: false,
    },
    {
      label: "In pipeline",
      value: formatMoneyFromPence(earnings.pipelineMarginPence),
      isCount: false,
    },
    {
      label: "Sponsorships sold",
      value: String(earnings.soldCount),
      isCount: true,
    },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} tone="subtle">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={cn(
                "mt-2 text-2xl font-bold tabular-nums text-foreground",
                stat.isCount && "tracking-tight"
              )}
            >
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
