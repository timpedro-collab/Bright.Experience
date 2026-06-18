import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1",
    "rounded-[var(--radius-chip)] border px-2 py-0.5",
    "text-[0.625rem] font-semibold uppercase tracking-wider",
    "font-[var(--font-overline)] tabular-nums",
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  ),
  {
    variants: {
      variant: {
        // Token-aligned tone variants — match StatusBadge palette
        default:
          "border-primary/25 bg-primary/12 text-primary",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive/25 bg-destructive/12 text-destructive",
        outline: "border-border text-foreground",
        success:
          "border-success/25 bg-success/12 text-success",
        warning:
          "border-warning/25 bg-warning/12 text-warning",
        info:
          "border-info/25 bg-info/12 text-info",
        muted:
          "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
