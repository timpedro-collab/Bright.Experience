/**
 * Branching recommendation quiz — premium dark UI.
 *
 * After the customer picks an event type the flow splits:
 *  - Tradeshow track asks for an attendee count (number stepper) and shows a
 *    live projected-impressions preview.
 *  - Experiential track asks where they're activating (location cards with a
 *    footfall heat + tier badge) and for how many days, previewing impressions
 *    and DOOH media value off the site's real footfall.
 *
 * Answers are keyed by stable step id, so the branch can grow/shrink the step
 * list without scrambling stored answers. The terminal state plays a short
 * `QuizWorkingTransition` beat, then hands off to `QuizMatchCard`.
 */
"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getQuizSteps,
  getRecommendation,
  type QuizAnswers,
} from "./quiz-data";
import { QuizMatchCard } from "../QuizMatchCard";
import {
  QuizWorkingTransition,
  prefersReducedMotion,
} from "./QuizWorkingTransition";
import { OptionGrid } from "./OptionGrid";
import { NumberStep } from "./NumberStep";
import { DurationStep } from "./DurationStep";
import { LocationStep } from "./LocationStep";
import { OwnLocationsStep } from "./OwnLocationsStep";

interface MachineSummary {
  slug: string;
  name: string;
  tagline?: string | null;
  hero_image_url?: string | null;
}

interface RecommendationQuizProps {
  machines: MachineSummary[];
  /**
   * Pre-seeded `event-type` answer (validated upstream with
   * `isQuizEventType`). The visitor self-selected on the homepage
   * ("Let's plan ___"), so they arrive at question two, not question one.
   */
  initialEventType?: string;
}

export function RecommendationQuiz({
  machines,
  initialEventType,
}: RecommendationQuizProps) {
  const [answers, setAnswers] = useState<QuizAnswers>(() => {
    const seeded: QuizAnswers = {};
    if (initialEventType) seeded["event-type"] = [initialEventType];
    return seeded;
  });
  const [stepIndex, setStepIndex] = useState(() => (initialEventType ? 1 : 0));
  // Flips true once the post-answer "working" transition has played, so it
  // runs exactly once per quiz completion and never on unrelated re-renders.
  const [revealed, setRevealed] = useState(false);

  const steps = getQuizSteps(answers);
  const done = stepIndex >= steps.length;

  function setAnswer(id: string, values: string[]) {
    setAnswers((prev) => ({ ...prev, [id]: values }));
  }

  function pickSingle(id: string, value: string) {
    setAnswer(id, [value]);
    setStepIndex((s) => s + 1);
  }

  function toggleMulti(id: string, value: string) {
    setAnswers((prev) => {
      const current = prev[id] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [id]: next };
    });
  }

  function advance() {
    setStepIndex((s) => s + 1);
  }

  function back() {
    setStepIndex((s) => Math.max(0, s - 1));
  }

  function reset() {
    setStepIndex(0);
    setAnswers({});
    setRevealed(false);
  }

  if (done) {
    // Labor-illusion beat between the last answer and the reveal.
    // Reduced-motion visitors see the result immediately.
    if (!revealed && !prefersReducedMotion()) {
      return <QuizWorkingTransition onDone={() => setRevealed(true)} />;
    }
    const rec = getRecommendation(answers);
    return (
      <QuizMatchCard
        recommendation={rec}
        machines={machines}
        onReset={reset}
      />
    );
  }

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const pct = Math.round(((stepIndex + 1) / steps.length) * 100);

  return (
    <Card tone="subtle" className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,hsl(230,93%,53%),hsl(189,100%,75%))] transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div>
          <h2 className="text-heading text-2xl font-semibold text-foreground md:text-3xl">
            {current.question}
          </h2>
          {current.hint && (
            <p className="mt-1.5 text-sm text-muted-foreground">{current.hint}</p>
          )}
        </div>

        {(current.kind === "single" || current.kind === "multi") && (
          <OptionGrid
            step={current}
            selected={answers[current.id] ?? []}
            onPickSingle={(v) => pickSingle(current.id, v)}
            onToggleMulti={(v) => toggleMulti(current.id, v)}
          />
        )}

        {current.kind === "number" && (
          <NumberStep
            step={current}
            value={Number(answers[current.id]?.[0] ?? current.number?.default ?? 0)}
            onChange={(n) => setAnswer(current.id, [String(n)])}
          />
        )}

        {current.kind === "duration" && (
          <DurationStep
            step={current}
            value={Number(answers[current.id]?.[0] ?? current.duration?.default ?? 1)}
            locationKey={answers["location"]?.[0] ?? null}
            onChange={(n) => setAnswer(current.id, [String(n)])}
          />
        )}

        {current.kind === "location" && (
          <LocationStep
            selectedKey={answers[current.id]?.[0] ?? null}
            days={Number(answers["days"]?.[0] ?? 3)}
            onPick={(key) => pickSingle(current.id, key)}
          />
        )}

        {current.kind === "location-list" && (
          <OwnLocationsStep
            values={answers[current.id] ?? []}
            onChange={(list) => setAnswer(current.id, list)}
          />
        )}

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
          <Button variant="ghost" size="sm" onClick={back} disabled={stepIndex === 0} className="sm:w-auto">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          {current.kind === "multi" || current.kind === "location-list" ? (
            <div className="flex items-center justify-end gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {(answers[current.id]?.length ?? 0) === 0
                  ? current.kind === "location-list"
                    ? "Add at least one location"
                    : "Pick at least one to continue"
                  : current.kind === "location-list"
                    ? `${answers[current.id]?.length} location${answers[current.id]?.length === 1 ? "" : "s"} added`
                    : `${answers[current.id]?.length} selected`}
              </span>
              <Button variant="brand" size="sm" onClick={advance} disabled={(answers[current.id]?.length ?? 0) === 0}>
                {isLast ? "See your match" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : current.kind === "number" || current.kind === "duration" ? (
            <Button variant="brand" size="sm" onClick={advance} className="sm:w-auto">
              {isLast ? "See your match" : "Continue"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground sm:ml-auto">
              Pick one to continue
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

