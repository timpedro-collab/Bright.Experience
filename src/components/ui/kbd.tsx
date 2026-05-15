/** Keyboard shortcut chip used in command palette hints and tooltips */
import * as React from "react";
import { cn } from "@/lib/utils";

export const Kbd = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center",
        "rounded-md border border-white/12 bg-white/[0.04]",
        "px-1.5 text-[0.625rem] font-mono font-medium text-muted-foreground",
        "shadow-[0_1px_0_0_hsl(0_0%_0%_/_0.25)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
);
Kbd.displayName = "Kbd";
