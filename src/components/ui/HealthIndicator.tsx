/** Health status dot indicator with optional pulse animation */
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/types";

const DOT_STYLES: Record<HealthStatus, { bg: string; ring: string; pulse: string }> = {
  green: { bg: "bg-success", ring: "ring-success/20", pulse: "bg-success/40" },
  amber: { bg: "bg-warning", ring: "ring-warning/20", pulse: "bg-warning/40" },
  red: { bg: "bg-destructive", ring: "ring-destructive/20", pulse: "bg-destructive/40" },
};

const SIZE_CLASSES = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

export function HealthDot({
  status,
  size = "md",
  pulse = false,
}: {
  status: HealthStatus;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}) {
  const styles = DOT_STYLES[status];

  return (
    <span className="relative inline-flex">
      {pulse && status !== "green" && (
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full animate-ping",
            styles.pulse
          )}
          style={{ animationDuration: "2s" }}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full ring-2",
          SIZE_CLASSES[size],
          styles.bg,
          styles.ring
        )}
      />
    </span>
  );
}
