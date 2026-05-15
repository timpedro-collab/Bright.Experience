import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { Card } from "@/components/ui/card";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { StageProgressBar } from "@/components/events/StageProgressBar";
import { HealthBadge } from "@/components/ui/StatusBadge";
import { getEventById } from "@/lib/queries/events";
import { getMilestonesByEvent } from "@/lib/queries/milestones";
import { getTasksByEvent } from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { STAGE_CONFIG } from "@/types";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, milestones, tasks, unread] = await Promise.all([
    getEventById(id),
    getMilestonesByEvent(id),
    getTasksByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  const completedMilestones = milestones.filter(
    (m) => m.status === "complete"
  ).length;
  const stageConfig = STAGE_CONFIG[event.currentStage];

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Timeline" />
      <PageHeader
        eyebrow="Delivery plan"
        title="Timeline"
        subtitle={`Currently in ${stageConfig.label.toLowerCase()} — ${completedMilestones} of ${milestones.length} milestones complete.`}
        actions={<HealthBadge status={event.healthStatus} />}
      />

      <Card tone="subtle" className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-overline text-muted-foreground mb-1">
              Current stage
            </p>
            <h2 className="text-heading text-lg font-semibold text-foreground">
              {stageConfig.label}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-heading text-2xl font-bold text-primary tabular-nums">
              {completedMilestones}
              <span className="text-muted-foreground text-base font-normal">
                /{milestones.length}
              </span>
            </p>
            <p className="text-overline text-muted-foreground">
              Milestones complete
            </p>
          </div>
        </div>
        <StageProgressBar currentStage={event.currentStage} />
      </Card>

      <Card tone="subtle" className="p-8">
        <h2 className="text-heading text-base font-semibold text-foreground mb-6">
          Event milestones
        </h2>
        <MilestoneTimeline
          milestones={milestones}
          tasks={tasks}
          viewerRole={user.role}
        />
      </Card>
    </AppShell>
  );
}
