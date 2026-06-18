/**
 * 5-step recommendation quiz — premium dark UI, per-step single or multi-select.
 *
 * The numeric "Step N of M" counter is intentionally absent — only the gradient
 * progress bar remains. Per the plan: numeric pressure removed; this is meant
 * to feel like a conversation, not a form.
 *
 * The terminal state hands off to `QuizMatchCard`, which composes a single
 * machine + outcome chips and offers a quiet `Refine` affordance.
 */
"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Megaphone, Target, Gift, Gamepad2,
  Users, Building2, Tent, Sparkles, Music, Briefcase, Mic,
  User, UsersRound, Ruler, Warehouse, Globe, Theater,
  Handshake, ShoppingBag, CircleDot, Wine, Wind, Dice5,
  Landmark, Stethoscope, Lightbulb, Rocket, Share2, type LucideIcon,
} from "lucide-react";

const QUIZ_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone, target: Target, gift: Gift, "gamepad-2": Gamepad2,
  lightbulb: Lightbulb, rocket: Rocket, "share-2": Share2,
  users: Users, "building-2": Building2, tent: Tent, sparkles: Sparkles,
  music: Music, briefcase: Briefcase, mic: Mic, user: User,
  "users-round": UsersRound, stadium: Globe, ruler: Ruler,
  warehouse: Warehouse, globe: Globe, theater: Theater,
  handshake: Handshake, "shopping-bag": ShoppingBag, "circle-dot": CircleDot,
  wine: Wine, wind: Wind, "dice-5": Dice5, landmark: Landmark,
  stethoscope: Stethoscope,
};

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QUIZ_STEPS, getRecommendation } from "./quiz-data";
import { QuizMatchCard } from "./QuizMatchCard";

const TOTAL = QUIZ_STEPS.length;

interface MachineSummary {
  slug: string;
  name: string;
  tagline?: string | null;
  hero_image_url?: string | null;
}

interface RecommendationQuizProps {
  /** All active catalog machines — used by the match card to render the matched machine's image. */
  machines: MachineSummary[];
}

export function RecommendationQuiz({ machines }: RecommendationQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const done = step >= TOTAL;

  function pickSingle(value: string) {
    setAnswers((prev) => ({ ...prev, [step]: [value] }));
    setStep((s) => s + 1);
  }

  function toggleMulti(value: string) {
    setAnswers((prev) => {
      const current = prev[step] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [step]: next };
    });
  }

  function advance() {
    setStep((s) => s + 1);
  }

  function reset() {
    setStep(0);
    setAnswers({});
  }

  if (done) {
    const rec = getRecommendation(answers);
    return (
      <QuizMatchCard
        match={rec.match}
        preSelectedCapabilities={rec.preSelectedCapabilities}
        signals={rec.signals}
        goals={rec.goals}
        machines={machines}
        onReset={reset}
      />
    );
  }

  const current = QUIZ_STEPS[step];
  const selected = answers[step] ?? [];
  const isLast = step === TOTAL - 1;
  const canAdvance = selected.length > 0;
  const pct = Math.round(((step + 1) / TOTAL) * 100);

  return (
    <Card tone="subtle" className="mx-auto max-w-2xl">
      <CardContent className="space-y-6 p-6 md:p-8">
        {/* Thin gradient progress bar — no numeric counter. */}
        <div
          aria-hidden
          className="h-1 w-full overflow-hidden rounded-full bg-muted/40"
        >
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

        <div
          role={current.multi ? "group" : "radiogroup"}
          aria-label={current.question}
          className="grid gap-3 sm:grid-cols-2"
        >
          {current.options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role={current.multi ? "checkbox" : "radio"}
                aria-checked={isSelected}
                onClick={() =>
                  current.multi ? toggleMulti(opt.value) : pickSingle(opt.value)
                }
                className={cn(
                  "group relative flex items-start gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 p-4 text-left",
                  "transition-all duration-150",
                  "hover:border-primary/40 hover:bg-primary/8",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected &&
                    "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(230,93%,53%,0.5),var(--bb-shadow-premium)]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-xl",
                    "border border-border/60 bg-muted/40",
                    "transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/15"
                      : "group-hover:border-primary/20 group-hover:bg-primary/10"
                  )}
                >
                  {(() => {
                    const IconComp = QUIZ_ICONS[opt.icon];
                    return IconComp ? <IconComp size={20} /> : <Sparkles size={20} />;
                  })()}
                </span>
                <span className="flex-1 min-w-0 self-center">
                  <span className="block text-sm font-semibold text-foreground">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {opt.description}
                    </span>
                  )}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all",
                    current.multi ? "rounded-md" : "rounded-full",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/15 bg-muted/40 text-transparent group-hover:border-primary/40"
                  )}
                >
                  {current.multi ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        isSelected ? "bg-primary-foreground" : "bg-transparent"
                      )}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="sm:w-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>

          {current.multi ? (
            <div className="flex items-center justify-end gap-3">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {selected.length === 0
                  ? "Pick at least one to continue"
                  : `${selected.length} selected`}
              </span>
              <Button
                variant="brand"
                size="sm"
                onClick={advance}
                disabled={!canAdvance}
              >
                {isLast ? "See your match" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
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
