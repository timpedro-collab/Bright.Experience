/** Server actions for API key and webhook subscription management. */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/** Generate a cryptographically random API key string. */
function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [8, 8, 8, 8];
  return (
    "bb_" +
    segments.map((len) =>
      Array.from({ length: len }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("")
    ).join("-")
  );
}

/** Simple hash function for API key storage (SHA-256 via Web Crypto). */
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
  const supabase = await createClient();
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
  const supabase = await createClient();

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
  const supabase = await createClient();
  const secret = generateApiKey();

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
  const supabase = await createClient();

  const { error } = await supabase
    .from("webhook_subscriptions")
    .delete()
    .eq("id", id);

  if (error) return { success: false as const, error: "Failed to delete webhook" };

  revalidatePath("/admin/api");
  return { success: true as const, data: { id } };
}
