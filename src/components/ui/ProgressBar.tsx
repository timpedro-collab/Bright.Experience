/** Animated progress bar with optional label */
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "sm",
  showLabel = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex-1 overflow-hidden rounded-full bg-muted/40",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-brand-soft transition-all duration-500"
          style={{
            width: `${percentage}%`,
            transitionTimingFunction: "var(--bb-ease-emphasized)",
          }}
        />
      </div>
      {showLabel && (
        <span className="text-overline text-muted-foreground tabular-nums">
          {percentage}%
        </span>
      )}
    </div>
  );
}
