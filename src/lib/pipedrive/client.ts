/**
 * Thin Pipedrive REST client.
 *
 * Wraps the few endpoints we actually use:
 *   - POST /v1/notes — append a note to a deal
 *   - PUT  /v1/deals/{id} — update a deal's custom fields
 *   - GET  /v1/persons/search — find a person by email (auto-link path)
 *   - GET  /v1/deals/{id} — fetch a single deal (used by setup test)
 *   - GET  /v1/users/me — credential check used by the setup page
 *
 * Auth: a single Personal API token sent via `?api_token=`. We pull the
 * token from `pipedrive_config.api_token` first and fall back to the
 * `PIPEDRIVE_API_TOKEN` env var to support local development. If neither
 * is set, every method becomes a noop that returns `{ ok: false, reason:
 * "not_configured" }` — the caller decides whether to surface this.
 *
 * Server-only. Never import from a client component.
 */

import { getServiceRoleClient } from "@/lib/supabase/service-role";

export interface PipedriveConfig {
  apiToken: string | null;
  baseUrl: string;
  fieldKeyLastActivityAt: string | null;
  fieldKeyHealthStatus: string | null;
  fieldKeyDeliveredEvents: string | null;
  healthOptionGreenId: number | null;
  healthOptionAmberId: number | null;
  healthOptionRedId: number | null;
  defaultPipelineId: number | null;
}

export type PipedriveResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; status?: number; reason: string };

/**
 * Load the singleton config row. Falls back to env-only mode when the
 * row hasn't been initialised yet. Returns `null` if neither the row
 * nor the env var is configured — caller can treat that as "Pipedrive
 * disabled, silently noop."
 */
export async function loadPipedriveConfig(): Promise<PipedriveConfig | null> {
  let row: Record<string, unknown> | null = null;
  try {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("pipedrive_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    row = (data as Record<string, unknown> | null) ?? null;
  } catch {
    // Service role unavailable (e.g. local dev with no key). Fall
    // through to env-only mode.
  }

  const apiToken =
    (row?.api_token as string | null | undefined) ??
    process.env.PIPEDRIVE_API_TOKEN ??
    null;
  const baseUrl =
    (row?.base_url as string | null | undefined) ??
    process.env.PIPEDRIVE_BASE_URL ??
    "https://api.pipedrive.com";

  if (!apiToken) return null;

  return {
    apiToken,
    baseUrl,
    fieldKeyLastActivityAt:
      (row?.field_key_last_activity_at as string | null) ?? null,
    fieldKeyHealthStatus:
      (row?.field_key_health_status as string | null) ?? null,
    fieldKeyDeliveredEvents:
      (row?.field_key_delivered_events as string | null) ?? null,
    healthOptionGreenId:
      (row?.health_option_green_id as number | null) ?? null,
    healthOptionAmberId:
      (row?.health_option_amber_id as number | null) ?? null,
    healthOptionRedId: (row?.health_option_red_id as number | null) ?? null,
    defaultPipelineId: (row?.default_pipeline_id as number | null) ?? null,
  };
}

async function request<T>(
  config: PipedriveConfig,
  path: string,
  init: RequestInit = {}
): Promise<PipedriveResult<T>> {
  const url = new URL(`${config.baseUrl}${path}`);
  url.searchParams.set("api_token", config.apiToken ?? "");
  try {
    const res = await fetch(url.toString(), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.status === 401) return { ok: false, status: 401, reason: "auth_failed" };
    if (res.status === 404) return { ok: false, status: 404, reason: "not_found" };
    if (res.status === 429) return { ok: false, status: 429, reason: "rate_limited" };
    if (!res.ok) {
      let body = "";
      try {
        body = (await res.text()).slice(0, 200);
      } catch {
        // ignore
      }
      return {
        ok: false,
        status: res.status,
        reason: `http_${res.status}${body ? `:${body}` : ""}`,
      };
    }
    const json = (await res.json()) as { success?: boolean; data?: T; error?: string };
    if (json.success === false) {
      return { ok: false, reason: json.error ?? "pipedrive_error" };
    }
    return { ok: true, data: (json.data as T) ?? ({} as T) };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "network_error";
    return { ok: false, reason };
  }
}

/** Append a plain-text note to the given deal. */
export async function addNoteToDeal(
  config: PipedriveConfig,
  dealId: string | number,
  content: string
): Promise<PipedriveResult<{ id: number }>> {
  return request<{ id: number }>(config, "/v1/notes", {
    method: "POST",
    body: JSON.stringify({ deal_id: Number(dealId), content }),
  });
}

/**
 * Patch one or more custom fields on a deal. `fields` is keyed by the
 * opaque Pipedrive field-key hash (loaded from `pipedrive_config`).
 */
export async function updateDealCustomFields(
  config: PipedriveConfig,
  dealId: string | number,
  fields: Record<string, unknown>
): Promise<PipedriveResult<{ id: number }>> {
  return request<{ id: number }>(config, `/v1/deals/${dealId}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

/** Look up a person by email. Used by the auto-link flow. */
export async function searchPersonByEmail(
  config: PipedriveConfig,
  email: string
): Promise<PipedriveResult<{ items: Array<{ item: { id: number } }> }>> {
  const query = encodeURIComponent(email);
  return request(
    config,
    `/v1/persons/search?term=${query}&fields=email&exact_match=true`
  );
}

/** Credential ping for the setup page. */
export async function getCurrentPipedriveUser(
  config: PipedriveConfig
): Promise<PipedriveResult<{ id: number; name: string; email: string }>> {
  return request(config, "/v1/users/me");
}

/**
 * Fetch a deal (used by the setup page for the test-connection round
 * trip and by auto-link to confirm a deal is open).
 */
export async function getDeal(
  config: PipedriveConfig,
  dealId: string | number
): Promise<PipedriveResult<{ id: number; status: string; person_id?: { value: number } | null }>> {
  return request(config, `/v1/deals/${dealId}`);
}
