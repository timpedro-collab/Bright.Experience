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

/* ──────────────── Machine Validation ──────────────── */

export interface MachineInfo {
  serial_number: string;
  model: string;
  firmware_version: string;
  status: string;
}

/** Validate a machine serial against the Cloud registry. */
export async function validateMachineSerial(
  serial: string
): Promise<MachineInfo | null> {
  return apiFetch<MachineInfo>(`/machines/${encodeURIComponent(serial)}`);
}
