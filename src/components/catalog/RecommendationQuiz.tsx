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
 * list without scrambling stored answers. The terminal state hands off to
 * `QuizMatchCard`.
 */
"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, Megaphone, Target, Gift, Gamepad2,
  Users, Building2, Tent, Sparkles, Music, Briefcase, Mic,
  User, UsersRound, Ruler, Warehouse, Globe, Theater,
  Handshake, ShoppingBag, CircleDot, Wine, Wind, Dice5,
  Landmark, Stethoscope, Lightbulb, Rocket, Share2,
  Calendar, CalendarClock, CalendarRange, Compass,
  Minus, Plus, MapPin, Eye, X, Store, Network, type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumberUS, formatUSDFromCents } from "@/lib/currency";
import { tradeshowReach } from "@/lib/reach";
import {
  EXPERIENTIAL_LOCATIONS,
  FALLBACK_EXPERIENTIAL_LOCATION,
  getExperientialLocation,
  reachForLocation,
  TIER_LABEL,
  TIER_HEAT,
  type ExperientialLocation,
} from "@/lib/experiential-locations";
import {
  getQuizSteps,
  getRecommendation,
  type QuizAnswers,
  type QuizStep,
} from "./quiz-data";
import { QuizMatchCard } from "./QuizMatchCard";

const QUIZ_ICONS: Record<string, LucideIcon> = {
  megaphone: Megaphone, target: Target, gift: Gift, "gamepad-2": Gamepad2,
  lightbulb: Lightbulb, rocket: Rocket, "share-2": Share2,
  users: Users, "building-2": Building2, tent: Tent, sparkles: Sparkles,
  music: Music, briefcase: Briefcase, mic: Mic, user: User,
  "users-round": UsersRound, stadium: Globe, ruler: Ruler,
  warehouse: Warehouse, globe: Globe, theater: Theater,
  handshake: Handshake, "shopping-bag": ShoppingBag, "circle-dot": CircleDot,
  wine: Wine, wind: Wind, "dice-5": Dice5, landmark: Landmark,
  stethoscope: Stethoscope, calendar: Calendar, "calendar-clock": CalendarClock,
  "calendar-range": CalendarRange, compass: Compass, "map-pin": MapPin,
  store: Store, network: Network,
};

interface MachineSummary {
  slug: string;
  name: string;
  tagline?: string | null;
  hero_image_url?: string | null;
}

interface RecommendationQuizProps {
  machines: MachineSummary[];
}

const ALL_LOCATIONS: ExperientialLocation[] = [
  ...EXPERIENTIAL_LOCATIONS,
  FALLBACK_EXPERIENTIAL_LOCATION,
];

export function RecommendationQuiz({ machines }: RecommendationQuizProps) {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);

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
  }

  if (done) {
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

/* -------------------------------------------------------------------------
 * Option grid (single / multi)
 * ---------------------------------------------------------------------- */

function OptionGrid({
  step,
  selected,
  onPickSingle,
  onToggleMulti,
}: {
  step: QuizStep;
  selected: string[];
  onPickSingle: (value: string) => void;
  onToggleMulti: (value: string) => void;
}) {
  const multi = step.kind === "multi";
  return (
    <div role={multi ? "group" : "radiogroup"} aria-label={step.question} className="grid gap-3 sm:grid-cols-2">
      {(step.options ?? []).map((opt) => {
        const isSelected = selected.includes(opt.value);
        const IconComp = QUIZ_ICONS[opt.icon] ?? Sparkles;
        return (
          <button
            key={opt.value}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={isSelected}
            onClick={() => (multi ? onToggleMulti(opt.value) : onPickSingle(opt.value))}
            className={cn(
              "group relative flex items-start gap-3 rounded-[var(--radius-control)] border border-border bg-muted/40 p-4 text-left",
              "transition-all duration-150 hover:border-primary/40 hover:bg-primary/8",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected && "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(230,93%,53%,0.5),var(--bb-shadow-premium)]"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-xl border border-border/60 bg-muted/40 transition-colors",
                isSelected ? "border-primary/40 bg-primary/15" : "group-hover:border-primary/20 group-hover:bg-primary/10"
              )}
            >
              <IconComp size={20} />
            </span>
            <span className="flex-1 min-w-0 self-center">
              <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
              {opt.description && (
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{opt.description}</span>
              )}
            </span>
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border transition-all",
                multi ? "rounded-md" : "rounded-full",
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-white/15 bg-muted/40 text-transparent group-hover:border-primary/40"
              )}
            >
              {multi ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <span className={cn("h-2 w-2 rounded-full transition-colors", isSelected ? "bg-primary-foreground" : "bg-transparent")} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Number step (tradeshow attendees) with live impressions preview
 * ---------------------------------------------------------------------- */

function NumberStep({
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
        className="w-full accent-[hsl(230,93%,53%)]"
      />

      <ReachPreview
        rows={[
          { icon: Eye, label: "Projected impressions", value: formatNumberUS(reach.impressions) },
        ]}
        note="Eyeballs across the unit's three branded screens, scaled from your expected attendance. Your event lead confirms plays and leads on the walkthrough."
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Duration step (experiential days) with live preview
 * ---------------------------------------------------------------------- */

function DurationStep({
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
            ? [{ icon: MapPin, label: "Equivalent DOOH value", value: formatUSDFromCents(reach.doohMediaValueCents) }]
            : []),
        ]}
        note="Modelled from the site's real daily footfall across three branded screens. Your event lead confirms plays and leads on the walkthrough."
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Location step (experiential) — footfall heat + tier, live preview
 * ---------------------------------------------------------------------- */

function LocationStep({
  selectedKey,
  days,
  onPick,
}: {
  selectedKey: string | null;
  days: number;
  onPick: (key: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_LOCATIONS.map((loc) => {
          const isSelected = selectedKey === loc.key;
          const reach = reachForLocation(loc, days || 3);
          return (
            <button
              key={loc.key}
              type="button"
              onClick={() => onPick(loc.key)}
              aria-pressed={isSelected}
              className={cn(
                "group relative flex flex-col gap-2 rounded-[var(--radius-control)] border border-border bg-muted/40 p-4 text-left transition-all duration-150",
                "hover:border-primary/40 hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected && "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(230,93%,53%,0.5),var(--bb-shadow-premium)]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2">
                  {loc.partner ? (
                    <Network size={16} className="text-primary" aria-hidden />
                  ) : (
                    <MapPin size={16} className="text-primary" aria-hidden />
                  )}
                  <span className="text-sm font-semibold text-foreground">{loc.shortName}</span>
                </span>
                {loc.hero ? (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary">
                    Hero
                  </span>
                ) : loc.partner ? (
                  <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    Partner
                  </span>
                ) : null}
              </div>

              <span className="text-xs leading-snug text-muted-foreground">{loc.blurb}</span>

              <div className="flex items-center gap-2 pt-0.5">
                <FootfallHeat level={TIER_HEAT[loc.tier]} />
                <span className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                  {TIER_LABEL[loc.tier]}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                <span className="text-muted-foreground">
                  {loc.key === "other"
                    ? "Footfall varies"
                    : `${formatNumberUS(loc.dailyFootfall)}/day${loc.partner ? " avg" : ""}`}
                </span>
                <span className="font-semibold text-foreground">
                  ≈ {formatNumberUS(reach.impressions)} impressions
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        More sites and partner networks — Space &amp; People, Simon Property and others — are added all the time.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Own-locations step (experiential, bring-your-own shortlist)
 * ---------------------------------------------------------------------- */

function OwnLocationsStep({
  values,
  onChange,
}: {
  values: string[];
  onChange: (list: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="e.g. London Waterloo, Westfield Stratford…"
          aria-label="Add a location"
          className="flex-1 rounded-[var(--radius-control)] border border-border bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!draft.trim()} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((name) => (
            <li
              key={name}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1.5 pl-3 pr-2 text-sm font-medium text-foreground"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
              {name}
              <button
                type="button"
                onClick={() => onChange(values.filter((v) => v !== name))}
                aria-label={`Remove ${name}`}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No locations added yet — type a site above and press Enter.
        </p>
      )}

      <div className="flex items-start gap-2.5 rounded-[var(--radius-card)] border border-primary/20 bg-primary/[0.05] p-4">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-[0.6875rem] leading-snug text-muted-foreground">
          Add as many sites as you like. We&apos;ll model each one&apos;s real footfall — across our
          own network and partners like Space &amp; People and Simon Property — and bring the
          numbers to your walkthrough.
        </p>
      </div>
    </div>
  );
}

function FootfallHeat({ level }: { level: number }) {
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1.5 rounded-sm",
            i <= level ? "bg-[hsl(230,93%,60%)]" : "bg-muted-foreground/25"
          )}
          style={{ height: `${4 + i * 3}px` }}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------
 * Shared live-preview panel
 * ---------------------------------------------------------------------- */

function ReachPreview({
  rows,
  note,
}: {
  rows: { icon: LucideIcon; label: string; value: string }[];
  note: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-primary/20 bg-primary/[0.05] p-4">
      <p className="text-overline mb-2 text-primary">Projected reach</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-2">
              <Icon size={15} className="shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block text-sm font-semibold tabular-nums text-foreground">{row.value}</span>
                <span className="block text-[0.6875rem] leading-tight text-muted-foreground">{row.label}</span>
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[0.6875rem] leading-snug text-muted-foreground">{note}</p>
    </div>
  );
}
