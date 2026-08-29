/** Event overview — editorial "What's next" callout section. */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EditorialEyebrow } from "@/components/brand";
import { AdvanceStageButton } from "@/components/events/AdvanceStageButton";
import type { Stage } from "@/types";

interface NextStepAction {
  label: string;
  href: string;
}

export interface NextStepData {
  eyebrow: string;
  title: string;
  description?: string;
  tone: "info" | "warning" | "success" | "brand";
  primaryAction: NextStepAction;
  secondaryAction?: NextStepAction;
}

interface OverviewNextStepProps {
  nextStep: NextStepData;
  isInternal: boolean;
  /** Whether this viewer's role may advance the pipeline stage. */
  canManageStage?: boolean;
  eventId: string;
  currentStage: Stage;
  canAdvance: boolean;
  blockers: string[];
}

export function OverviewNextStep({
  nextStep,
  isInternal,
  canManageStage = false,
  eventId,
  currentStage,
  canAdvance,
  blockers,
}: OverviewNextStepProps) {
  const toneBg =
    nextStep.tone === "warning"
      ? "bg-warning"
      : nextStep.tone === "success"
        ? "bg-success"
        : "bg-primary"; // brand + info both use cobalt

  return (
    <section className="py-10 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:gap-12 items-end">
        <div>
          <EditorialEyebrow accent={nextStep.tone !== "warning"}>
            {nextStep.eyebrow}
          </EditorialEyebrow>
          <h2 className="text-heading text-foreground text-[clamp(1.5rem,3vw,2.25rem)] leading-tight mt-2 max-w-[32ch]">
            {nextStep.title}
          </h2>
          {nextStep.description && (
            <p className="mt-3 max-w-[58ch] text-base text-muted-foreground leading-relaxed">
              {nextStep.description}
            </p>
          )}
        </div>
        <div className="flex flex-col md:items-end gap-2 mt-4 md:mt-0">
          <Link
            href={nextStep.primaryAction.href}
            className={`inline-flex items-center gap-2 text-primary-foreground px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity ${toneBg}`}
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
      {isInternal && canManageStage && (
        <div className="mt-6 max-w-md">
          <EditorialEyebrow>Internal · stage gate</EditorialEyebrow>
          <div className="mt-2">
            <AdvanceStageButton
              eventId={eventId}
              currentStage={currentStage}
              canAdvance={canAdvance}
              blockers={blockers}
            />
          </div>
        </div>
      )}
    </section>
  );
}
