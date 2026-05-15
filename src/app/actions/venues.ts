/** Server actions for venue and runway management. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Create a new venue record. */
export async function createVenue(data: {
  name: string;
  partnerId?: string;
  address?: string;
  postcode?: string;
  venueType?: string;
  capacity?: number;
}) {
  const supabase = await createClient();

  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      name: data.name,
      slug,
      partner_id: data.partnerId ?? null,
      address: data.address ?? null,
      postcode: data.postcode ?? null,
      venue_type: data.venueType ?? null,
      capacity: data.capacity ?? null,
    })
    .select("id, slug")
    .single();

  if (error) return { success: false as const, error: "Failed to create venue" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: venue.id, slug: venue.slug } };
}

/** Update an existing venue. */
export async function updateVenue(
  id: string,
  data: {
    name?: string;
    address?: string;
    postcode?: string;
    venueType?: string;
    capacity?: number;
    isActive?: boolean;
    contactInfoJson?: Record<string, unknown>;
  }
) {
  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.address !== undefined) updates.address = data.address;
  if (data.postcode !== undefined) updates.postcode = data.postcode;
  if (data.venueType !== undefined) updates.venue_type = data.venueType;
  if (data.capacity !== undefined) updates.capacity = data.capacity;
  if (data.isActive !== undefined) updates.is_active = data.isActive;
  if (data.contactInfoJson !== undefined) updates.contact_info_json = data.contactInfoJson;

  const { error } = await supabase
    .from("venues")
    .update(updates)
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to update venue" };

  revalidatePath("/venues");
  return { success: true as const, data: { id } };
}

/** Create a new placement at a venue. */
export async function createPlacement(data: {
  venueId: string;
  machineInstanceId?: string;
  startDate: string;
  endDate?: string;
}) {
  const supabase = await createClient();

  const { data: placement, error } = await supabase
    .from("placements")
    .insert({
      venue_id: data.venueId,
      machine_instance_id: data.machineInstanceId ?? null,
      start_date: data.startDate,
      end_date: data.endDate ?? null,
      status: "planned",
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create placement" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: placement.id } };
}

/** Update the status of an existing placement. */
export async function updatePlacementStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("placements")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to update placement status" };

  revalidatePath("/venues");
  return { success: true as const, data: { id } };
}

/** Create a new sponsorship slot on a placement. */
export async function createSponsorshipSlot(data: {
  placementId: string;
  startDate: string;
  endDate: string;
  price?: number;
}) {
  const supabase = await createClient();

  const { data: slot, error } = await supabase
    .from("sponsorship_slots")
    .insert({
      placement_id: data.placementId,
      start_date: data.startDate,
      end_date: data.endDate,
      price: data.price ?? null,
      status: "available",
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create sponsorship slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slot.id } };
}

/** Reserve a sponsorship slot for a sponsor account. */
export async function reserveSlot(slotId: string, sponsorAccountId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({
      sponsor_account_id: sponsorAccountId,
      status: "reserved",
    })
    .eq("id", slotId)
    .eq("status", "available");

  if (error) return { success: false as const, error: "Failed to reserve slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}
