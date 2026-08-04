/** Server actions for venue and runway management. */
"use server";

import {
  requireVenueManager,
  requireVenueManagerForPlacement,
  requireVenueManagerForSlot,
} from "@/lib/auth/portal";
import {
  completeSlotSchema,
  confirmSlotSchema,
  createPlacementSchema,
  createSponsorshipSlotSchema,
  createVenuePackageSchema,
  deleteSlotSchema,
  holdSlotSchema,
  publishPlacementSchema,
  releaseSlotSchema,
  requestVenueSlotSchema,
  reserveSlotSchema,
  updatePlacementPricingSchema,
  updatePlacementSkuSchema,
  updatePlacementStatusSchema,
  updateSlotSchema,
} from "@/lib/validations/venues";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { firstRelated } from "@/lib/queries/embed";
import { applicationLimiter, getClientIp } from "@/lib/rate-limit";
import { holdExpiry } from "@/lib/slot-holds";
import { spawnSlotFulfilmentTasks } from "@/server/slot-fulfilment";
import { revalidatePath } from "next/cache";

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

  const parsed = createVenuePackageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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

/** Create a new placement at a venue. */
export async function createPlacement(data: {
  venueId: string;
  machineInstanceId?: string;
  startDate: string;
  endDate?: string;
}) {
  const parsed = createPlacementSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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
  const parsed = updatePlacementStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForPlacement(id);

  const { error } = await supabase
    .from("placements")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to update placement status" };

  revalidatePath("/venues");
  return { success: true as const, data: { id } };
}

/**
 * Update the SKU-register fields that make a placement a coded, sellable
 * unit: code, location label, footfall estimate, per-sponsor cap.
 */
export async function updatePlacementSku(data: {
  placementId: string;
  skuCode?: string;
  locationLabel?: string;
  footfallEstimate?: number;
  maxSlotsPerSponsor?: number;
}) {
  const parsed = updatePlacementSkuSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForPlacement(data.placementId);

  const { error } = await supabase
    .from("placements")
    .update({
      sku_code: parsed.data.skuCode?.trim().toUpperCase() || null,
      location_label: parsed.data.locationLabel?.trim() || null,
      footfall_estimate: parsed.data.footfallEstimate ?? null,
      max_slots_per_sponsor: parsed.data.maxSlotsPerSponsor ?? null,
    })
    .eq("id", data.placementId);

  if (error) {
    // The partial unique index turns a duplicated code into a constraint hit.
    return {
      success: false as const,
      error: "Failed to save — is that SKU code already used at this venue?",
    };
  }

  revalidatePath("/venues");
  return { success: true as const, data: { id: data.placementId } };
}

/**
 * The venue approval step: only a `live` placement appears on the public
 * advertise page and the embeddable widget.
 */
export async function publishPlacementSku(placementId: string, live: boolean) {
  const parsed = publishPlacementSchema.safeParse({ placementId, live });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForPlacement(placementId);

  const { error } = await supabase
    .from("placements")
    .update({ sku_status: live ? "live" : "draft" })
    .eq("id", placementId);

  if (error) return { success: false as const, error: "Failed to update publish state" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: placementId } };
}

/**
 * Set the placement's revenue model (typed union — see
 * lib/venues/revenue-model.ts). Overwrites `pricing_model_json` whole:
 * the models are alternatives, never layered.
 */
export async function updatePlacementPricing(data: {
  placementId: string;
  pricing:
    | { model: "revenue_share"; rate: number }
    | { model: "fixed_fee"; feePence: number }
    | { model: "guarantee_overage"; guaranteePence: number; overageRate: number };
}) {
  const parsed = updatePlacementPricingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForPlacement(data.placementId);

  const { error } = await supabase
    .from("placements")
    .update({ pricing_model_json: parsed.data.pricing })
    .eq("id", data.placementId);

  if (error) return { success: false as const, error: "Failed to save the revenue model" };

  revalidatePath("/venues");
  return { success: true as const, data: { id: data.placementId } };
}

/** Create a new sponsorship slot on a placement. `price` is whole dollars from the form; stored as integer cents. */
export async function createSponsorshipSlot(data: {
  placementId: string;
  startDate: string;
  endDate: string;
  price?: number;
}) {
  const parsed = createSponsorshipSlotSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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
  const parsed = reserveSlotSchema.safeParse({ slotId, sponsorAccountId, campaign });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select("placement_id, game_config_json, placements ( max_slots_per_sponsor )")
    .eq("id", slotId)
    .maybeSingle();
  const gameConfig: Record<string, unknown> = {
    ...((existing?.game_config_json as Record<string, unknown>) ?? {}),
  };
  if (campaign?.trim()) gameConfig.campaign = campaign.trim();

  // Per-sponsor cap from the SKU register: one sponsor can't monopolise a
  // position the venue deliberately capped.
  const placement = firstRelated(existing?.placements) as {
    max_slots_per_sponsor?: number | null;
  } | null;
  const cap = placement?.max_slots_per_sponsor;
  if (cap != null && cap > 0 && existing?.placement_id) {
    const { data: held } = await supabase
      .from("sponsorship_slots")
      .select("id")
      .eq("placement_id", existing.placement_id)
      .eq("sponsor_account_id", sponsorAccountId)
      .in("status", ["reserved", "active"]);
    if ((held?.length ?? 0) >= cap) {
      return {
        success: false as const,
        error: `This placement is capped at ${cap} slot${cap === 1 ? "" : "s"} per sponsor.`,
      };
    }
  }

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

/**
 * Place a countdown hold on a slot: available → reserved with an expiry.
 * An expired hold reads as available again (computed at read time), so
 * holds never need a cron to sweep them.
 */
export async function holdSlot(
  slotId: string,
  options?: { sponsorName?: string; days?: number },
) {
  const parsed = holdSlotSchema.safeParse({ slotId, ...options });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: updated, error } = await supabase
    .from("sponsorship_slots")
    .update({
      status: "reserved",
      hold_expires_at: holdExpiry(parsed.data.days),
      ...(parsed.data.sponsorName?.trim()
        ? { sponsor_name: parsed.data.sponsorName.trim() }
        : {}),
    })
    .eq("id", slotId)
    // Reserved is allowed too so an existing hold can be extended.
    .in("status", ["available", "reserved"])
    .select("id")
    .maybeSingle();

  if (error) return { success: false as const, error: "Failed to hold slot" };
  if (!updated) {
    return { success: false as const, error: "Only an open slot can be held" };
  }

  revalidatePath("/venues");
  revalidatePath("/organizers");
  return { success: true as const, data: { id: slotId } };
}

/** Confirm a held slot as a booked, paid campaign. reserved → active. */
export async function confirmSlot(slotId: string) {
  const parsed = confirmSlotSchema.safeParse({ slotId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { supabase } = await requireVenueManagerForSlot(slotId);

  const { data: confirmed, error } = await supabase
    .from("sponsorship_slots")
    .update({ status: "active", hold_expires_at: null })
    .eq("id", slotId)
    .eq("status", "reserved")
    .select("id, event_id, sponsor_name, start_date")
    .maybeSingle();

  if (error) return { success: false as const, error: "Failed to confirm booking" };
  if (!confirmed) {
    return { success: false as const, error: "Only a reserved slot can be confirmed" };
  }

  // A sold show slot spawns the standard fulfilment checklist on the show
  // event (artwork, wrap proof, prize stock, config, go-live). The helper is
  // idempotent and never throws — the sale must not be blocked by checklist
  // plumbing.
  if (confirmed.event_id) {
    await spawnSlotFulfilmentTasks({
      slotId,
      eventId: String(confirmed.event_id),
      sponsorName: (confirmed.sponsor_name as string | null) ?? null,
      startDate: String(confirmed.start_date),
    });
  }

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}

/** Mark a confirmed slot's run as finished. active → completed. */
export async function completeSlot(slotId: string) {
  const parsed = completeSlotSchema.safeParse({ slotId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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
  const parsed = releaseSlotSchema.safeParse({ slotId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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
      hold_expires_at: null,
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
  const parsed = updateSlotSchema.safeParse({ slotId, ...data });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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
  const parsed = deleteSlotSchema.safeParse({ slotId });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

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

  // Unauthenticated write that also takes a raw slot id, so throttle before
  // doing any work to blunt both spam and id enumeration.
  if (!(await applicationLimiter(await getClientIp()))) {
    return {
      success: false as const,
      error: "Too many requests from this connection. Please try again shortly.",
    };
  }

  const parsed = requestVenueSlotSchema.safeParse({ slotId, ...enquiry });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("sponsorship_slots")
    .select(
      `game_config_json, status, start_date, end_date,
       placements ( venues ( name, slug ) )`
    )
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

  // The hold is worthless if nobody is told about it: before this, an
  // advertiser enquiry sat in `game_config_json` waiting to be noticed.
  const placement = firstRelated(existing.placements);
  const venue = firstRelated(placement?.venues);
  try {
    await dispatchNotification("sponsor.slot_requested", {
      slotId,
      sponsorName: enquiry.company.trim(),
      contactName: enquiry.contactName?.trim() || enquiry.company.trim(),
      contactEmail: enquiry.email.trim(),
      venueName: (venue?.name as string) ?? "your venue",
      venueSlug: (venue?.slug as string) ?? "",
      slotDates: `${existing.start_date} → ${existing.end_date}`,
      entityType: "sponsorship_slot",
      entityId: slotId,
    });
  } catch (notifyError) {
    console.error("[requestVenueSlot] notification failed", notifyError);
  }

  revalidatePath("/venues");
  return { success: true as const, data: { id: slotId } };
}
