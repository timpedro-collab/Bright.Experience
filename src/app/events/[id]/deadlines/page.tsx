/** Unified deadline view — every due date across tasks, assets, and milestones. */
import { notFound, redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";

import Link from "next/link";

import { EventPageShell } from "@/components/brand/event-page-shell";
import { EditorialEyebrow } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeadlineTimeline } from "@/components/events/DeadlineTimeline";

import { getEventById } from "@/lib/queries/events";
import { getDeadlinesByEvent } from "@/lib/queries/deadlines";
import { getUnreadCount } from "@/lib/queries/notifications";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { canViewSection } from "@/lib/event-access";

export default async function DeadlinesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!canViewSection(user.role, "deadlines")) redirect(`/events/${id}`);

  const [event, deadlines, unread] = await Promise.all([
    getEventById(id),
    getDeadlinesByEvent(id),
    getUnreadCount(user.id),
  ]);
  if (!event) return notFound();

  const isInternal = isInternalRole(user.role);
  // Customers only see their own deadlines, so the headline counts must come
  // from the same set the timeline renders — otherwise the subtitle could
  // claim overdue items the customer's own list never shows.
  const visibleDeadlines = isInternal
    ? deadlines
    : deadlines.filter((d) => d.owner === "customer");
  const overdue = visibleDeadlines.filter((d) => d.urgency === "overdue").length;
  const dueSoon = visibleDeadlines.filter((d) => d.urgency === "due_soon").length;

  const subtitle =
    visibleDeadlines.length === 0
      ? "No upcoming deadlines for this event."
      : overdue > 0
        ? `${overdue} overdue item${overdue === 1 ? "" : "s"} need attention now.`
        : dueSoon > 0
          ? `${dueSoon} item${dueSoon === 1 ? "" : "s"} due within the next 7 days.`
          : "All deadlines on track.";

  return (
    <EventPageShell
      event={event}
      user={user}
      unreadCount={unread}
      section="Deadlines"
      title="Deadlines."
      subtitle={subtitle}
      isInternal={isInternal}
      viewerRole={user.role}
    >
      {visibleDeadlines.length === 0 ? (
        <section className="py-8">
          <EmptyState
            icon={CalendarClock}
            title="No deadlines yet"
            description="Deadlines will appear here once tasks, assets, and milestones have due dates assigned."
          />
        </section>
      ) : (
        <section className="py-8">
          <div className="flex items-center justify-between gap-4">
            <EditorialEyebrow accent>
              {isInternal ? "All deadlines" : "Your schedule"}
            </EditorialEyebrow>
            <Link
              href={`/events/${id}`}
              className="text-overline text-[var(--color-bb-cobalt)] hover:opacity-80 transition-opacity"
            >
              What&apos;s needed now →
            </Link>
          </div>
          <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
            Every due date across tasks, assets, and milestones. For the single
            most important next step, head to the overview.
          </p>
          <div className="mt-5">
            <DeadlineTimeline
              isInternal={isInternal}
              viewerRole={user.role}
              deadlines={visibleDeadlines}
            />
          </div>
        </section>
      )}
    </EventPageShell>
  );
}
