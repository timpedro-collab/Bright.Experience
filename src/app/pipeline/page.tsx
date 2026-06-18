/** Internal kanban pipeline view — all events grouped by delivery stage. */
import { redirect } from "next/navigation";

import { AdminPageShell } from "@/components/brand";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { AutoRefresh } from "@/components/system/AutoRefresh";

import { getUser } from "@/lib/auth";
import { isInternalRole, canAdvanceEventStage } from "@/lib/roles";
import { getPipelineEvents } from "@/lib/queries/pipeline";
import { getUnreadCount } from "@/lib/queries/notifications";

export default async function PipelinePage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!isInternalRole(user.role)) redirect("/");

  const [events, unread] = await Promise.all([
    getPipelineEvents(),
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
      subtitle={`${events.length} events in flight · ${healthCounts.green} on track · ${healthCounts.amber} at risk · ${healthCounts.red} blocked.`}
    >
      <AutoRefresh />
      <div className="py-8">
        <PipelineBoard
          events={events}
          owners={owners}
          canManageStage={canAdvanceEventStage(user.role)}
        />
      </div>
    </AdminPageShell>
  );
}
