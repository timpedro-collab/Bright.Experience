/** Visual commission breakdown with earned, pending, and paid totals */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { formatUSDFromCents } from "@/lib/currency";

interface CommissionTrackerProps {
  /** All amounts are integer cents. */
  totalEarned: number;
  pending: number;
  paid: number;
}

function formatCurrency(cents: number): string {
  return formatUSDFromCents(cents);
}

export function CommissionTracker({
  totalEarned,
  pending,
  paid,
}: CommissionTrackerProps) {
  const paidRatio = totalEarned > 0 ? Math.round((paid / totalEarned) * 100) : 0;

  const cards = [
    {
      label: "Total earned",
      value: formatCurrency(totalEarned),
      icon: DollarSign,
      accent: "text-emerald-400",
      bgAccent: "bg-emerald-500/10",
    },
    {
      label: "Pending",
      value: formatCurrency(pending),
      icon: Clock,
      accent: "text-amber-400",
      bgAccent: "bg-amber-500/10",
    },
    {
      label: "Paid out",
      value: formatCurrency(paid),
      icon: CheckCircle2,
      accent: "text-brand",
      bgAccent: "bg-brand/10",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="border-border/60 bg-muted/40 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div className={cn("rounded-lg p-2", card.bgAccent)}>
                  <Icon size={16} className={card.accent} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold text-heading", card.accent)}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/60 bg-muted/40 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Payout progress
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              {paidRatio}%
            </span>
          </div>
          <ProgressBar value={paid} max={totalEarned || 1} size="md" />
          <p className="mt-2 text-xs text-muted-foreground">
            {formatCurrency(paid)} of {formatCurrency(totalEarned)} paid out
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
