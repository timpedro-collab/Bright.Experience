/** Estimated outcomes card shown after proposal intake submission */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Eye, Clock } from "lucide-react";

interface ValueContextCardProps {
  footfallEstimate?: string;
}

const METRICS = [
  {
    icon: Users,
    label: "Estimated Interactions",
    calc: (footfall: number) => Math.round(footfall * 0.35),
    suffix: "+",
  },
  {
    icon: Target,
    label: "Estimated Leads",
    calc: (footfall: number) => Math.round(footfall * 0.12),
    suffix: "+",
  },
  {
    icon: Eye,
    label: "Media Impressions",
    calc: (footfall: number) => Math.round(footfall * 2.5),
    suffix: "+",
  },
] as const;

/** Displays projected event outcomes based on footfall estimate. */
export function ValueContextCard({ footfallEstimate }: ValueContextCardProps) {
  const footfall = parseInt(footfallEstimate ?? "1000", 10) || 1000;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your event could generate:</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            const value = metric.calc(footfall);
            return (
              <div key={metric.label} className="text-center space-y-1">
                <Icon size={20} className="mx-auto text-brand" />
                <p className="text-xl font-bold text-foreground">
                  {value.toLocaleString("en-US")}
                  {metric.suffix}
                </p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-brand/8 px-4 py-3">
          <Clock size={16} className="text-brand shrink-0" />
          <p className="text-sm text-muted-foreground">
            We aim to deliver your tailored proposal within{" "}
            <span className="font-semibold text-foreground">4 hours</span>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
