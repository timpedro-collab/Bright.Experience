/** Report metric card — displays a single KPI with optional delta indicator */
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
}

/** Renders a glassmorphic KPI card with icon, value, and optional trend delta */
export function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  positive,
}: MetricCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 border border-brand/15">
          <Icon size={14} className="text-brand" />
        </div>
        <span className="text-overline text-text-muted">{label}</span>
      </div>
      <p className="text-heading text-2xl font-bold text-text-primary tabular-nums mb-1">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "text-xs",
            positive === true && "text-success",
            positive === false && "text-destructive",
            positive === undefined && "text-text-secondary"
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
