/**
 * EventJourney — the shared journey spine rendered for every role.
 *
 * Four phases (Create → Prepare → Event day → Results) derived from the 10
 * stages, each showing done / current / upcoming state and the milestone chips
 * that live within it. Milestones carry an owner label ("You" / "Bright.Blue")
 * so customers see the whole picture — their deliverables AND our work — while
 * only acting on their own.
 *
 *   - variant="full"     → the four phases with milestone chips, ownership-
 *                          forward (internal overview)
 *   - variant="steps"    → a clean horizontal four-node bar with a "Your move"
 *                          cue under the current phase (customer overview + home)
 *   - variant="vertical" → a vertical spine where done/upcoming phases collapse
 *                          to one quiet line and only the current phase expands
 *                          with its checklist — the Linear-style "past is
 *                          history, present is detail" read (customer timeline)
 *
 * Pure presentation: the caller fetches milestones and passes them in.
 */
import Link from "next/link";
import { Check, ArrowRight, Circle, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Milestone, Stage } from "@/types";
import { buildJourney, type JourneyMilestone } from "@/lib/journey";
import { formatDateShort } from "@/lib/dates";

interface EventJourneyProps {
  eventId: string;
  currentStage: Stage;
  milestones: Milestone[];
  variant?: "full" | "steps" | "vertical";
}

function OwnerChip({ owner }: { owner: JourneyMilestone["owner"] }) {
  const isYou = owner === "you";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        isYou
          ? "bg-[var(--color-bb-cobalt)]/10 text-[var(--color-bb-cobalt)]"
          : "bg-muted text-muted-foreground",
      )}
    >
      {isYou ? "You" : "Bright.Blue"}
    </span>
  );
}

function PhaseDot({ state }: { state: "done" | "current" | "upcoming" }) {
  if (state === "done") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
        <Check size={11} className="text-success" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-5 items-center justify-center rounded-full bg-[var(--color-bb-cobalt)]/15 ring-1 ring-[var(--color-bb-cobalt)]/40">
        <ArrowRight size={11} className="text-[var(--color-bb-cobalt)]" />
      </span>
    );
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-full bg-muted/50 ring-1 ring-border">
      <Circle size={7} className="text-muted-foreground" />
    </span>
  );
}

export function EventJourney({
  eventId,
  currentStage,
  milestones,
  variant = "full",
}: EventJourneyProps) {
  const { phases, current } = buildJourney(currentStage, milestones);

  if (variant === "vertical") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        {/* Summary line — where you are, in one glance. */}
        <p className="text-overline text-muted-foreground">
          <span className="text-[var(--color-bb-cobalt)] tabular-nums">
            Phase {current.index + 1} of {current.total}
          </span>
          {" · "}
          {current.label}
        </p>

        <ol className="mt-5">
          {phases.map((phase, i) => {
            const isCurrent = phase.state === "current";
            const isLast = i === phases.length - 1;
            const doneCount = phase.milestones.filter(
              (m) => m.status === "done",
            ).length;

            return (
              <li key={phase.id} className="relative flex gap-4">
                {/* Spine */}
                <div className="flex flex-col items-center">
                  <PhaseDot state={phase.state} />
                  {!isLast && (
                    <span
                      className={cn(
                        "w-px flex-1",
                        phase.state === "done"
                          ? "bg-[var(--color-bb-cobalt)]/40"
                          : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                </div>

                <div className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
                  {/* Done and upcoming phases collapse to one quiet line. */}
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p
                      className={cn(
                        "text-sm font-semibold leading-tight",
                        phase.state === "upcoming"
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                    >
                      {phase.label}
                    </p>
                    <span className="text-xs text-tertiary tabular-nums">
                      {phase.state === "done"
                        ? `Done · ${phase.milestones.length > 0 ? `${phase.milestones.length} milestone${phase.milestones.length === 1 ? "" : "s"} wrapped` : "wrapped"}`
                        : phase.state === "current"
                          ? `In progress · ${doneCount} of ${phase.milestones.length} done`
                          : "Coming up"}
                    </span>
                  </div>

                  {/* Only the current phase expands into its checklist. */}
                  {isCurrent && phase.milestones.length > 0 && (
                    <ul className="mt-3 space-y-2.5 rounded-xl border border-[var(--color-bb-cobalt)]/25 bg-[var(--color-bb-cobalt)]/[0.03] p-4">
                      {phase.milestones.map((m) => {
                        const isYou = m.owner === "you";
                        return (
                          <li key={m.id} className="flex items-start gap-2.5">
                            {m.status === "done" ? (
                              <Check
                                size={14}
                                className="mt-0.5 shrink-0 text-success"
                              />
                            ) : (
                              <Circle
                                size={13}
                                className={cn(
                                  "mt-0.5 shrink-0",
                                  isYou
                                    ? "text-[var(--color-bb-cobalt)]"
                                    : "text-muted-foreground/50",
                                )}
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "flex items-center gap-1.5 truncate text-sm",
                                    m.status === "done"
                                      ? "text-muted-foreground line-through decoration-border"
                                      : isYou
                                        ? "font-semibold text-foreground"
                                        : "text-foreground/90",
                                  )}
                                >
                                  {isYou && m.status !== "done" && (
                                    <User
                                      size={12}
                                      className="shrink-0 text-[var(--color-bb-cobalt)]"
                                    />
                                  )}
                                  {m.label}
                                </span>
                                <OwnerChip owner={m.owner} />
                              </div>
                              {m.targetDate && m.status !== "done" && (
                                <span className="text-xs text-quaternary tabular-nums">
                                  {formatDateShort(m.targetDate)}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  if (variant === "steps") {
    const currentPhase = phases.find((p) => p.state === "current");
    // "Your move" only when the customer actually owns an open milestone in the
    // current phase — otherwise the work is with us.
    const yourMove =
      currentPhase?.milestones.some(
        (m) => m.owner === "you" && m.status !== "done",
      ) ?? false;

    return (
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-overline text-muted-foreground">Your journey</p>
          <Link
            href={`/events/${eventId}/timeline`}
            className="inline-flex items-center gap-1 text-overline text-[var(--color-bb-cobalt)] transition-opacity hover:opacity-80"
          >
            See full timeline
            <ArrowRight size={12} />
          </Link>
        </div>
        <ol className="flex">
          {phases.map((phase, i) => {
            const filledLeft = phase.state !== "upcoming";
            const filledRight = phase.state === "done";
            return (
              <li key={phase.id} className="min-w-0 flex-1">
                <div className="flex items-center">
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === 0
                        ? "opacity-0"
                        : filledLeft
                          ? "bg-[var(--color-bb-cobalt)]/40"
                          : "bg-border",
                    )}
                  />
                  <PhaseDot state={phase.state} />
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === phases.length - 1
                        ? "opacity-0"
                        : filledRight
                          ? "bg-[var(--color-bb-cobalt)]/40"
                          : "bg-border",
                    )}
                  />
                </div>
                <div className="mt-2 px-1 text-center">
                  <p
                    className={cn(
                      "truncate text-xs font-medium",
                      phase.state === "upcoming"
                        ? "text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {phase.label}
                  </p>
                  {phase.state === "current" && (
                    <p
                      className={cn(
                        "mt-0.5 text-[11px] font-semibold",
                        yourMove
                          ? "text-[var(--color-bb-cobalt)]"
                          : "text-muted-foreground",
                      )}
                    >
                      {yourMove ? "Your move" : "We're on it"}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {phases.map((phase) => (
        <div
          key={phase.id}
          className={cn(
            "rounded-2xl border p-4",
            phase.state === "current"
              ? "border-[var(--color-bb-cobalt)]/40 bg-[var(--color-bb-cobalt)]/[0.03]"
              : "border-border bg-card",
          )}
        >
          <div className="flex items-center gap-2">
            <PhaseDot state={phase.state} />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-semibold leading-tight",
                  phase.state === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {phase.label}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {phase.state === "done"
                  ? "Done"
                  : phase.state === "current"
                    ? "In progress"
                    : "Upcoming"}
              </p>
            </div>
          </div>

          {phase.milestones.length > 0 && (
            <ul className="mt-3 space-y-2">
              {phase.milestones.map((m) => {
                // Ownership is the loudest signal (#5): the customer's own
                // milestones read bold/cobalt with a person icon; ours recede.
                const isYou = m.owner === "you";
                return (
                  <li key={m.id} className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-1 size-1.5 shrink-0 rounded-full",
                        m.status === "done"
                          ? "bg-success"
                          : isYou || m.status === "active"
                            ? "bg-[var(--color-bb-cobalt)]"
                            : "bg-border",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 truncate text-xs",
                            isYou
                              ? "font-semibold text-[var(--color-bb-cobalt)]"
                              : m.status === "upcoming"
                                ? "text-muted-foreground"
                                : "text-foreground",
                          )}
                        >
                          {isYou && <User size={11} className="shrink-0" />}
                          {m.label}
                        </span>
                        <OwnerChip owner={m.owner} />
                      </div>
                      {m.targetDate && (
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {formatDateShort(m.targetDate)}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
