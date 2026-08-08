/**
 * Event timeline — full milestone list with stage progress and current
 * stage callout. Uses EventPageShell for consistent chrome.
 */

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow, Hairline } from "@/components/brand";
import { EventHealthBadge } from "@/components/ui/StatusBadge";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { StageProgressBar } from "@/components/events/StageProgressBar";
import { AdvanceStageButton } from "@/components/events/AdvanceStageButton";
import { StageTransitions } from "@/components/timeline/StageTransitions";
import { EventJourney } from "@/components/events/EventJourney";

import { getEventById } from "@/lib/queries/events";
import { getMilestonesByEvent } from "@/lib/queries/milestones";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getStageTransitions } from "@/lib/queries/stage-transitions";
import { getHandoffNotes } from "@/app/actions/handoff-notes";
import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";
import { canAdvanceStage } from "@/app/actions/stages";
import { stageLabelFor, stageDescriptionFor } from "@/lib/customer-copy";
import { phaseForStage } from "@/lib/journey";
import { STAGE_CONFIG } from "@/types";
import { isOverdue } from "@/lib/dates";
import { entityTitle, getEventNameForTitle } from "@/lib/queries/page-titles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: entityTitle("Timeline", await getEventNameForTitle(id)) };
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  // Customers get a clean, milestone-driven journey here; the ops machinery
  // (stage-advance, health, stage history) is rendered only for internal
  // timeline-viewers below. Creative has no timeline in their scoped view.
  if (!canViewSection(user.role, "timeline")) redirect(`/events/${id}`);
  const [event, milestones, tasks, unread, transitions] = await Promise.all([
    getEventById(id),
    getMilestonesByEvent(id),
    getTasksByEvent(id),
    getUnreadCount(user.id),
    getStageTransitions(id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  const stageGate = isInternal
    ? await canAdvanceStage(id)
    : { canAdvance: false, blockers: [] };
  const handoffNotes = isInternal ? await getHandoffNotes(id) : [];

  const completedMilestones = milestones.filter(
    (m) => m.status === "complete",
  ).length;
  const missedMilestones = milestones.filter(
    (m) =>
      m.status !== "complete" &&
      m.status !== "skipped" &&
      isOverdue(m.targetDate),
  ).length;
  const stageConfig = STAGE_CONFIG[event.currentStage];
  const stageLabel = stageLabelFor(event.currentStage, !isInternal);
  const journeyPhase = phaseForStage(event.currentStage);
  const overdueTaskCount = tasks.filter(
    (t) =>
      t.status !== "complete" &&
      t.status !== "skipped" &&
      !!t.dueDate &&
      isOverdue(t.dueDate),
  ).length;

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Timeline"
      eyebrow={`${event.account.name} · Delivery plan`}
      title="The timeline."
      subtitle={isInternal ? `Currently in ${stageLabel}.` : `${stageLabel}.`}
      isInternal={isInternal}
      viewerRole={user.role}
      heroRight={
        isInternal ? (
          <EventHealthBadge event={event} overdueTaskCount={overdueTaskCount} />
        ) : undefined
      }
    >
      {!isInternal && (
        <section className="pt-10">
          <EditorialEyebrow>Your journey</EditorialEyebrow>
          <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
            The four phases of your event — your steps and ours, at a glance.
          </p>
          <div className="mt-6">
            <EventJourney
              eventId={id}
              currentStage={event.currentStage}
              milestones={milestones}
              variant="vertical"
            />
          </div>
        </section>
      )}

      <section className="py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
        <div>
          <EditorialEyebrow accent>Right now</EditorialEyebrow>
          <h2 className="text-heading text-foreground text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight mt-2">
            {stageLabel}
          </h2>
          <p className="mt-3 max-w-[58ch] text-base text-muted-foreground leading-relaxed">
            {isInternal
              ? "Advance the stage once every gate for this phase is cleared. Blockers, if any, are listed below the button."
              : stageDescriptionFor(event.currentStage)}
          </p>
          {canAdvanceEventStage(user.role) && (
            <div className="mt-5 max-w-md">
              <AdvanceStageButton
                eventId={id}
                currentStage={event.currentStage}
                canAdvance={stageGate.canAdvance}
                blockers={stageGate.blockers}
              />
            </div>
          )}
        </div>
        <div className="flex gap-8 md:gap-6 md:flex-col md:items-end md:text-right">
          <div>
            <p className="text-display text-foreground text-[clamp(2.25rem,5vw,3.25rem)] leading-none tabular-nums">
              {isInternal ? stageConfig.order + 1 : journeyPhase.index + 1}
              <span className="text-muted-foreground text-xl font-normal">
                {" / "}
                {isInternal ? 10 : journeyPhase.total}
              </span>
            </p>
            <p className="text-overline text-muted-foreground mt-1">
              {isInternal ? "Stage" : "Phase"}
            </p>
          </div>
          <div>
            <p className="text-display text-foreground text-[clamp(2.25rem,5vw,3.25rem)] leading-none tabular-nums">
              {completedMilestones}
              <span className="text-muted-foreground text-xl font-normal">
                {" / "}
                {milestones.length}
              </span>
            </p>
            <p className="text-overline text-muted-foreground mt-1">
              Milestones
            </p>
            {missedMilestones > 0 && (
              <p className="text-overline text-warning mt-1 tabular-nums">
                {missedMilestones} missed
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="pb-4">
        <StageProgressBar currentStage={event.currentStage} isCustomer={!isInternal} />
      </section>

      <Hairline className="opacity-60" />

      <section className="py-10">
        <EditorialEyebrow>Every milestone</EditorialEyebrow>
        <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
          The full delivery plan, from kickoff through wrap-up. Active
          milestones show who&apos;s on it.
        </p>
        <div className="mt-6">
          <MilestoneTimeline
            milestones={milestones}
            tasks={tasks}
            viewerRole={user.role}
            isInternal={isInternal}
          />
        </div>
      </section>

      {isInternal && (
        <>
          <Hairline className="opacity-60" />

          <section className="py-10">
            <EditorialEyebrow>Stage history</EditorialEyebrow>
            <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
              Every time this event advances to the next stage, we record who
              pushed it forward and when.
            </p>
            <div className="mt-6">
              <StageTransitions transitions={transitions} />
            </div>
          </section>

          {handoffNotes.length > 0 && (
            <>
              <Hairline className="opacity-60" />
              <section className="py-10">
                <EditorialEyebrow>Handoff notes</EditorialEyebrow>
                <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
                  What each team left for the next as the event moved between
                  stages — context that keeps the baton from being dropped.
                </p>
                <ul className="mt-6 flex flex-col gap-3">
                  {handoffNotes.map((note) => (
                    <li
                      key={note.id}
                      className="rounded-[var(--radius-card)] border border-border bg-card/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                        <span className="text-overline text-[var(--color-bb-cobalt)]">
                          {(STAGE_CONFIG[note.fromStage as keyof typeof STAGE_CONFIG]?.label ?? note.fromStage)}
                          {" → "}
                          {(STAGE_CONFIG[note.toStage as keyof typeof STAGE_CONFIG]?.label ?? note.toStage)}
                        </span>
                        <span className="text-overline text-muted-foreground">
                          {note.authorName ?? "Team"}
                        </span>
                      </div>
                      {note.whatsDone && (
                        <p className="text-sm text-foreground/90 leading-snug">
                          <span className="text-muted-foreground">Done · </span>
                          {note.whatsDone}
                        </p>
                      )}
                      {note.whatsPending && (
                        <p className="mt-1 text-sm text-foreground/90 leading-snug">
                          <span className="text-muted-foreground">Next · </span>
                          {note.whatsPending}
                        </p>
                      )}
                      {note.clientNotes && (
                        <p className="mt-1 text-sm text-foreground/90 leading-snug">
                          <span className="text-muted-foreground">Client · </span>
                          {note.clientNotes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </EventPageShell>
  );
}
