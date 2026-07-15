/** Unified deadline queries — surfaces every upcoming due date across tasks, assets, and milestones. */

import { createClient } from "@/lib/supabase/server";
import { ownerForTaskRow, type OwnerRole } from "@/lib/ownership";

export type DeadlineUrgency = "on_track" | "due_soon" | "overdue";
/** The team (or customer) a deadline currently sits with. */
export type DeadlineOwner = OwnerRole;

export interface DeadlineItem {
  id: string;
  eventId: string;
  entityType: "task" | "asset" | "milestone";
  title: string;
  dueDate: string;
  urgency: DeadlineUrgency;
  owner: DeadlineOwner;
  status: string;
}

function urgencyFor(dueDate: string): DeadlineUrgency {
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "due_soon";
  return "on_track";
}

export async function getDeadlinesByEvent(eventId: string): Promise<DeadlineItem[]> {
  const supabase = await createClient();
  const items: DeadlineItem[] = [];

  const [{ data: tasks }, { data: assets }, { data: milestones }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, status, task_type, category")
      .eq("event_id", eventId)
      .not("due_date", "is", null)
      .not("status", "in", '("complete","skipped")'),
    supabase
      .from("assets")
      .select("id, name, due_date, status, customer_visible")
      .eq("event_id", eventId)
      .not("due_date", "is", null)
      .not("status", "in", '("accepted","rejected")'),
    supabase
      .from("milestones")
      .select("id, name, target_date, status")
      .eq("event_id", eventId)
      .not("target_date", "is", null)
      .not("status", "in", '("completed","skipped")'),
  ]);

  for (const t of tasks ?? []) {
    items.push({
      id: t.id,
      eventId,
      entityType: "task",
      title: t.title,
      dueDate: t.due_date,
      urgency: urgencyFor(t.due_date),
      owner: ownerForTaskRow(t.task_type, t.category),
      status: t.status,
    });
  }

  for (const a of assets ?? []) {
    items.push({
      id: a.id,
      eventId,
      entityType: "asset",
      title: a.name,
      dueDate: a.due_date,
      urgency: urgencyFor(a.due_date),
      // Asset slots default to the customer (they supply the creative). Only an
      // asset explicitly hidden from the customer belongs to the creative team.
      owner: a.customer_visible === false ? "creative" : "customer",
      status: a.status,
    });
  }

  for (const m of milestones ?? []) {
    items.push({
      id: m.id,
      eventId,
      entityType: "milestone",
      title: m.name,
      dueDate: m.target_date,
      urgency: urgencyFor(m.target_date),
      // Milestones are advanced by the account/events lead, not a delivery team.
      owner: "ae",
      status: m.status,
    });
  }

  items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return items;
}

export interface CustomerActionItem {
  id: string;
  eventId: string;
  entityType: "task" | "asset" | "briefing";
  title: string;
  dueDate?: string;
  urgency?: DeadlineUrgency;
  /** Event sub-page suffix where this item is actioned (tasks only). */
  targetPath?: string;
}

/** Everything the customer currently owes — pending assets, incomplete briefings, overdue tasks. */
export async function getCustomerActionItems(eventId: string): Promise<CustomerActionItem[]> {
  const supabase = await createClient();
  const items: CustomerActionItem[] = [];

  const [{ data: tasks }, { data: assets }, { data: briefings }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date, status, target_path")
      .eq("event_id", eventId)
      .eq("task_type", "customer_action")
      .not("status", "in", '("complete","skipped")'),
    supabase
      .from("assets")
      .select("id, name, due_date, status, review_status")
      .eq("event_id", eventId)
      .eq("customer_visible", true)
      .in("status", ["required"])
      .or("review_status.eq.revision_requested"),
    supabase
      .from("briefing_responses")
      .select("event_id, form_type, is_submitted")
      .eq("event_id", eventId)
      .eq("is_submitted", false),
  ]);

  for (const t of tasks ?? []) {
    items.push({
      id: t.id,
      eventId,
      entityType: "task",
      title: t.title,
      dueDate: t.due_date ?? undefined,
      urgency: t.due_date ? urgencyFor(t.due_date) : undefined,
      targetPath: (t.target_path as string | null) ?? undefined,
    });
  }

  for (const a of assets ?? []) {
    items.push({
      id: a.id,
      eventId,
      entityType: "asset",
      title: `Upload: ${a.name}`,
      dueDate: a.due_date ?? undefined,
      urgency: a.due_date ? urgencyFor(a.due_date) : undefined,
    });
  }

  for (const b of briefings ?? []) {
    const label = (b.form_type as string) === "ops" ? "Ops briefing" : "Creative briefing";
    items.push({
      id: `briefing-${b.form_type}`,
      eventId,
      entityType: "briefing",
      title: `Complete: ${label}`,
    });
  }

  items.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return items;
}
