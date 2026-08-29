/** Tradeshow attendee stepper with live impressions preview. */
"use client";

import { Minus, Plus, Eye } from "lucide-react";
import { formatNumberUS } from "@/lib/currency";
import { tradeshowReach } from "@/lib/reach";
import type { QuizStep } from "./quiz-data";
import { ReachPreview } from "./ReachPreview";

export function NumberStep({
  step,
  value,
  onChange,
}: {
  step: QuizStep;
  value: number;
  onChange: (n: number) => void;
}) {

  const cfg = step.number!;
  const clamp = (n: number) => Math.min(cfg.max, Math.max(cfg.min, n));
  const reach = tradeshowReach({ attendees: value });
  const unit = value === 1 ? cfg.unitSingular : cfg.unitPlural;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label={`Decrease ${cfg.unitPlural}`}
          onClick={() => onChange(clamp(value - cfg.step))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/40 text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="min-w-[10rem] text-center">
          <div className="text-display text-4xl font-bold tabular-nums text-foreground">
            {formatNumberUS(value)}
          </div>
          <div className="text-overline text-muted-foreground">{unit}</div>
        </div>
        <button
          type="button"
          aria-label={`Increase ${cfg.unitPlural}`}
          onClick={() => onChange(clamp(value + cfg.step))}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted/40 text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <input
        type="range"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label={step.question}
        className="w-full accent-primary"
      />

      <ReachPreview
        rows={[
          { icon: Eye, label: "Projected impressions", value: formatNumberUS(reach.impressions) },
        ]}
        note="Eyeballs on your branded activation, scaled from your expected attendance. Your event lead confirms plays and leads on the walkthrough."
      />
    </div>
  );
}
