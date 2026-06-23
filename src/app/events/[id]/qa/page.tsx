/** Event QA checklist — quality assurance checks with pass/fail tracking. */
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { QAChecklist } from "@/components/qa/QAChecklist";

import { getEventById } from "@/lib/queries/events";
import { getQAItemsByEvent } from "@/lib/queries/qa-items";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";

export default async function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "qa")) redirect(`/events/${id}`);
  const [event, qaItems, unread] = await Promise.all([
    getEventById(id),
    getQAItemsByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Quality assurance"
      slug="qa"
      title="Pre-event readiness."
      subtitle="A final, opinionated checklist so we ship a flawless experience on the day."
      isInternal={isInternal}
      viewerRole={user.role}
    >
      <section className="py-8">
        {qaItems.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No QA items yet"
            description="Quality assurance checks will appear here when the event reaches the QA stage."
            action={{ label: "View timeline", href: `/events/${id}/timeline` }}
          />
        ) : (
          <QAChecklist eventId={id} items={qaItems} isInternal={isInternal} viewerRole={user.role} />
        )}
      </section>
    </EventPageShell>
  );
}
