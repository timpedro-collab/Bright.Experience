"use server";

/**
 * Server actions for customer approval decisions.
 *
 * Approvals are the customer sign-off gate — proofs, creative mockups,
 * and final wraps all pass through here. Decisions trigger Pipedrive
 * write-back and in-app notifications.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { writeAudit } from "@/lib/audit";
import { enqueueApprovalDecision } from "@/lib/pipedrive/triggers";
import { isInternalRole, canRecordApprovalOnBehalf } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";
import type { UserRole } from "@/types";

/**
 * Record an approve/reject decision on a proof.
 *
 * Sign-off is the CUSTOMER's call. Internal staff may only record a
 * decision on the customer's behalf via an explicit, clearly-labelled
 * control — `onBehalf` must be set, and we stamp the audit trail so it's
 * never silent.
 */
export async function decideApproval(
  approvalId: string,
  eventId: string,
  decision: "approved" | "rejected",
  feedback?: string,
  onBehalf = false
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const actorRole = profile?.role as UserRole | undefined;
  const actingInternal = actorRole ? isInternalRole(actorRole) : false;
  if (actingInternal && !onBehalf) {
    return {
      success: false,
      error:
        "Sign-off is the customer's decision. Use “Record customer decision” to log it on their behalf.",
    };
  }
  // Even on the customer's behalf, only customer-facing roles (Events Lead,
  // Creative, admin) may record a sign-off. Ops/QA never touch approvals.
  if (actingInternal && onBehalf && (!actorRole || !canRecordApprovalOnBehalf(actorRole))) {
    return {
      success: false,
      error: "Your role can't record customer sign-off.",
    };
  }

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

  if (error) return { success: false, error: `Decision failed: ${error.message}` };

  await writeAudit({
    eventId,
    actorId: user.id,
    action: `approval_${decision}`,
    entityType: "approval",
    entityId: approvalId,
    metadata: {
      feedback,
      onBehalfOfCustomer: actingInternal && onBehalf ? true : undefined,
      actorRole,
    },
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
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/admin/customer-queue");
  revalidatePath("/");
  return { success: true, data: undefined };
}
