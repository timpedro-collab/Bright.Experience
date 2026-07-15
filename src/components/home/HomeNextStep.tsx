/** Dominant "one next action" CTA for the customer home featured event. */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EditorialEyebrow } from "@/components/brand";
import type { NextStep } from "@/lib/event-next-step";

interface HomeNextStepProps {
  nextStep: NextStep;
  /** Optional due date ISO for consequence copy. */
  dueHint?: string | null;
}

/**
 * Elevates the event next-step engine to the customer home so the first
 * thing they see is a single blocking action — not a dashboard of options.
 */
export function HomeNextStep({ nextStep, dueHint }: HomeNextStepProps) {
  const toneBg =
    nextStep.tone === "warning"
      ? "bg-warning"
      : nextStep.tone === "success"
        ? "bg-success"
        : "bg-[var(--color-bb-cobalt)]";

  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 md:p-8"
      data-tour="home-next-step"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:gap-10 items-end">
        <div>
          <EditorialEyebrow accent={nextStep.tone !== "warning"}>
            {nextStep.eyebrow}
          </EditorialEyebrow>
          <h2 className="text-heading text-foreground text-[clamp(1.35rem,2.5vw,1.85rem)] leading-tight mt-2 max-w-[36ch]">
            {nextStep.title}
          </h2>
          {nextStep.description && (
            <p className="mt-3 max-w-[52ch] text-sm text-muted-foreground leading-relaxed">
              {nextStep.description}
              {dueHint ? (
                <span className="block mt-1 text-foreground/80 font-medium">
                  {dueHint}
                </span>
              ) : null}
            </p>
          )}
        </div>
        <div className="flex flex-col md:items-end gap-2 mt-5 md:mt-0">
          <Link
            href={nextStep.primaryAction.href}
            className={`inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity ${toneBg}`}
          >
            {nextStep.primaryAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {nextStep.secondaryAction && (
            <Link
              href={nextStep.secondaryAction.href}
              className="text-overline text-muted-foreground hover:text-foreground transition-colors"
            >
              {nextStep.secondaryAction.label} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
