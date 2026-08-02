/**
 * Bright.Blue Cloud API client — outbound REST calls.
 *
 * INTEGRATION: Bright.Blue Cloud
 *
 * This client fetches live and historical data from the Bright.Blue Cloud
 * platform. It's used for:
 *   - Pulling live machine telemetry snapshots (dashboard polling fallback)
 *   - Fetching post-show reports when the webhook hasn't fired yet
 *   - Validating machine serials during event setup
 *
 * Environment variables:
 *   BRIGHTBLUE_API_URL   — base URL (e.g. https://cloud.bright.blue/api/v1)
 *   BRIGHTBLUE_API_KEY   — bearer token for outbound requests
 *
 * CTO: To connect this to production, set the two env vars above and the
 * client will work out of the box. All methods gracefully return null when
 * credentials are missing so the app degrades to local DB data only.
 */

import type { EventConfigPayload } from "./config-payload";

export interface BrightBlueConfig {
  apiUrl: string;
  apiKey: string;
}

function getConfig(): BrightBlueConfig | null {
  const apiUrl = process.env.BRIGHTBLUE_API_URL;
  const apiKey = process.env.BRIGHTBLUE_API_KEY;
  if (!apiUrl || !apiKey) return null;
  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey };
}

async function apiFetch<T>(
  path: string,
  opts?: RequestInit
): Promise<T | null> {
  const config = getConfig();
  if (!config) return null;

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error(
      `[brightblue:api] ${path} returned ${res.status}: ${await res.text()}`
    );
    return null;
  }

  return res.json() as Promise<T>;
}

/* ──────────────── Telemetry / Live Data ──────────────── */

export interface LiveSnapshot {
  total_plays: number;
  total_leads: number;
  total_interactions: number;
  total_prizes: number;
  avg_dwell_time: number;
  machines: MachineStatus[];
  hourly: HourlyBucket[];
}

export interface MachineStatus {
  serial_number: string;
  status: "online" | "offline" | "error";
  last_heartbeat: string;
  firmware_version?: string;
}

export interface HourlyBucket {
  hour: number;
  plays: number;
  leads: number;
}

/**
 * Pull a live telemetry snapshot for a specific event.
 *
 * Falls back to `null` when the Cloud API is not configured —
 * the dashboard then uses local DB data from webhook ingestion.
 */
export async function getLiveSnapshot(
  eventId: string
): Promise<LiveSnapshot | null> {
  return apiFetch<LiveSnapshot>(`/events/${eventId}/live`);
}

/* ──────────────── Post-Show Reports ──────────────── */

export interface PostShowReport {
  event_id: string;
  total_plays: number;
  total_leads: number;
  total_interactions: number;
  total_prizes: number;
  avg_dwell_time: number;
  hourly_breakdown: HourlyBucket[];
  generated_at: string;
}

/** Fetch the final post-show report for an event. */
export async function getPostShowReport(
  eventId: string
): Promise<PostShowReport | null> {
  return apiFetch<PostShowReport>(`/events/${eventId}/report`);
}

/* ──────────────── Event Config Push ──────────────── */

/**
 * Push a submitted event configuration (game + capture-quality rules) to the
 * machine stack so activations are configured before the doors open.
 *
 * Fire-and-forget from the portal's perspective: a Cloud outage must never
 * block the customer's submit. Returns true when Cloud acknowledged the
 * config, false when unconfigured or rejected (both logged).
 */
export async function pushEventConfig(
  payload: EventConfigPayload
): Promise<boolean> {
  if (!getConfig()) {
    // INTEGRATION: Bright.Blue Cloud — not yet connected. The config stays in
    // the portal DB and can be re-pushed once credentials are set.
    console.warn(
      `[brightblue:api] config push skipped for ${payload.event_id} — BRIGHTBLUE_API_URL/KEY not configured`
    );
    return false;
  }
  const res = await apiFetch<{ received: boolean }>(
    `/events/${payload.event_id}/config`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
  return res != null;
}

/* ──────────────── Machine Validation ──────────────── */

export interface MachineInfo {
  serial_number: string;
  model: string;
  firmware_version: string;
  status: string;
}
