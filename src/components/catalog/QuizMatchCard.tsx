/**
 * QuizMatchCard — the moment that has to land.
 *
 * Replaces the legacy `done` state of the recommendation quiz. The system has
 * already chosen one machine, one package, and 3–5 outcome chips. The customer
 * reads a paragraph in plain English and clicks `Get my tailored proposal`.
 *
 * Per the plan:
 * - No comparison tables. No tiers grid. No price.
 * - The only secondary affordance is `Refine` (opens RefineDrawer).
 * - The brand voice line "Make Your Moment Count" surfaces once, quietly.
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RotateCcw, Settings2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  encodeCapabilityParam,
  getCapabilities,
  type QuizSignals,
} from "@/lib/capabilities";
import type { QuizMatch } from "./quiz-data";
import { RefineDrawer } from "./RefineDrawer";

interface MachineSummary {
  slug: string;
  name: string;
  tagline?: string | null;
  hero_image_url?: string | null;
}

interface QuizMatchCardProps {
  match: QuizMatch;
  preSelectedCapabilities: string[];
  signals: QuizSignals;
  /** All catalog machines, used to look up the image for the matched machine. */
  machines: MachineSummary[];
  /** Called when the customer clicks the small "Start over" affordance. */
  onReset: () => void;
}

/**
 * A short, warm sentence describing the match.
 *
 * Bright.Blue markets exactly one product — the Experience Portal — so the
 * customer never reads a model name (Claw / Spin / Grab). Those stay internal
 * to the admin and studio pipelines. The customer sees the umbrella plus the
 * package and capabilities they get on top.
 */
function buildMatchSentence(_match: QuizMatch, signals: QuizSignals): string {
  const eventLabel = readableEvent(signals.eventType);
  const audienceLabel = readableAudience(signals.audience);
  const objectiveLabel = readableObjective(signals.objective);

  if (eventLabel && objectiveLabel) {
    return `For ${eventLabel} where ${objectiveLabel} matters most, we'd lean into the Experience Portal layered like this:`;
  }
  if (audienceLabel && objectiveLabel) {
    return `Built for ${audienceLabel} crowds where ${objectiveLabel} matters most — the Experience Portal layered like this:`;
  }
  return `For a moment like yours, we'd shape the Experience Portal like this:`;
}

function readableEvent(value?: string | null): string | null {
  switch (value) {
    case "trade-show":
      return "a trade show";
    case "exhibition":
      return "an exhibition";
    case "experiential-activation":
      return "an experiential activation";
    case "festival":
      return "a festival";
    case "corporate":
      return "a corporate moment";
    case "conference":
      return "a conference";
    default:
      return null;
  }
}

function readableAudience(value?: string | null): string | null {
  switch (value) {
    case "B2B":
      return "business";
    case "B2C":
      return "consumer";
    case "mixed":
      return "mixed";
    default:
      return null;
  }
}

function readableObjective(value?: string | null): string | null {
  switch (value) {
    case "brand-awareness":
      return "being remembered";
    case "lead-generation":
      return "pipeline";
    case "sampling":
      return "product trial";
    case "entertainment":
      return "the crowd reaction";
    case "employee-engagement":
      return "team energy";
    default:
      return null;
  }
}

export function QuizMatchCard({
  match,
  preSelectedCapabilities,
  signals,
  machines,
  onReset,
}: QuizMatchCardProps) {
  const [selected, setSelected] = useState<string[]>(preSelectedCapabilities);
  const [refineOpen, setRefineOpen] = useState(false);

  const machine = machines.find((m) => m.slug === match.machineSlug);
  const capabilities = getCapabilities(selected);
  const sentence = buildMatchSentence(match, signals);

  const proposalHref = `/proposal?${new URLSearchParams({
    machine: match.machineSlug,
    package: match.packageSlug ?? "",
    event: signals.eventType ?? "",
    objective: signals.objective ?? "",
    audience: signals.audience ?? "",
    addons: encodeCapabilityParam(selected),
  }).toString()}`;

  return (
    <>
      <Card tone="elevated" className="relative overflow-hidden mx-auto max-w-2xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <CardContent className="relative space-y-7 p-7 md:p-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1">
              <Sparkles size={12} className="text-primary" />
              <span className="text-overline text-primary">Your moment</span>
            </div>
            <p className="text-pretty text-lg leading-relaxed text-foreground md:text-xl">
              {sentence}
            </p>
          </div>

          {machine?.hero_image_url ? (
            <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02]">
              <Image
                src={machine.hero_image_url}
                alt="The Bright.Blue Experience Portal"
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="mx-auto flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-[var(--radius-card)] border border-white/[0.06] bg-white/[0.02] text-2xl font-semibold text-muted-foreground">
              Your Experience Portal
            </div>
          )}

          <div className="space-y-3">
            <p className="text-overline text-muted-foreground">
              On the day, your portal will deliver
            </p>
            {capabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                A turnkey activation — branded build, GDPR lead capture, and
                live engagement metrics. Add layers below if you'd like.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {capabilities.map((cap) => (
                  <li
                    key={cap.slug}
                    className={cn(
                      "inline-flex items-center rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5",
                      "text-sm font-medium text-foreground"
                    )}
                  >
                    {cap.outcome}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setRefineOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Refine
            </button>
          </div>

          <div className="space-y-3">
            <Button variant="brand" size="lg" className="w-full" asChild>
              <Link href={proposalHref}>Get my tailored proposal</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              We'll price it together — no commitment yet.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Start over
            </button>
            <span aria-hidden>·</span>
            <Link
              href="/catalog"
              className="underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              Explore the catalogue
            </Link>
          </div>
        </CardContent>
      </Card>

      <RefineDrawer
        open={refineOpen}
        onOpenChange={setRefineOpen}
        selected={selected}
        onSave={(slugs) => {
          setSelected(slugs);
          setRefineOpen(false);
        }}
      />
    </>
  );
}
