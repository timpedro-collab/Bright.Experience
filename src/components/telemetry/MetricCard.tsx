/** Static metric card — displays a single KPI with icon and optional subtitle */
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "border-glass-border bg-surface-glass backdrop-blur-sm",
        className
      )}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
