import { createClient } from "@/lib/supabase/server";
import type { Milestone } from "@/types";

export async function getMilestonesByEvent(
  eventId: string
): Promise<Milestone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    stage: row.stage,
    status: row.status,
    targetDate: row.target_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    sortOrder: row.sort_order,
    customerVisible: row.customer_visible,
  }));
}
