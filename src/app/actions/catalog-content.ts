/** Server actions for catalog packages & case studies. */
"use server";

import { requireInternalUser } from "@/lib/auth";
import { canViewCreativeProduct } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types/actions";

/**
 * Resolve the acting user and confirm they own the creative/product catalog
 * (creative_lead, events_lead, admin). Package and case-study
 * mutations are not a general internal-staff capability — Ops/QA must not
 * edit, publish, or delete catalog content.
 */
async function requireCatalogEditor() {
  const { supabase, profile } = await requireInternalUser();
  if (!canViewCreativeProduct(profile.role)) {
    return { ok: false as const, error: "Forbidden: creative access only" };
  }
  return { ok: true as const, supabase };
}

/** Insert a new package into the catalog. */
export async function createPackage(data: {
  name: string;
  slug: string;
  machineId?: string;
  tier: string;
  basePrice?: number;
  durationDays?: number;
  featuresJson?: Record<string, unknown>;
  isBookable?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: pkg, error } = await supabase
    .from("packages")
    .insert({
      name: data.name,
      slug: data.slug,
      machine_id: data.machineId ?? null,
      tier: data.tier,
      base_price: data.basePrice ?? null,
      duration_days: data.durationDays ?? null,
      features_json: data.featuresJson ?? null,
      is_bookable: data.isBookable ?? true,
    })
    .select("id")
    .single();

  if (error || !pkg) {
    return { success: false, error: "Could not create package. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: pkg.id as string } };
}

/** Update an existing package by ID. */
export async function updatePackage(
  id: string,
  data: Partial<{
    name: string;
    tier: string;
    machineId: string;
    basePrice: number;
    durationDays: number;
    featuresJson: Record<string, unknown>;
    isBookable: boolean;
  }>,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const updates: Record<string, unknown> = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.tier !== undefined) updates.tier = data.tier;
  if (data.machineId !== undefined) updates.machine_id = data.machineId;
  if (data.basePrice !== undefined) updates.base_price = data.basePrice;
  if (data.durationDays !== undefined) updates.duration_days = data.durationDays;
  if (data.featuresJson !== undefined) updates.features_json = data.featuresJson;
  if (data.isBookable !== undefined) updates.is_bookable = data.isBookable;

  const { data: pkg, error } = await supabase
    .from("packages")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !pkg) {
    return { success: false, error: "Could not update package. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: pkg.id as string } };
}

/** Delete a package from the catalog. */
export async function deletePackage(id: string): Promise<ActionResult> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete package. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: undefined };
}

/** Insert a new case study (created as unpublished by default). */
export async function createCaseStudy(data: {
  title: string;
  slug: string;
  clientName?: string;
  eventType?: string;
  location?: string;
  description?: string;
  heroImageUrl?: string;
}): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: study, error } = await supabase
    .from("case_studies")
    .insert({
      title: data.title,
      slug: data.slug,
      client_name: data.clientName ?? null,
      event_type: data.eventType ?? null,
      location: data.location ?? null,
      description: data.description ?? null,
      hero_image_url: data.heroImageUrl ?? null,
      is_published: false,
    })
    .select("id")
    .single();

  if (error || !study) {
    return { success: false, error: "Could not create case study. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: study.id as string } };
}

/** Update an existing case study by ID. */
export async function updateCaseStudy(
  id: string,
  data: Partial<{
    title: string;
    clientName: string;
    eventType: string;
    location: string;
    description: string;
    heroImageUrl: string;
  }>,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.clientName !== undefined) updates.client_name = data.clientName;
  if (data.eventType !== undefined) updates.event_type = data.eventType;
  if (data.location !== undefined) updates.location = data.location;
  if (data.description !== undefined) updates.description = data.description;
  if (data.heroImageUrl !== undefined) updates.hero_image_url = data.heroImageUrl;

  const { data: study, error } = await supabase
    .from("case_studies")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !study) {
    return { success: false, error: "Could not update case study. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: study.id as string } };
}

/** Publish a case study by setting is_published and published_at. */
export async function publishCaseStudy(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { data: study, error } = await supabase
    .from("case_studies")
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !study) {
    return { success: false, error: "Could not publish case study. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: { id: study.id as string } };
}

/** Delete a case study from the catalog. */
export async function deleteCaseStudy(id: string): Promise<ActionResult> {
  const auth = await requireCatalogEditor();
  if (!auth.ok) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) {
    return { success: false, error: "Could not delete case study. Please try again." };
  }

  revalidatePath("/catalog");
  return { success: true, data: undefined };
}
