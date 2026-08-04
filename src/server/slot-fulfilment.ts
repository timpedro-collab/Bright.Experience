/** Spawns the standard fulfilment checklist when a sponsorship slot is sold. */
import "server-only";

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface SlotFulfilmentInput {
  slotId: string;
  eventId: string;
  sponsorName: string | null;
  startDate: string;
}

export const SLOT_FULFILMENT_TEMPLATE: Array<{
  title: string;
  description: string;
  category: "creative" | "operations" | "logistics";
  priority: "high" | "medium";
  daysBeforeDoors: number;
  isBlocking: boolean;
}> = [
  {
    title: "Collect sponsor artwork — {sponsor}",
    description:
      "Gather logo, brand colours, and campaign artwork for the wrap and game skin.",
    category: "creative",
    priority: "high",
    daysBeforeDoors: 14,
    isBlocking: true,
  },
  {
    title: "Approve sponsor wrap proof — {sponsor}",
    description:
      "Route the wrap design through the standard versioned approval workflow.",
    category: "creative",
    priority: "high",
    daysBeforeDoors: 10,
    isBlocking: true,
  },
  {
    title: "Confirm prize stock for sponsor slot — {sponsor}",
    description:
      "Verify prize or sample stock against the slot's run requirements.",
    category: "logistics",
    priority: "medium",
    daysBeforeDoors: 7,
    isBlocking: false,
  },
  {
    title: "Configure game + data capture for {sponsor}",
    description:
      "Load game configuration and lead-capture rules for the sponsored window.",
    category: "operations",
    priority: "high",
    daysBeforeDoors: 5,
    isBlocking: true,
  },
  {
    title: "Send sponsor go-live confirmation — {sponsor}",
    description:
      "Confirm the slot is live and share go-live details with the sponsor.",
    category: "operations",
    priority: "medium",
    daysBeforeDoors: 2,
    isBlocking: false,
  },
];

function sponsorLabel(sponsorName: string | null): string {
  return sponsorName ?? "sponsor";
}

function expandSponsor(text: string, sponsorName: string | null): string {
  return text.replace(/\{sponsor\}/g, sponsorLabel(sponsorName));
}

/** Due date as YYYY-MM-DD; never before today. */
function computeSlotTaskDueDate(
  startDate: string,
  daysBeforeDoors: number,
  today: Date = new Date(),
): string {
  const start = new Date(`${startDate}T00:00:00`);
  const due = new Date(start);
  due.setDate(due.getDate() - daysBeforeDoors);

  const floor = new Date(today);
  floor.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const chosen = due.getTime() < floor.getTime() ? floor : due;
  return chosen.toISOString().slice(0, 10);
}

/**
 * Spawns the sold-slot fulfilment checklist on the show event.
 * Idempotent: if tasks already exist for this slot, returns `{ spawned: 0 }`.
 */
export async function spawnSlotFulfilmentTasks(
  input: SlotFulfilmentInput,
): Promise<{ spawned: number }> {
  const supabase = getServiceRoleClient();
  const targetPath = `sponsor-slot/${input.slotId}`;

  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("event_id", input.eventId)
    .eq("target_path", targetPath);

  if (existing && existing.length > 0) {
    return { spawned: 0 };
  }

  const rows = SLOT_FULFILMENT_TEMPLATE.map((item, index) => ({
    event_id: input.eventId,
    title: expandSponsor(item.title, input.sponsorName),
    description: expandSponsor(item.description, input.sponsorName),
    task_type: "internal_action" as const,
    category: item.category,
    status: "pending" as const,
    priority: item.priority,
    target_path: targetPath,
    due_date: computeSlotTaskDueDate(input.startDate, item.daysBeforeDoors),
    is_blocking: item.isBlocking,
    customer_visible: false,
    sort_order: index,
  }));

  const { error } = await supabase.from("tasks").insert(rows);

  if (error) {
    console.error("[spawnSlotFulfilmentTasks] insert failed", error);
    return { spawned: 0 };
  }

  return { spawned: rows.length };
}
