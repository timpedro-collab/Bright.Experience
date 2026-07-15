"use server";

/**
 * Server actions for the compliance document vault.
 * Handles document upload, review, and requirement management.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { validateUpload, storagePathFor } from "@/lib/storage/signed-url";
import { scanUpload } from "@/lib/storage/scan";
import {
  createComplianceRequirementSchema,
  uploadComplianceDocumentSchema,
  reviewComplianceDocumentSchema,
  seedComplianceSchema,
} from "@/lib/validations/compliance";
import type { ActionResult } from "@/types/actions";
import {
  DOC_TYPE_LABELS,
  type ComplianceDocType,
  type ComplianceStatus,
  type ComplianceDocument,
} from "@/types/compliance";

function mapDoc(row: Record<string, unknown>): ComplianceDocument {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    documentType: row.document_type as ComplianceDocType,
    title: row.title as string,
    fileUrl: (row.file_url as string | null) ?? null,
    requiredMinimum: (row.required_minimum as string | null) ?? null,
    currentValue: (row.current_value as string | null) ?? null,
    meetsRequirement: Boolean(row.meets_requirement),
    expiresAt: (row.expires_at as string | null) ?? null,
    status: row.status as ComplianceStatus,
    reviewedBy: (row.reviewed_by as string | null) ?? null,
    reviewedAt: (row.reviewed_at as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    uploadedBy: (row.uploaded_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** Fetch all compliance documents for an event. */
export async function getComplianceDocuments(eventId: string): Promise<ComplianceDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compliance_documents")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at");

  if (error || !data) return [];
  return data.map((row) => mapDoc(row as Record<string, unknown>));
}

/** Create a compliance document requirement for an event. */
export async function createComplianceRequirement(
  eventId: string,
  documentType: ComplianceDocType,
  title: string,
  requiredMinimum?: string,
  expiresAt?: string
): Promise<ActionResult<{ id: string }>> {
  const parsed = createComplianceRequirementSchema.safeParse({
    eventId,
    documentType,
    title,
    requiredMinimum,
    expiresAt,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("compliance_documents")
    .insert({
      event_id: eventId,
      document_type: documentType,
      title,
      required_minimum: requiredMinimum ?? null,
      expires_at: expiresAt ?? null,
      status: "required",
    })
    .select("id")
    .single();

  if (error) return { success: false, error: `Failed to create requirement: ${error.message}` };
  revalidatePath(`/events/${eventId}/compliance`);
  return { success: true, data: { id: data.id } };
}

/** Upload a compliance document file. */
export async function uploadComplianceDocument(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const docId = formData.get("docId") as string;
  const eventId = formData.get("eventId") as string;
  const file = formData.get("file") as File;
  const currentValue = formData.get("currentValue") as string | null;

  if (!docId || !eventId || !file) {
    return { success: false, error: "Missing required fields" };
  }

  const parsed = uploadComplianceDocumentSchema.safeParse({ docId, eventId, currentValue });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const check = validateUpload("event-assets", { type: file.type, size: file.size, name: file.name });
  if (!check.ok) return { success: false, error: check.detail };

  const path = storagePathFor({
    eventId,
    entityType: "compliance",
    entityId: docId,
    filename: file.name,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const scan = await scanUpload(buffer, file.name);
  if (!scan.ok) {
    return { success: false, error: scan.detail ?? "This file was flagged by our security scan." };
  }

  const { error: uploadError } = await supabase.storage
    .from("event-assets")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { success: false, error: `Upload failed: ${uploadError.message}` };

  const updateData: Record<string, unknown> = {
    file_url: path,
    status: "uploaded",
    uploaded_by: user.id,
    updated_at: new Date().toISOString(),
  };
  if (currentValue) updateData.current_value = currentValue;

  const { error } = await supabase
    .from("compliance_documents")
    .update(updateData)
    .eq("id", docId);

  if (error) return { success: false, error: `Failed to update document: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "compliance_document_uploaded",
    entity_type: "compliance_document",
    entity_id: docId,
  });

  const { data: doc } = await supabase
    .from("compliance_documents")
    .select("title")
    .eq("id", docId)
    .single();

  dispatchNotification("compliance.document_uploaded", {
    eventId,
    documentTitle: (doc?.title as string) ?? "Compliance document",
    entityType: "compliance_document",
    entityId: docId,
  }).catch(() => {});

  revalidatePath(`/events/${eventId}/compliance`);
  return { success: true, data: { id: docId } };
}

/** Review a compliance document (approve/reject). */
export async function reviewComplianceDocument(
  docId: string,
  eventId: string,
  decision: "approved" | "rejected",
  notes?: string
): Promise<ActionResult> {
  const parsed = reviewComplianceDocumentSchema.safeParse({ docId, eventId, decision, notes });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const reviewer = await getUser();
  if (!reviewer) return { success: false, error: "Not authenticated" };
  if (!isInternalRole(reviewer.role)) {
    return { success: false, error: "Only internal staff can review compliance documents." };
  }
  const supabase = await createClient();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("compliance_documents")
    .update({
      status: decision,
      meets_requirement: decision === "approved",
      reviewed_by: reviewer.id,
      reviewed_at: now,
      notes: notes ?? null,
      updated_at: now,
    })
    .eq("id", docId);

  if (error) return { success: false, error: `Review failed: ${error.message}` };

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: reviewer.id,
    action: `compliance_document_${decision}`,
    entity_type: "compliance_document",
    entity_id: docId,
    metadata: { notes },
  });

  if (decision === "rejected") {
    const { data: doc } = await supabase
      .from("compliance_documents")
      .select("title")
      .eq("id", docId)
      .single();

    dispatchNotification("compliance.requirement_unmet", {
      eventId,
      documentTitle: (doc?.title as string) ?? "Compliance document",
      entityType: "compliance_document",
      entityId: docId,
    }).catch(() => {});
  }

  revalidatePath(`/events/${eventId}/compliance`);
  return { success: true, data: undefined };
}

/** Check if all mandatory compliance docs are satisfied for stage gating. */
export async function checkComplianceForStageGate(
  eventId: string
): Promise<{ passed: boolean; missing: string[] }> {
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("account_id")
    .eq("id", eventId)
    .single();

  if (!event?.account_id) return { passed: true, missing: [] };

  const { data: requirements } = await supabase
    .from("client_compliance_requirements")
    .select("document_type, is_mandatory")
    .eq("account_id", event.account_id)
    .eq("is_mandatory", true);

  if (!requirements || requirements.length === 0) return { passed: true, missing: [] };

  const { data: docs } = await supabase
    .from("compliance_documents")
    .select("document_type, status, expires_at")
    .eq("event_id", eventId);

  const docMap = new Map<string, { status: string; expiresAt: string | null }>();
  for (const d of docs ?? []) {
    docMap.set(d.document_type, { status: d.status, expiresAt: d.expires_at });
  }

  const missing: string[] = [];
  const now = new Date();

  for (const req of requirements) {
    const doc = docMap.get(req.document_type);
    if (!doc || doc.status !== "approved") {
      missing.push(DOC_TYPE_LABELS[req.document_type as ComplianceDocType] ?? req.document_type);
      continue;
    }
    if (doc.expiresAt && new Date(doc.expiresAt) < now) {
      missing.push(`${DOC_TYPE_LABELS[req.document_type as ComplianceDocType] ?? req.document_type} (expired)`);
    }
  }

  return { passed: missing.length === 0, missing };
}

/** Seed compliance document requirements from account profile when creating an event. */
export async function seedComplianceFromAccount(
  eventId: string,
  accountId: string
): Promise<void> {
  // Void-returning action: surface invalid input by throwing so the caller's
  // try/catch (provisioning) logs it rather than silently no-opping.
  const parsed = seedComplianceSchema.safeParse({ eventId, accountId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const supabase = await createClient();
  const { data: requirements } = await supabase
    .from("client_compliance_requirements")
    .select("*")
    .eq("account_id", accountId);

  if (!requirements || requirements.length === 0) return;

  const rows = requirements.map((req) => ({
    event_id: eventId,
    document_type: req.document_type,
    title: DOC_TYPE_LABELS[req.document_type as ComplianceDocType] ?? req.document_type,
    required_minimum: req.minimum_value,
    status: "required",
  }));

  await supabase.from("compliance_documents").insert(rows);
}
