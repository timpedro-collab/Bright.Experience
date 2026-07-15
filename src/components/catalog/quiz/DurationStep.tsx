/** Experiential duration picker with live reach preview. */
"use client";

import { Eye, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumberUS, formatMoneyFromPence } from "@/lib/currency";
import {
  getExperientialLocation,
  reachForLocation,
} from "@/lib/experiential-locations";
import type { QuizStep } from "./quiz-data";
import { ReachPreview } from "./ReachPreview";

export function DurationStep({
  step,
  value,
  locationKey,
  onChange,
}: {
  step: QuizStep;
  value: number;
  locationKey: string | null;
  onChange: (n: number) => void;
}) {

  const cfg = step.duration!;
  const clamp = (n: number) => Math.min(cfg.max, Math.max(cfg.min, n));
  const location = getExperientialLocation(locationKey);
  const reach = reachForLocation(location, value);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: cfg.max }, (_, i) => i + 1).map((d) => {
          const active = d === value;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(clamp(d))}
              aria-pressed={active}
              className={cn(
                "h-10 w-10 rounded-full border text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-foreground">
        <span className="font-semibold">{value} day{value === 1 ? "" : "s"}</span> at{" "}
        <span className="font-semibold">{location.shortName}</span>
      </p>

      <ReachPreview
        rows={[
          { icon: Eye, label: "Projected impressions", value: formatNumberUS(reach.impressions) },
          ...(reach.doohMediaValueCents != null
            ? [{ icon: MapPin, label: "Equivalent DOOH value", value: `Up to ${formatMoneyFromPence(reach.doohMediaValueCents)}` }]
            : []),
        ]}
        note="Modelled from the site's real daily footfall. Your event lead confirms plays and leads on the walkthrough."
      />
    </div>
  );
}
