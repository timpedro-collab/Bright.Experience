/** Server actions for venue and runway management. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import {
  requireVenueManager,
  requireVenueManagerForPlacement,
  requireVenueManagerForSlot,
} from "@/lib/auth/portal";
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
  const { supabase } = await requireInternalUser();

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

/** Create a new venue event package. `price` is whole dollars from the form; stored as integer cents. */
export async function createVenuePackage(data: {
  venueId: string;
  name: string;
  description?: string;
  price?: number;
  includesBrightBlue?: boolean;
}) {
  if (!data.name.trim()) {
    return { success: false as const, error: "Package name is required" };
  }

  const { supabase } = await requireVenueManager(data.venueId);

  const { data: pkg, error } = await supabase
    .from("venue_packages")
    .insert({
      venue_id: data.venueId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price != null ? Math.round(data.price * 100) : null,
      includes_bright_blue: data.includesBrightBlue ?? false,
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create package" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: pkg.id } };
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
  const { supabase } = await requireVenueManager(id);

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
  const { supabase } = await requireVenueManager(data.venueId);

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
  const { supabase } = await requireVenueManagerForPlacement(id);

  const { error } = await supabase
    .from("placements")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to update placement status" };

  revalidatePath("/venues");
  return { success: true as const, data: { id } };
}

/** Create a new sponsorship slot on a placement. `price` is whole dollars from the form; stored as integer cents. */
export async function createSponsorshipSlot(data: {
  placementId: string;
  startDate: string;
  endDate: string;
  price?: number;
}) {
  const { supabase } = await requireVenueManagerForPlacement(data.placementId);

  const { data: slot, error } = await supabase
    .from("sponsorship_slots")
    .insert({
      placement_id: data.placementId,
      start_date: data.startDate,
      end_date: data.endDate,
      price: data.price != null ? Math.round(data.price * 100) : null,
      status: "available",
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create sponsorship slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slot.id } };
}

/**
 * Reserve a sponsorship slot for a sponsor account, optionally tagging the
 * campaign that will run in it. available → reserved (a soft hold).
 */
export async function reserveSlot(
  slotId: string,
  sponsorAccountId: string,
  campaign?: string,
) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("game_config_json")
    .eq("id", slotId)
    .maybeSingle();
  const gameConfig: Record<string, unknown> = {
    ...((existing?.game_config_json as Record<string, unknown>) ?? {}),
  };
  if (campaign?.trim()) gameConfig.campaign = campaign.trim();

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({
      sponsor_account_id: sponsorAccountId,
      status: "reserved",
      game_config_json: gameConfig,
    })
    .eq("id", slotId)
    .eq("status", "available");

  if (error) return { success: false as const, error: "Failed to reserve slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Confirm a held slot as a booked, paid campaign. reserved → active. */
export async function confirmSlot(slotId: string) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ status: "active" })
    .eq("id", slotId)
    .eq("status", "reserved");

  if (error) return { success: false as const, error: "Failed to confirm booking" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Mark a confirmed slot's run as finished. active → completed. */
export async function completeSlot(slotId: string) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ status: "completed" })
    .eq("id", slotId)
    .eq("status", "active");

  if (error) return { success: false as const, error: "Failed to complete slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Release a held or booked slot back to open inventory, clearing the sponsor. */
export async function releaseSlot(slotId: string) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("game_config_json")
    .eq("id", slotId)
    .maybeSingle();
  const gameConfig: Record<string, unknown> = {
    ...((existing?.game_config_json as Record<string, unknown>) ?? {}),
  };
  delete gameConfig.campaign;
  delete gameConfig.enquiry;
  delete gameConfig.source;

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({
      sponsor_account_id: null,
      status: "available",
      game_config_json: gameConfig,
    })
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to release slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Edit a slot's price and/or dates. `price` is whole dollars → integer cents. */
export async function updateSlot(
  slotId: string,
  data: { price?: number; startDate?: string; endDate?: string },
) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const updates: Record<string, unknown> = {};
  if (data.price !== undefined)
    updates.price = data.price != null ? Math.round(data.price * 100) : null;
  if (data.startDate !== undefined) updates.start_date = data.startDate;
  if (data.endDate !== undefined) updates.end_date = data.endDate;
  if (Object.keys(updates).length === 0)
    return { success: true as const, data: { id: slotId } };

  const { error } = await supabase
    .from("sponsorship_slots")
    .update(updates)
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to update slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Delete a sponsorship slot. */
export async function deleteSlot(slotId: string) {
  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { error } = await supabase
    .from("sponsorship_slots")
    .delete()
    .eq("id", slotId);

  if (error) return { success: false as const, error: "Failed to delete slot" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/**
 * Public advertiser enquiry: an advertiser requests an open ad slot from the
 * venue's public "Advertise" page. Places a soft hold (available → reserved)
 * tagged with the requester's details so the venue operator sees it land in
 * their sponsorship board and can confirm or release it.
 *
 * Intentionally unauthenticated — this is the inbound demand side of the
 * marketplace. Only ever moves a slot from available → reserved.
 */
export async function requestVenueSlot(
  slotId: string,
  enquiry: { company: string; contactName: string; email: string; message?: string },
) {
  if (!enquiry.company?.trim() || !enquiry.email?.trim()) {
    return { success: false as const, error: "Company and email are required" };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("game_config_json, status")
    .eq("id", slotId)
    .maybeSingle();

  if (!existing) return { success: false as const, error: "Slot not found" };
  if (existing.status !== "available") {
    return { success: false as const, error: "That slot has just been taken — please pick another." };
  }

  const gameConfig: Record<string, unknown> = {
    ...((existing.game_config_json as Record<string, unknown>) ?? {}),
    campaign: enquiry.company.trim(),
    source: "advertiser_request",
    enquiry: {
      company: enquiry.company.trim(),
      contactName: enquiry.contactName?.trim() || null,
      email: enquiry.email.trim(),
      message: enquiry.message?.trim() || null,
      requestedAt: new Date().toISOString(),
    },
  };

  const { error } = await supabase
    .from("sponsorship_slots")
    .update({ status: "reserved", game_config_json: gameConfig })
    .eq("id", slotId)
    .eq("status", "available");

  if (error) return { success: false as const, error: "Couldn't send your request. Please try again." };

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}
