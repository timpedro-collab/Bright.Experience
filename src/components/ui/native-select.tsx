/**
 * NativeSelect — a `<select>` styled to match the shadcn Select trigger.
 *
 * Used where the control has to work well on a phone: on mobile this opens
 * the OS picker, which beats a custom listbox for someone standing on a show
 * floor one-handed. Visually identical to `SelectTrigger` so a form can mix
 * the two without looking inconsistent.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
      aria-hidden
    />
  </div>
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
