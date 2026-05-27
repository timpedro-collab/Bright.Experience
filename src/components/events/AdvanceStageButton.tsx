/**
 * Internal-only "Advance stage" control.
 *
 * Server-side the page determines whether the gate is clear via
 * `canAdvanceStage`. This client component renders the resulting state
 * — either a clickable advance button or a disabled blocker list — and
 * calls the `advanceStage` action when clicked. The action handles
 * audit, notification, milestone sync, and Pipedrive write-back.
 */
"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceStage } from "@/app/actions/stages";
import { STAGE_CONFIG } from "@/types";
import type { Stage } from "@/types";

interface Props {
  eventId: string;
  currentStage: Stage;
  canAdvance: boolean;
  blockers: string[];
}

export function AdvanceStageButton({
  eventId,
  currentStage,
  canAdvance,
  blockers,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentOrder = STAGE_CONFIG[currentStage].order;
  // STAGE_CONFIG is dense; the next stage is whichever has order + 1.
  const nextStage = (Object.entries(STAGE_CONFIG).find(
    ([, cfg]) => cfg.order === currentOrder + 1
  )?.[0] ?? null) as Stage | null;

  if (!nextStage) {
    return (
      <p className="text-xs text-muted-foreground">
        Event has reached the final stage.
      </p>
    );
  }

  const nextLabel = STAGE_CONFIG[nextStage].label;

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await advanceStage(eventId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not advance stage");
      }
    });
  }

  if (!canAdvance) {
    return (
      <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
        <p className="font-semibold text-warning">
          {blockers.length} blocker{blockers.length === 1 ? "" : "s"} before
          advancing
        </p>
        <ul className="mt-2 list-disc pl-4 text-muted-foreground space-y-0.5">
          {blockers.slice(0, 4).map((b) => (
            <li key={b}>{b}</li>
          ))}
          {blockers.length > 4 && <li>+ {blockers.length - 4} more</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="brand"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Advancing…" : `Advance to ${nextLabel}`}
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
