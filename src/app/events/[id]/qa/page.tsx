/** Event QA checklist page — quality assurance checks with pass/fail tracking */
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EventContextBar } from "@/components/events/EventContextBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { QAChecklist } from "@/components/qa/QAChecklist";
import { getEventById } from "@/lib/queries/events";
import { getQAItemsByEvent } from "@/lib/queries/qa-items";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";

export default async function QAPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const [event, qaItems, unread] = await Promise.all([
    getEventById(id),
    getQAItemsByEvent(id),
    getUnreadCount(user.id),
  ]);
  const isInternal = isInternalRole(user.role);
  if (!event) return notFound();

  return (
    <AppShell
      eventId={id}
      user={user}
      isInternal={isInternal}
      notificationCount={unread}
    >
      <EventContextBar event={event} currentSection="Quality assurance" />
      <PageHeader
        eyebrow="Pre-event readiness"
        title="Quality assurance"
        subtitle="A final, opinionated checklist so we ship a flawless experience on the day."
      />
      {qaItems.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No QA items yet"
          description="Quality assurance checks will appear here when the event reaches the QA stage."
          action={{ label: "View timeline", href: `/events/${id}/timeline` }}
        />
      ) : (
        <QAChecklist eventId={id} items={qaItems} isInternal={isInternal} />
      )}
    </AppShell>
  );
}
