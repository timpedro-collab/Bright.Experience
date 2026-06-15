/** Full activity log for an event — paginated audit trail. */
import { notFound, redirect } from "next/navigation";

import { EventPageShell, EditorialEyebrow } from "@/components/brand";
import { ActivityFeed } from "@/components/events/ActivityFeed";
import { Pagination } from "@/components/ui/Pagination";

import { getUser } from "@/lib/auth";
import { getEventById } from "@/lib/queries/events";
import { getAuditEntriesForEvent } from "@/lib/queries/audit";
import { getUnreadCount } from "@/lib/queries/notifications";
import { isInternalRole } from "@/lib/roles";
import { parsePage } from "@/lib/pagination";

export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const sp = await searchParams;
  const page = parsePage(sp);

  const [event, auditResult, unread] = await Promise.all([
    getEventById(id),
    getAuditEntriesForEvent(id, page),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Activity"
      title="Activity log."
      subtitle="A complete record of everything that has happened on this event."
      isInternal={isInternalRole(user.role)}
    >
      <section className="py-8">
        <EditorialEyebrow accent>
          {auditResult.totalCount} entries
        </EditorialEyebrow>
        <div className="mt-4">
          <ActivityFeed entries={auditResult.data} />
        </div>
        {auditResult.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={auditResult.totalPages}
            basePath={`/events/${id}/activity`}
          />
        )}
      </section>
    </EventPageShell>
  );
}
