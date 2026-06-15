/** Signature frosted-glass card surface used across every Cloud page. */
import * as React from "react";

import { cn } from "@/lib/utils";
import { SURFACE_CARD, SURFACE_SECTION_HEADER } from "@/lib/surfaces";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      SURFACE_CARD,
      "overflow-hidden",
      interactive &&
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer",
      className
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

export function GlassCardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4",
        SURFACE_SECTION_HEADER,
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
