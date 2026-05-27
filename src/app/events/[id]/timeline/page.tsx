/**
 * Event timeline — full milestone list with stage progress and current
 * stage callout. Built on the editorial Bright.Experience design language
 * (EditionShell + RidgeHero, no sidebar, no glass cards).
 */

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
  EditorialEyebrow,
  Hairline,
} from "@/components/brand";
import { HealthBadge } from "@/components/ui/StatusBadge";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { StageProgressBar } from "@/components/events/StageProgressBar";

import { getEventById } from "@/lib/queries/events";
import { getMilestonesByEvent } from "@/lib/queries/milestones";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getStageTransitions } from "@/lib/queries/stage-transitions";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canAdvanceStage } from "@/app/actions/stages";
import { AdvanceStageButton } from "@/components/events/AdvanceStageButton";
import { StageTransitions } from "@/components/timeline/StageTransitions";
import { STAGE_CONFIG } from "@/types";
import { isOverdue } from "@/lib/dates";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
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

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: event.name, href: `/events/${id}` },
          { label: "Timeline" },
        ]}
        rightSlot={
          <>
            <NotificationBell unreadCount={unread} />
            <span
              className="hidden md:block h-6 w-px bg-border"
              aria-hidden
            />
            <UserMenu user={user} />
          </>
        }
      />

      <RidgeHero
        seed={`${event.id}::timeline`}
        eyebrow={`${event.account.name} · Delivery plan`}
        title="The timeline."
        subtitle={`Currently in ${stageConfig.label}. ${completedMilestones} of ${milestones.length} milestones complete${missedMilestones > 0 ? ` · ${missedMilestones} missed` : ""}.`}
        rightSlot={
          <div className="flex items-center gap-2">
            <HealthBadge status={event.healthStatus} />
          </div>
        }
      />

      <EditionBody>
        {/* Stage strip */}
        <section className="py-6">
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <EditorialEyebrow accent>The journey</EditorialEyebrow>
            <span className="text-overline text-muted-foreground tabular-nums">
              Stage {stageConfig.order + 1} of 10 · {stageConfig.label}
            </span>
          </div>
          <StageProgressBar currentStage={event.currentStage} />
        </section>

        <Hairline className="opacity-60" />

        {/* Current stage callout */}
        <section className="py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <EditorialEyebrow>Right now</EditorialEyebrow>
            <h2 className="text-heading text-foreground text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight mt-2">
              {stageConfig.label}
            </h2>
            <p className="mt-3 max-w-[58ch] text-base text-muted-foreground leading-relaxed">
              We&apos;ll keep you posted as this stage advances. Anything
              that needs your eyes lives in your inbox and on the event
              page.
            </p>
            {isInternal && (
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
          <div className="text-right">
            <p className="text-display text-foreground text-[clamp(3rem,6vw,4.5rem)] leading-none tabular-nums">
              {completedMilestones}
              <span className="text-muted-foreground text-2xl font-normal">
                {" / "}
                {milestones.length}
              </span>
            </p>
            <p className="text-overline text-muted-foreground mt-1">
              Milestones complete
            </p>
            {missedMilestones > 0 && (
              <p className="text-overline text-warning mt-1 tabular-nums">
                {missedMilestones} missed
              </p>
            )}
          </div>
        </section>

        <Hairline className="opacity-60" />

        {/* All milestones */}
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
            />
          </div>
        </section>

        <Hairline className="opacity-60" />

        {/* Stage transition log */}
        <section className="py-10">
          <EditorialEyebrow>Stage history</EditorialEyebrow>
          <p className="mt-2 text-sm text-muted-foreground max-w-[58ch]">
            Every time this event advances to the next stage, we record
            who pushed it forward and when.
          </p>
          <div className="mt-6">
            <StageTransitions transitions={transitions} />
          </div>
        </section>
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link
            href={`/events/${id}`}
            className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-3 w-3" /> Back to {event.name}
          </Link>
        }
      />
      <CommandPalette />
    </EditionShell>
  );
}
