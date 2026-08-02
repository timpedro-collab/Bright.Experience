/** Fixed saved-view preset chips for the internal pipeline — link-only filter shortcuts. */
import Link from "next/link";

import { cn } from "@/lib/utils";

export const PIPELINE_PRESETS = [
  { id: "at-risk", label: "At risk", params: { health: "amber" } },
  {
    id: "waiting-on-client",
    label: "Waiting on client",
    params: { stage: "creative_assets" },
  },
  { id: "live-this-week", label: "Live this week", params: { stage: "event_live" } },
] as const;

/** Structural subset of EventFilters — lets the page pass its filters directly. */
type PresetParams = {
  q?: string;
  stage?: string;
  health?: string;
  account?: string;
};

function isPresetActive(
  preset: (typeof PIPELINE_PRESETS)[number],
  current: PresetParams,
): boolean {
  return Object.entries(preset.params).every(
    ([key, value]) => current[key as keyof PresetParams] === value,
  );
}

function presetHref(
  preset: (typeof PIPELINE_PRESETS)[number],
  active: boolean,
): string {
  if (active) return "/pipeline";
  const sp = new URLSearchParams(preset.params);
  return `/pipeline?${sp.toString()}`;
}

interface PipelinePresetsProps {
  /** Current pipeline search params — used to highlight the active preset. */
  params: PresetParams;
}

export function PipelinePresets({ params }: PipelinePresetsProps) {
  return (
    <div
      role="group"
      aria-label="Pipeline saved views"
      className="flex flex-wrap gap-2 mb-4"
    >
      {PIPELINE_PRESETS.map((preset) => {
        const active = isPresetActive(preset, params);
        return (
          <Link
            key={preset.id}
            href={presetHref(preset, active)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {preset.label}
          </Link>
        );
      })}
    </div>
  );
}
