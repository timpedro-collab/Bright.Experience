"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { enqueueApprovalDecision } from "@/lib/pipedrive/triggers";

export async function decideApproval(
  approvalId: string,
  eventId: string,
  decision: "approved" | "rejected",
  feedback?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updateData: Record<string, unknown> = {
    status: decision === "rejected" ? "revision_requested" : "approved",
    decided_by: user.id,
    decided_at: new Date().toISOString(),
  };

  if (feedback) updateData.feedback = feedback;
  if (decision === "rejected") {
    const { data: current } = await supabase
      .from("approvals")
      .select("revision_count")
      .eq("id", approvalId)
      .single();
    updateData.revision_count = (current?.revision_count ?? 0) + 1;
  }

  const { error } = await supabase
    .from("approvals")
    .update(updateData)
    .eq("id", approvalId);

  if (error) throw new Error(`Decision failed: ${error.message}`);

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: `approval_${decision}`,
    entity_type: "approval",
    entity_id: approvalId,
    metadata: { feedback },
  });

  const { data: eventRow } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  await dispatchNotification(
    decision === "approved"
      ? "approval.approved"
      : "approval.revision_requested",
    {
      eventId,
      approvalId,
      actorId: user.id,
      eventName: eventRow?.name ?? "your event",
      feedback: feedback ?? "",
      entityType: "approval",
      entityId: approvalId,
    }
  );

  // Pipedrive note + activity field update. Look up the approval title
  // so the note reads "Customer approved Logo v3", not just "approved".
  const { data: approvalRow } = await supabase
    .from("approvals")
    .select("title")
    .eq("id", approvalId)
    .single();
  await enqueueApprovalDecision(
    eventId,
    (approvalRow?.title as string) ?? "the proof",
    decision === "approved" ? "approved" : "revision_requested",
    feedback
  );

  revalidatePath(`/events/${eventId}/approvals`);
}
