/**
 * Endowed-progress header for the proposal microsite — shows the buyer
 * arriving at step 2 of 4 with the first steps already banked, so the path
 * to booked reads as mostly walked rather than about to begin.
 */
import { Check } from "lucide-react";


import { cn } from "@/lib/utils";
import type { ProposalJourney as Journey } from "@/lib/proposals/proposal-extras";

export function ProposalJourney({ journey }: { journey: Journey }) {
  return (
    <div className="mb-10">
      <ol className="flex items-center justify-center gap-0">
        {journey.steps.map((step, i) => (
          <li key={step.label} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px w-6 sm:w-10",
                  step.state === "upcoming" ? "bg-border" : "bg-[var(--color-bb-cobalt)]/50",
                )}
              />
            )}
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums",
                  step.state === "done" &&
                    "bg-[var(--color-bb-cobalt)] text-white",
                  step.state === "current" &&
                    "border-2 border-[var(--color-bb-cobalt)] text-[var(--color-bb-cobalt)]",
                  step.state === "upcoming" &&
                    "border border-border text-muted-foreground",
                )}
              >
                {step.state === "done" ? (
                  <Check className="size-3" aria-hidden />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "hidden text-xs sm:inline",
                  step.state === "current"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {journey.caption}
      </p>
    </div>
  );
}
