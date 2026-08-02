"use server";

/**
 * Server actions for invoice and payment tracking.
 * Internal-only — powers the finance dashboard.
 *
 * The portal treats invoices as DISPLAY-ONLY by design: real invoices are
 * raised and settled in the finance system, and this dashboard just mirrors
 * their status. `createInvoice` / `updateInvoiceStatus` are retained (and
 * tested) for the day billing moves in-portal, but no UI calls them — see
 * HANDOFF.md "deferred features".
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";
import { logQueryError } from "@/lib/observability/log-query-error";

/** Guard: resolve the current user and require a commercial role. */
async function requireInternal(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  if (!canViewCommercial(user.role)) {
    return { ok: false, error: "Only internal staff can manage invoices." };
  }
  return { ok: true, userId: user.id };
}

export type InvoiceStatus = "draft" | "issued" | "overdue" | "paid" | "disputed" | "written_off";
export type PaymentMethod = "invoice" | "po" | "deposit_plus_invoice";

export interface Invoice {
  id: string;
  eventId: string;
  accountId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  poNumber: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  status: InvoiceStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  eventName?: string;
  accountName?: string;
}

function mapInvoice(row: Record<string, unknown>): Invoice {
  const events = row.events as Record<string, unknown> | null;
  const accounts = row.accounts as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    accountId: row.account_id as string,
    invoiceNumber: row.invoice_number as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    paymentMethod: row.payment_method as PaymentMethod,
    poNumber: (row.po_number as string | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    dueAt: (row.due_at as string | null) ?? null,
    paidAt: (row.paid_at as string | null) ?? null,
    paymentReference: (row.payment_reference as string | null) ?? null,
    status: row.status as InvoiceStatus,
    notes: (row.notes as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    eventName: (events?.name as string) ?? undefined,
    accountName: (accounts?.name as string) ?? undefined,
  };
}

/** Fetch all outstanding invoices across all events (for the finance dashboard). */
export async function getOutstandingInvoices(): Promise<Invoice[]> {
  const guard = await requireInternal();
  if (!guard.ok) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, events(name), accounts(name)")
    .in("status", ["issued", "overdue"])
    .order("due_at", { ascending: true });
  if (error || !data) {
    logQueryError("getOutstandingInvoices", error);
    return [];
  }
  return data.map((row) => mapInvoice(row as Record<string, unknown>));
}

/** Create a new invoice. */
export async function createInvoice(
  eventId: string,
  accountId: string,
  data: {
    amount: number;
    currency?: string;
    paymentMethod?: PaymentMethod;
    poNumber?: string;
    dueAt?: string;
    notes?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  const guard = await requireInternal();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = await createClient();

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });
  const invoiceNumber = `BB-${String((count ?? 0) + 1).padStart(5, "0")}`;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      event_id: eventId,
      account_id: accountId,
      invoice_number: invoiceNumber,
      amount: data.amount,
      // All Bright.Blue commercial figures are GBP pence (see lib/currency.ts).
      currency: data.currency ?? "GBP",
      payment_method: data.paymentMethod ?? "invoice",
      po_number: data.poNumber ?? null,
      due_at: data.dueAt ?? null,
      notes: data.notes ?? null,
      status: "draft",
      created_by: guard.userId,
    })
    .select("id")
    .single();

  if (error) {
    logQueryError("createInvoice", error);
    return { success: false, error: `Failed to create invoice: ${error.message}` };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/admin/invoices");
  return { success: true, data: { id: invoice.id } };
}

/** Update invoice status (issue, mark paid, etc.). */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  extra?: { paymentReference?: string; notes?: string }
): Promise<ActionResult> {
  const guard = await requireInternal();
  if (!guard.ok) return { success: false, error: guard.error };
  const supabase = await createClient();

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = { status, updated_at: now };

  if (status === "issued") updateData.issued_at = now;
  if (status === "paid") {
    updateData.paid_at = now;
    if (extra?.paymentReference) updateData.payment_reference = extra.paymentReference;
  }
  if (extra?.notes) updateData.notes = extra.notes;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", invoiceId)
    .select("event_id")
    .single();

  if (error) {
    logQueryError("updateInvoiceStatus", error, { invoiceId });
    return { success: false, error: `Failed to update: ${error.message}` };
  }

  revalidatePath(`/events/${invoice.event_id}`);
  revalidatePath("/admin/invoices");
  return { success: true, data: undefined };
}

/** Auto-transition invoices from 'issued' to 'overdue' when past due. Called by cron. */
export async function transitionOverdueInvoices(): Promise<{ count: number }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("invoices")
    .update({ status: "overdue", updated_at: now })
    .eq("status", "issued")
    .lt("due_at", now)
    .select("id");

  if (error) {
    logQueryError("transitionOverdueInvoices", error);
    return { count: 0 };
  }
  return { count: data?.length ?? 0 };
}
