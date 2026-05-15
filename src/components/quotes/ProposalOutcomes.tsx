/** ProposalOutcomes — projected interactions / leads / impressions */
import { Eye, Target, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProposalOutcomesProps {
  estimatedInteractions?: number | null;
  estimatedLeads?: number | null;
  estimatedImpressions?: number | null;
}

export function ProposalOutcomes({
  estimatedInteractions,
  estimatedLeads,
  estimatedImpressions,
}: ProposalOutcomesProps) {
  const hasAny =
    estimatedInteractions != null ||
    estimatedLeads != null ||
    estimatedImpressions != null;

  if (!hasAny) return null;

  return (
    <Card tone="subtle" className="print-break-inside-avoid">
      <CardHeader className="px-10 pt-10 pb-3 md:px-12 md:pt-12">
        <p className="text-overline text-muted-foreground mb-1">Modelled outcomes</p>
        <CardTitle className="text-2xl">Projected performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-10 pb-10 md:px-12 md:pb-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {estimatedInteractions != null && (
            <OutcomeTile
              icon={Users}
              value={estimatedInteractions}
              label="Interactions"
            />
          )}
          {estimatedLeads != null && (
            <OutcomeTile
              icon={Target}
              value={estimatedLeads}
              label="Leads captured"
            />
          )}
          {estimatedImpressions != null && (
            <OutcomeTile
              icon={Eye}
              value={estimatedImpressions}
              label="Impressions"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Modelled against Bright.Blue benchmark data for similar location tier
          and event type. Actuals will be reported live via the activation
          dashboard.
        </p>
      </CardContent>
    </Card>
  );
}

function OutcomeTile({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
}) {
  return (
    <div className="print-break-inside-avoid rounded-[var(--radius-control)] border border-white/[0.06] bg-white/[0.02] p-6">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-display text-3xl font-bold text-foreground tabular-nums leading-none md:text-4xl">
        {value.toLocaleString("en-GB")}+
      </p>
      <p className="mt-2 text-overline text-muted-foreground">{label}</p>
    </div>
  );
}
