/** Internal kanban pipeline view — all events grouped by delivery stage. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { PipelinePresets } from "@/components/pipeline/PipelinePresets";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { getPipelineEvents } from "@/lib/queries/pipeline";
import { getUnreadCount } from "@/lib/queries/notifications";
import type { EventFilters } from "@/lib/queries/events";

interface PipelinePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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

  const [events, unread] = await Promise.all([
    getPipelineEvents(filters),
    getUnreadCount(user.id),
  ]);

  const owners = [...new Set(events.map((e) => e.ownerName).filter(Boolean))] as string[];
  const healthCounts = {
    green: events.filter((e) => e.healthStatus === "green").length,
    amber: events.filter((e) => e.healthStatus === "amber").length,
    red: events.filter((e) => e.healthStatus === "red").length,
  };

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Pipeline"
      title="The pipeline."
      subtitle={`${events.length} ${events.length === 1 ? "event" : "events"} in flight · ${healthCounts.green} on track · ${healthCounts.amber} at risk · ${healthCounts.red} blocked.`}
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
