/** Internal kanban pipeline view — all events grouped by delivery stage. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { PipelinePresets } from "@/components/pipeline/PipelinePresets";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { getPipelineEvents } from "@/lib/queries/pipeline";
import { getOverdueTaskCountsForEvents } from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { deriveEventHealth, isEventWrapped } from "@/lib/event-health";
import type { EventFilters } from "@/lib/queries/events";

interface PipelinePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata = {
  title: "Pipeline",
};

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const params = await searchParams;
  const filters: EventFilters = {
    q: typeof params.q === "string" ? params.q : undefined,
    stage: typeof params.stage === "string" ? params.stage : undefined,
    health: typeof params.health === "string" ? params.health : undefined,
    account: typeof params.account === "string" ? params.account : undefined,
  };

  const [rawEvents, unread] = await Promise.all([
    getPipelineEvents(filters),
    getUnreadCount(user.id),
  ]);

  // Health is derived from reality (dates + overdue tasks), not the stored
  // chip — a date-passed kickoff event must never read "On track" here.
  const overdueCounts = await getOverdueTaskCountsForEvents(
    rawEvents.map((e) => e.id),
  );
  const events = rawEvents.map((e) => {
    const chip = deriveEventHealth({
      ...e,
      overdueTaskCount: overdueCounts[e.id] ?? 0,
    });
    return chip.kind === "health" ? { ...e, healthStatus: chip.status } : e;
  });

  const owners = [...new Set(events.map((e) => e.ownerName).filter(Boolean))] as string[];
  const inFlight = events.filter((e) => !isEventWrapped(e));
  const healthCounts = {
    green: inFlight.filter((e) => e.healthStatus === "green").length,
    amber: inFlight.filter((e) => e.healthStatus === "amber").length,
    red: inFlight.filter((e) => e.healthStatus === "red").length,
  };

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Pipeline"
      title="The pipeline."
      subtitle={`${inFlight.length} ${inFlight.length === 1 ? "event" : "events"} in flight · ${healthCounts.green} on track · ${healthCounts.amber} at risk · ${healthCounts.red} blocked.`}
    >
      <AutoRefresh />
      <div className="py-8">
        <PipelinePresets params={filters} />
        <PipelineBoard
          events={events}
          owners={owners}
          canManageStage={canAdvanceEventStage(user.role)}
          initialHealth={
            filters.health &&
            (filters.health === "green" ||
              filters.health === "amber" ||
              filters.health === "red")
              ? filters.health
              : "all"
          }
        />
      </div>
    </AdminPageShell>
  );
}
