/** Cost-per-lead card — calculates CPL from total cost and leads, with industry comparison */
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface CostPerLeadCardProps {
  totalCost: number;
  totalLeads: number;
  industryCPL?: number;
}

/** Renders the calculated CPL with optional comparison against industry average */
export function CostPerLeadCard({
  totalCost,
  totalLeads,
  industryCPL,
}: CostPerLeadCardProps) {
  const cpl = totalLeads > 0 ? totalCost / totalLeads : 0;
  const isBelowIndustry = industryCPL ? cpl < industryCPL : undefined;
  const savingsPercent =
    industryCPL && industryCPL > 0
      ? ((industryCPL - cpl) / industryCPL) * 100
      : undefined;

  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-heading text-base font-semibold text-foreground flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 border border-brand/15">
            <DollarSign size={14} className="text-brand" />
          </div>
          Cost Per Lead
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-heading text-3xl font-bold text-foreground tabular-nums mb-1">
          R{cpl.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          R{totalCost.toLocaleString()} total /{" "}
          {totalLeads.toLocaleString()} leads
        </p>

        {industryCPL !== undefined && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2",
              isBelowIndustry
                ? "bg-success/10 border border-success/20"
                : "bg-destructive/10 border border-destructive/20"
            )}
          >
            {isBelowIndustry ? (
              <TrendingDown size={14} className="text-success" />
            ) : (
              <TrendingUp size={14} className="text-destructive" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isBelowIndustry ? "text-success" : "text-destructive"
              )}
            >
              {isBelowIndustry
                ? `${savingsPercent?.toFixed(0)}% below industry avg (R${industryCPL.toFixed(2)})`
                : `${Math.abs(savingsPercent ?? 0).toFixed(0)}% above industry avg (R${industryCPL.toFixed(2)})`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
