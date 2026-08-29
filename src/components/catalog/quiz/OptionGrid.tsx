/** Single/multi option grid for recommendation quiz steps. */
"use client";

import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuizStep } from "./quiz-data";
import { QUIZ_ICONS } from "./quiz-icons";

export function OptionGrid({
  step,
  selected,
  onPickSingle,
  onToggleMulti,
}: {
  step: QuizStep;
  selected: string[];
  onPickSingle: (value: string) => void;
  onToggleMulti: (value: string) => void;
}) {

  const multi = step.kind === "multi";
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={step.question} className="grid gap-3 sm:grid-cols-2">
      {(step.options ?? []).map((opt) => {
        const isSelected = selected.includes(opt.value);
        const IconComp = QUIZ_ICONS[opt.icon] ?? Sparkles;
        return (
          <button
            key={opt.value}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => (multi ? onToggleMulti(opt.value) : onPickSingle(opt.value))}
            className={cn(
              "group relative flex items-start gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 p-4 text-left",
              "transition-all duration-150 hover:border-primary/40 hover:bg-primary/8",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected && "border-primary bg-primary/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-bb-cobalt)_50%,transparent),var(--bb-shadow-premium)]"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-xl border border-border/60 bg-muted/40 transition-colors",
                isSelected ? "border-primary/40 bg-primary/15" : "group-hover:border-primary/20 group-hover:bg-primary/10"
              )}
            >
              <IconComp size={20} />
            </span>
            <span className="flex-1 min-w-0 self-center">
              <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{opt.description}</span>
              )}
            </span>
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all",
                multi ? "rounded-md" : "rounded-full",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-transparent group-hover:border-primary/40"
              )}
            >
              {multi ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <span className={cn("h-2 w-2 rounded-full transition-colors", isSelected ? "bg-primary-foreground" : "bg-transparent")} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
