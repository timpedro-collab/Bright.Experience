"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { advanceStage } from "@/app/actions/stages";
import { STAGE_CONFIG } from "@/types";
import type { Stage } from "@/types";
import { StageCelebration } from "./StageCelebration";

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
  const [celebrateStage, setCelebrateStage] = useState<Stage | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const currentOrder = STAGE_CONFIG[currentStage].order;
  const nextStage = (Object.entries(STAGE_CONFIG).find(
    ([, cfg]) => cfg.order === currentOrder + 1
  )?.[0] ?? null) as Stage | null;

  const handleCelebrationDone = useCallback(() => {
    setCelebrateStage(null);
    router.refresh();
  }, [router]);

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
      const result = await advanceStage(eventId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCelebrateStage(nextStage);
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
    <>
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
      <StageCelebration stage={celebrateStage} onComplete={handleCelebrationDone} />
    </>
  );
}
