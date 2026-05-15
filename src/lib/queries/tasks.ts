import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types";

/**
 * Count open tasks per event for a given viewer in a single round-trip.
 *
 * Two flavours, gated by `isInternal`:
 *   - internal: tasks where `assigned_to` is the current user. Mirrors how
 *     the dashboard pill answers "is anything actually waiting on me?"
 *   - customer: tasks where `customer_visible` is true and the customer
 *     hasn't ticked them off. RLS already scopes events to the viewer's
 *     account, so we don't need to filter on `account_id` here.
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
    : query.eq("customer_visible", true);

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
  options: { includeCompletedSince?: string } = {}
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
          }
        : undefined,
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
            role: assigned.role as Task["assignedTo"] extends undefined ? never : NonNullable<Task["assignedTo"]>["role"],
            accountId: assigned.account_id as string | undefined,
          }
        : undefined,
      dueDate: row.due_date ?? undefined,
      completedAt: row.completed_at ?? undefined,
      isBlocking: row.is_blocking,
      customerVisible: row.customer_visible,
      sortOrder: row.sort_order,
    };
  });
}
