/** Supabase read queries for API keys and webhook subscriptions. */

import { createClient } from "@/lib/supabase/server";
import { logQueryError } from "@/lib/observability/log-query-error";

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface WebhookSummary {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  failureCount: number;
}

/** All API keys for the admin API management page. */
export async function getApiKeys(): Promise<ApiKeySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, is_active, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getApiKeys", error);
    return [];
  }
  return data.map((k) => ({
    id: k.id as string,
    name: k.name as string,
    keyPrefix: k.key_prefix as string,
    isActive: k.is_active as boolean,
    lastUsedAt: (k.last_used_at as string) ?? undefined,
    createdAt: k.created_at as string,
  }));
}

/** All webhook subscriptions for the admin API management page. */
export async function getWebhookSubscriptions(): Promise<WebhookSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .select("id, url, events, is_active, failure_count")
    .order("created_at", { ascending: false });

  if (error || !data) {
    logQueryError("getWebhookSubscriptions", error);
    return [];
  }
  return data.map((w) => ({
    id: w.id as string,
    url: w.url as string,
    events: (w.events ?? []) as string[],
    isActive: w.is_active as boolean,
    failureCount: (w.failure_count ?? 0) as number,
  }));
}
