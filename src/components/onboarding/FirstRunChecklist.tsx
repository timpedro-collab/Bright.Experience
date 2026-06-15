/**
 * First-run checklist shown on the welcome page. Each step reflects real
 * account state (tour taken, event opened, first asset uploaded) so the
 * customer always sees an honest "where am I" and a single next action.
 */
import Link from "next/link";
import { Check, Circle, ArrowRight } from "lucide-react";

import { GlassCard } from "@/components/cloud";
import { cn } from "@/lib/utils";

export interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  action?: { label: string; href: string };
}

export function FirstRunChecklist({ steps }: { steps: ChecklistStep[] }) {
  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / Math.max(steps.length, 1)) * 100);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Get set up
          </p>
          <p className="text-overline text-muted-foreground">
            {completed} of {steps.length} done
          </p>
        </div>
        <span className="text-display text-2xl text-foreground tabular-nums">
          {pct}%
        </span>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-5 space-y-1">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/40"
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                step.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {step.done ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <Circle className="h-2 w-2 fill-current" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.done
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {!step.done && step.action && (
              <Link
                href={step.action.href}
                className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {step.action.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}
