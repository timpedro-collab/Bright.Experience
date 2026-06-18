"use server";

/**
 * Logistics provider — the carrier/company handling delivery and collection.
 *
 * Ops-owned (the customer can see who's delivering, but only internal staff
 * set it). Stored as one dedicated `logistics_entries` row (`carrier`) with the
 * fields packed as JSON in `description`, so no schema change is needed and it
 * stays out of the delivery/setup/collection groupings.
 */

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import type { ActionResult } from "@/types/actions";

export interface LogisticsProvider {
  company: string;
  contactName: string;
  phone: string;
  reference: string;
  notes: string;
}

const LOGISTICS_PROVIDER = "carrier";

function providerHasContent(p: LogisticsProvider): boolean {
  return Boolean(
    p.company.trim() ||
      p.contactName.trim() ||
      p.phone.trim() ||
      p.reference.trim() ||
      p.notes.trim()
  );
}

export async function getLogisticsProvider(
  eventId: string
): Promise<LogisticsProvider | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("logistics_entries")
    .select("description")
    .eq("event_id", eventId)
    .eq("entry_type", LOGISTICS_PROVIDER)
    .maybeSingle();
  const raw = data?.description as string | null | undefined;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LogisticsProvider>;
    return {
      company: parsed.company ?? "",
      contactName: parsed.contactName ?? "",
      phone: parsed.phone ?? "",
      reference: parsed.reference ?? "",
      notes: parsed.notes ?? "",
    };
  } catch {
    return null;
  }
}

export async function saveLogisticsProvider(
  eventId: string,
  data: LogisticsProvider
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  // The logistics provider is ops-owned — only internal staff may set it.
  if (!isInternalRole(user.role)) {
    return { success: false, error: "Only the Bright.Blue team can set the logistics provider." };
  }

  const clean: LogisticsProvider = {
    company: data.company.trim(),
    contactName: data.contactName.trim(),
    phone: data.phone.trim(),
    reference: data.reference.trim(),
    notes: data.notes.trim(),
  };

  // Internal staff can write logistics rows directly under RLS.
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("logistics_entries")
    .select("id")
    .eq("event_id", eventId)
    .eq("entry_type", LOGISTICS_PROVIDER)
    .maybeSingle();

  // Clearing every field removes the stored provider.
  if (!providerHasContent(clean)) {
    if (existing) {
      await supabase.from("logistics_entries").delete().eq("id", existing.id);
    }
    revalidatePath(`/events/${eventId}/logistics`);
    revalidatePath(`/events/${eventId}`);
    return { success: true, data: undefined };
  }

  const row = {
    event_id: eventId,
    entry_type: LOGISTICS_PROVIDER,
    title: "Logistics provider",
    description: JSON.stringify(clean),
    contact_name: clean.contactName || null,
    contact_phone: clean.phone || null,
    status: "confirmed",
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("logistics_entries")
      .update(row)
      .eq("id", existing.id);
    if (error) return { success: false, error: `Couldn't save: ${error.message}` };
  } else {
    const { error } = await supabase
      .from("logistics_entries")
      .insert({ ...row, created_by: user.id, sort_order: -1 });
    if (error) return { success: false, error: `Couldn't save: ${error.message}` };
  }

  await supabase.from("audit_entries").insert({
    event_id: eventId,
    actor_id: user.id,
    action: "logistics_provider_saved",
    entity_type: "logistics_entry",
    metadata: { company: clean.company },
  });

  revalidatePath(`/events/${eventId}/logistics`);
  revalidatePath(`/events/${eventId}`);
  return { success: true, data: undefined };
}
