/**
 * CollapsibleSection — a quiet, native `<details>`-based disclosure.
 *
 * Used to push secondary content (event details, the numbers) into a calm
 * lower zone the customer can open on demand, without stealing attention from
 * the action block above. Native `<details>` means it needs no client JS and
 * is safe inside server components.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border/60 px-6 py-5">{children}</div>
    </details>
  );
}
