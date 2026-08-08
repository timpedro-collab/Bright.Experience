/**
 * Internal task inbox — every open (and optionally recently completed)
 * task assigned to the current user, across every event they touch.
 *
 * URL filters (all optional):
 *   ?event={id}                 restrict to a single event
 *   ?category={creative|...}    restrict to one category
 *   ?status={open|recent|all}   defaults to "open"
 *
 * Pairs with the dashboard `MyTasksPanel`: the panel is a top-8 preview;
 * this page is the deep-dive list.
 *
 * Editorial Bright.Experience design language:
 *   - EditionShell + EditionChrome + RidgeHero
 *   - hairline-separated groups (Overdue / Due soon / Open / Done)
 *   - clean rows with tracked metadata and cobalt accents
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { CommandPalette } from "@/components/layout/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import {
  EditionShell,
  EditionChrome,
  EditionBody,
  EditionFooter,
  RidgeHero,
} from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  InboxFilters,
  type InboxEventOption,
} from "@/components/inbox/InboxFilters";
import { TaskGroup } from "@/components/inbox/TaskGroup";

import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import {
  getTasksAssignedToUser,
  type AssignedTaskWithContext,
} from "@/lib/queries/tasks";
import { getUnreadCount } from "@/lib/queries/notifications";
import { daysUntilDate, isOverdue } from "@/lib/dates";
import { parsePage, PAGE_SIZE } from "@/lib/pagination";
import { Pagination } from "@/components/ui/Pagination";
import type { TaskCategory } from "@/types";

export const metadata = {
  title: "Inbox",
};

const ALL_CATEGORIES: TaskCategory[] = [
  "creative",
  "operations",
  "qa",
  "development",
  "logistics",
  "reporting",
  "admin",
];

const RECENT_WINDOW_DAYS = 14;

interface InboxPageProps {
  searchParams: Promise<{
    event?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const params = await searchParams;
  const eventFilter = params.event ?? "all";
  const categoryFilter = (params.category ?? "all") as TaskCategory | "all";
  const statusFilter = params.status ?? "open";

  // Server Components run once per request; reading the current time here
  // is intentional — the cutoff is a per-request boundary, not render state.
  // eslint-disable-next-line react-hooks/purity
  const recentCutoff = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const includeCompleted =
    statusFilter === "recent" || statusFilter === "all"
      ? recentCutoff
      : undefined;

  const [allTasks, unread] = await Promise.all([
    getTasksAssignedToUser(user.id, {
      includeCompletedSince: includeCompleted,
    }),
    getUnreadCount(user.id),
  ]);

  const eventOptionsMap = new Map<string, InboxEventOption>();
  for (const task of allTasks) {
    if (!eventOptionsMap.has(task.eventId)) {
      eventOptionsMap.set(task.eventId, {
        id: task.eventId,
        name: task.eventName,
        accountName: task.accountName,
      });
    }
  }
  const eventOptions = Array.from(eventOptionsMap.values()).sort((a, b) =>
    `${a.accountName ?? ""}${a.name}`.localeCompare(
      `${b.accountName ?? ""}${b.name}`,
    ),
  );

  let filtered = allTasks;
  if (eventFilter !== "all") {
    filtered = filtered.filter((t) => t.eventId === eventFilter);
  }
  if (categoryFilter !== "all") {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }
  if (statusFilter === "recent") {
    filtered = filtered.filter((t) => t.status === "complete");
  }
  if (statusFilter === "open") {
    filtered = filtered.filter((t) => t.status !== "complete");
  }

  // Group: overdue → due-soon (3d) → other open → completed
  const overdue: AssignedTaskWithContext[] = [];
  const dueSoon: AssignedTaskWithContext[] = [];
  const other: AssignedTaskWithContext[] = [];
  const completed: AssignedTaskWithContext[] = [];
  for (const task of filtered) {
    if (task.status === "complete") {
      completed.push(task);
      continue;
    }
    if (task.dueDate && isOverdue(task.dueDate)) {
      overdue.push(task);
      continue;
    }
    if (task.dueDate && daysUntilDate(task.dueDate) <= 3) {
      dueSoon.push(task);
      continue;
    }
    other.push(task);
  }

  const openTotal = overdue.length + dueSoon.length + other.length;

  // Order by urgency *before* paginating, so page 1 always shows the most
  // urgent work and the group headers stay meaningful across pages (previously
  // the page slice took an arbitrary order and re-bucketed only what landed on
  // it — overdue tasks could hide on page 2). Within a group, soonest-due first.
  const byDueDate = (a: AssignedTaskWithContext, b: AssignedTaskWithContext) => {
    const aD = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bD = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aD - bD;
  };
  const ordered = [
    ...overdue.sort(byDueDate),
    ...dueSoon.sort(byDueDate),
    ...other.sort(byDueDate),
    ...completed,
  ];

  const page = parsePage(params as Record<string, string | string[] | undefined>);
  const inboxTotalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const sliceStart = (page - 1) * PAGE_SIZE;
  const paginatedSlice = ordered.slice(sliceStart, sliceStart + PAGE_SIZE);

  const pgOverdue = paginatedSlice.filter((t) => t.status !== "complete" && t.dueDate && isOverdue(t.dueDate));
  const pgDueSoon = paginatedSlice.filter((t) => t.status !== "complete" && t.dueDate && !isOverdue(t.dueDate) && daysUntilDate(t.dueDate) <= 3);
  const pgOther = paginatedSlice.filter((t) => t.status !== "complete" && !(t.dueDate && isOverdue(t.dueDate)) && !(t.dueDate && daysUntilDate(t.dueDate) <= 3));
  const pgCompleted = paginatedSlice.filter((t) => t.status === "complete");

  const subtitle =
    openTotal === 0 && completed.length === 0
      ? "Nothing is on you right now. Take a breath."
      : `${openTotal} open task${openTotal === 1 ? "" : "s"} across ${eventOptions.length} event${eventOptions.length === 1 ? "" : "s"}.`;

  return (
    <EditionShell>
      <EditionChrome
        breadcrumbs={[{ label: "Your work" }]}
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
        seed={`inbox::${user.id}`}
        eyebrow="Internal · Cross-event"
        title="Your work."
        subtitle={subtitle}
      />

      <EditionBody>
        <section className="py-8">
          <InboxFilters events={eventOptions} categories={ALL_CATEGORIES} />
        </section>

        {openTotal === 0 && completed.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Inbox zero"
            description="Every open task assigned to you is filtered out (or there are none). Adjust filters above or take a victory lap."
            size="lg"
          />
        ) : (
          <div className="flex flex-col gap-12 pb-8">
            {pgOverdue.length > 0 && (
              <TaskGroup
                title="Overdue"
                tone="destructive"
                tasks={pgOverdue}
                countLabel="now"
              />
            )}
            {pgDueSoon.length > 0 && (
              <TaskGroup
                title="Due in the next 3 days"
                tone="warning"
                tasks={pgDueSoon}
                countLabel="soon"
              />
            )}
            {pgOther.length > 0 && (
              <TaskGroup
                title="Everything else"
                tone="default"
                tasks={pgOther}
                countLabel="open"
              />
            )}
            {pgCompleted.length > 0 && (
              <TaskGroup
                title="Recently completed"
                tone="success"
                tasks={pgCompleted}
                countLabel="done"
                completed
              />
            )}
            <Pagination
              currentPage={page}
              totalPages={inboxTotalPages}
              basePath="/inbox"
            />
          </div>
        )}
      </EditionBody>

      <EditionFooter
        rightSlot={
          <Link href="/" className="hover:opacity-80 transition-opacity">
            Back to home →
          </Link>
        }
      />
      <CommandPalette isInternal role={user.role} />
    </EditionShell>
  );
}
