/** Server actions for API key and webhook subscription management. */
"use server";

import { randomBytes } from "node:crypto";

import { requireInternalUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { isPublicApiEnabled } from "@/lib/integration-flags";
import { revalidatePath } from "next/cache";

/** Refusal shared by every action while the programme is switched off. */
const API_DISABLED =
  "The public API isn't switched on. Nothing authenticates with a key and no webhook is delivered yet, so issuing credentials would be misleading.";

/**
 * Mint an API key.
 *
 * `randomBytes` because this is a bearer credential: `Math.random()` is a
 * seeded PRNG whose output is predictable from a handful of observed values, so
 * one leaked key would expose the rest.
 *
 * Shape is `bb_` + four 8-character groups, which keeps `key_prefix` (the first
 * 11 characters) recognisable in the admin list while the key as a whole carries
 * roughly 180 bits of entropy.
 */
function generateApiKey(): string {
  // Crockford-style alphabet: no 0/O/1/I, so a key read aloud survives the trip.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const groups = 4;
  const groupLength = 8;
  const bytes = randomBytes(groups * groupLength);

  const body = Array.from({ length: groups }, (_, group) =>
    Array.from({ length: groupLength }, (_, i) =>
      // One byte per character, so the modulo skews slightly towards the first
      // 28 of the 57 characters. Immaterial against 180 bits.
      chars.charAt(bytes[group * groupLength + i]! % chars.length)
    ).join("")
  ).join("-");

  return `bb_${body}`;
}

/**
 * Mint a webhook signing secret.
 *
 * Stored in plain text (unlike an API key) because signature verification needs
 * the secret itself, so it is deliberately longer and not human-transcribable.
 */
function generateWebhookSecret(): string {
  return `whsec_${randomBytes(32).toString("hex")}`;
}

/** SHA-256 of a key — only the hash is stored, so a leaked table isn't a leaked key. */
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Create an API key — returns the raw key once (cannot be retrieved again). */
export async function createApiKey(data: {
  name: string;
  accountId?: string;
  partnerId?: string;
  permissions: string[];
}) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }
  if (!isPublicApiEnabled()) {
    return { success: false as const, error: API_DISABLED };
  }
  const rawKey = generateApiKey();
  const keyHash = await hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 11);

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .insert({
      name: data.name,
      account_id: data.accountId || null,
      partner_id: data.partnerId || null,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: data.permissions,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create API key" };

  revalidatePath("/admin/api");
  return { success: true as const, data: { id: apiKey.id, key: rawKey } };
}

/** Revoke an API key by marking it inactive. */
export async function revokeApiKey(id: string) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to revoke API key" };

  revalidatePath("/admin/api");
  return { success: true as const, data: { id } };
}

/** Create a webhook subscription for event lifecycle notifications. */
export async function createWebhookSubscription(data: {
  url: string;
  events: string[];
  accountId?: string;
  partnerId?: string;
}) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }
  if (!isPublicApiEnabled()) {
    return { success: false as const, error: API_DISABLED };
  }
  const secret = generateWebhookSecret();

  const { data: webhook, error } = await supabase
    .from("webhook_subscriptions")
    .insert({
      url: data.url,
      events: data.events,
      account_id: data.accountId || null,
      partner_id: data.partnerId || null,
      secret,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { success: false as const, error: "Failed to create webhook" };

  revalidatePath("/admin/api");
  return { success: true as const, data: { id: webhook.id, secret } };
}

/** Delete a webhook subscription. */
export async function deleteWebhookSubscription(id: string) {
  const { supabase, profile } = await requireInternalUser();
  if (!isAdminRole(profile.role)) {
    return { success: false as const, error: "Forbidden: admin access only" };
  }

  const { error } = await supabase
    .from("webhook_subscriptions")
    .delete()
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to delete webhook" };

  revalidatePath("/admin/api");
  return { success: true as const, data: { id } };
}
