import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Bright.Blue-styled textarea — same tone/spacing language as `<Input>`,
 * sized for short-to-medium free-text fields (review feedback, notes).
 */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, rows = 4, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex w-full rounded-[var(--radius-control)] border border-input",
        "bg-card/60 backdrop-blur-sm",
        "px-3.5 py-2.5 text-sm text-foreground leading-relaxed",
        "ring-offset-background transition-all duration-150",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y min-h-[80px]",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
