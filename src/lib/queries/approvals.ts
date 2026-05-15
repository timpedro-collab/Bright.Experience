import { createClient } from "@/lib/supabase/server";
import type { Approval } from "@/types";

export async function getApprovalsByEvent(
  eventId: string
): Promise<Approval[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("approvals")
    .select("*")
    .eq("event_id", eventId)
    .order("requested_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description ?? undefined,
    approvalType: row.approval_type,
    status: row.status,
    previewUrl: row.preview_url ?? undefined,
    requestedBy: row.requested_by ?? undefined,
    requestedAt: row.requested_at,
    decidedBy: row.decided_by ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    feedback: row.feedback ?? undefined,
    revisionCount: row.revision_count,
    customerVisible: row.customer_visible,
  }));
}
