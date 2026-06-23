import { createClient } from "@/lib/supabase/server";
import type { Task, UserRole } from "@/types";

/**
 * Count open tasks per event for a given viewer in a single round-trip.
 *
 * Two flavours, gated by `isInternal`:
 *   - internal: tasks where `assigned_to` is the current user. Mirrors how
 *     the dashboard pill answers "is anything actually waiting on me?"
 *   - customer: open `customer_action` tasks the customer hasn't ticked
 *     off — i.e. work genuinely on THEIR plate, not Bright.Blue-owned
 *     tasks that merely happen to be customer-visible. RLS already scopes
 *     events to the viewer's account, so we don't filter `account_id`.
 *
 * Returns a map keyed by `event_id` so the dashboard can hand each
 * `<EventCard>` its own number without a second query per card.
 */
export async function getOpenTaskCountsForUser(
  userId: string,
  isInternal: boolean,
  eventIds: string[]
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select("event_id, status, assigned_to, customer_visible")
    .in("event_id", eventIds)
    .not("status", "in", '("complete","skipped")');

  query = isInternal
    ? query.eq("assigned_to", userId)
    : query.eq("customer_visible", true).eq("task_type", "customer_action");

  const { data, error } = await query;
  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data) {
    const id = (row as { event_id: string }).event_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Per-event task progress: { completed, total } for each event in one round-trip.
 * Used by the dashboard progress rings.
 */
export async function getTaskProgressByEvent(
  eventIds: string[]
): Promise<Record<string, { completed: number; total: number }>> {
  if (eventIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("event_id, status")
    .in("event_id", eventIds);

  if (error || !data) return {};

  const progress: Record<string, { completed: number; total: number }> = {};
  for (const row of data as { event_id: string; status: string }[]) {
    if (!progress[row.event_id]) {
      progress[row.event_id] = { completed: 0, total: 0 };
    }
    progress[row.event_id].total++;
    if (row.status === "complete" || row.status === "skipped") {
      progress[row.event_id].completed++;
    }
  }
  return progress;
}

/**
 * All open tasks assigned to a user across every event they can see,
 * with parent event + account context joined in. Powers the dashboard
 * `MyTasksPanel` and the dedicated `/inbox` page.
 *
 * `includeCompletedSince` (ISO date) keeps a window of recently-finished
 * work visible when the user wants the satisfying "look at what I just
 * shipped" view; absent by default.
 */
export interface AssignedTaskWithContext extends Task {
  eventName: string;
  accountName: string | null;
}

export async function getTasksAssignedToUser(
  userId: string,
  options: { includeCompletedSince?: string; page?: number; pageSize?: number } = {}
): Promise<AssignedTaskWithContext[]> {
  const supabase = await createClient();
  let query = supabase
    .from("tasks")
    .select(
      "*, assigned:profiles!tasks_assigned_to_fkey(id, name, email, role, account_id), events!inner(id, name, account_id, accounts(name))"
    )
    .eq("assigned_to", userId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (options.includeCompletedSince) {
    // Pull pending/in_progress/blocked plus anything completed since the cut-off.
    // We do this as a single fetch with a server-side OR to keep it efficient.
    query = query.or(
      `status.in.(pending,in_progress,blocked),and(status.eq.complete,completed_at.gte.${options.includeCompletedSince})`
    );
  } else {
    query = query.not("status", "in", '("complete","skipped")');
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const assigned = r.assigned as Record<string, unknown> | null;
    const events = r.events as
      | { id: string; name: string; accounts: { name?: string } | null }
      | null;
    return {
      id: r.id as string,
      eventId: r.event_id as string,
      milestoneId: (r.milestone_id as string | null) ?? undefined,
      title: r.title as string,
      description: (r.description as string | null) ?? undefined,
      taskType: r.task_type as Task["taskType"],
      category: r.category as Task["category"],
      status: r.status as Task["status"],
      priority: r.priority as Task["priority"],
      assignedTo: assigned
        ? {
            id: assigned.id as string,
            name: assigned.name as string,
            email: assigned.email as string,
            role: assigned.role as NonNullable<Task["assignedTo"]>["role"],
            accountId: assigned.account_id as string | undefined,
            hasCompletedOnboarding: true,
          }
        : undefined,
      assignedRole: (r.assigned_role as string | null) as Task["assignedRole"],
      targetPath: (r.target_path as string | null) ?? undefined,
      dueDate: (r.due_date as string | null) ?? undefined,
      completedAt: (r.completed_at as string | null) ?? undefined,
      isBlocking: Boolean(r.is_blocking),
      customerVisible: Boolean(r.customer_visible),
      sortOrder: (r.sort_order as number) ?? 0,
      eventName: events?.name ?? "Unknown event",
      accountName: events?.accounts?.name ?? null,
    };
  });
}

/** A group of open tasks for a single event, enriched with event context. */
export interface TaskGroupByEvent {
  eventId: string;
  eventName: string;
  accountName: string;
  eventDate: string;
  healthStatus: string;
  tasks: Task[];
}

/**
 * Open *internal* tasks for the given role or user, grouped by active event.
 *
 * This powers the internal "needs you now" / my-work surfaces, so it returns
 * only `internal_action` tasks — work the Bright.Blue team actually does.
 * `customer_action` tasks are the customer's responsibility (tracked on the
 * customer side and at the event-health level); surfacing them here made an
 * internal user's list show jobs they don't own — and that the customer had
 * often already completed — which read as "to-do but already done".
 *
 * Pulls tasks where `assigned_role = role` OR `assigned_to = userId` from
 * non-terminal events, excluding completed/skipped tasks. Ordered by earliest
 * due date first, then by event start date.
 */
export async function getTasksByRole(
  role: UserRole,
  userId: string,
): Promise<TaskGroupByEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select(
      "*, events!inner(id, name, account_id, event_date_start, health_status, current_stage, accounts(name))"
    )
    .eq("task_type", "internal_action")
    .not("status", "in", '("complete","skipped")')
    .not("events.current_stage", "in", '("complete")')
    .or(`assigned_role.eq.${role},assigned_to.eq.${userId}`)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error || !data) return [];

  const groupMap = new Map<string, TaskGroupByEvent>();

  for (const row of data) {
    const r = row as Record<string, unknown>;
    const ev = r.events as {
      id: string;
      name: string;
      event_date_start: string;
      health_status: string;
      accounts: { name?: string } | null;
    };
    const eid = ev.id;

    if (!groupMap.has(eid)) {
      groupMap.set(eid, {
        eventId: eid,
        eventName: ev.name,
        accountName: ev.accounts?.name ?? "Unknown",
        eventDate: ev.event_date_start,
        healthStatus: ev.health_status,
        tasks: [],
      });
    }

    const assigned = r.assigned as Record<string, unknown> | null | undefined;
    groupMap.get(eid)!.tasks.push({
      id: r.id as string,
      eventId: eid,
      milestoneId: (r.milestone_id as string | null) ?? undefined,
      title: r.title as string,
      description: (r.description as string | null) ?? undefined,
      taskType: r.task_type as Task["taskType"],
      category: r.category as Task["category"],
      status: r.status as Task["status"],
      priority: r.priority as Task["priority"],
      assignedTo: assigned
        ? {
            id: assigned.id as string,
            name: assigned.name as string,
            email: assigned.email as string,
            role: assigned.role as NonNullable<Task["assignedTo"]>["role"],
            accountId: assigned.account_id as string | undefined,
            hasCompletedOnboarding: true,
          }
        : undefined,
      assignedRole: (r.assigned_role as string | null) as Task["assignedRole"],
      targetPath: (r.target_path as string | null) ?? undefined,
      dueDate: (r.due_date as string | null) ?? undefined,
      completedAt: (r.completed_at as string | null) ?? undefined,
      isBlocking: Boolean(r.is_blocking),
      customerVisible: Boolean(r.customer_visible),
      sortOrder: (r.sort_order as number) ?? 0,
    });
  }

  return [...groupMap.values()].sort((a, b) => {
    const aFirst = a.tasks[0]?.dueDate ?? "9999-12-31";
    const bFirst = b.tasks[0]?.dueDate ?? "9999-12-31";
    if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);
    return a.eventDate.localeCompare(b.eventDate);
  });
}

export async function getTasksByEvent(eventId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, assigned:profiles!tasks_assigned_to_fkey(id, name, email, role, account_id)")
    .eq("event_id", eventId)
    .order("sort_order");

  if (error || !data) return [];

  return data.map((row) => {
    const assigned = row.assigned as Record<string, unknown> | null;
    return {
      id: row.id,
      eventId: row.event_id,
      milestoneId: row.milestone_id ?? undefined,
      title: row.title,
      description: row.description ?? undefined,
      taskType: row.task_type,
      category: row.category,
      status: row.status,
      priority: row.priority,
      assignedTo: assigned
        ? {
            id: assigned.id as string,
            name: assigned.name as string,
            email: assigned.email as string,
            role: assigned.role as NonNullable<Task["assignedTo"]>["role"],
            accountId: assigned.account_id as string | undefined,
            hasCompletedOnboarding: true,
          }
        : undefined,
      assignedRole: row.assigned_role ?? undefined,
      targetPath: row.target_path ?? undefined,
      dueDate: row.due_date ?? undefined,
      completedAt: row.completed_at ?? undefined,
      isBlocking: row.is_blocking,
      customerVisible: row.customer_visible,
      sortOrder: row.sort_order,
    };
  });
}
