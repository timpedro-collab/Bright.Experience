/**
 * Bright.Blue Cloud webhook simulator.
 *
 * INTEGRATION: Bright.Blue Cloud
 *
 * HMAC-signs and POSTs realistic sample payloads for all four inbound
 * webhook event types to any portal URL — executable documentation of the
 * contract in `src/app/api/webhooks/brightblue/route.ts`. Lets a dev team
 * prove the ingest pipe end-to-end before a real machine exists.
 *
 * Usage:
 *   npx tsx scripts/simulate-cloud-webhook.ts [event-type|all] [options]
 *
 *   event-type   telemetry.batch | lead.captured | machine.heartbeat |
 *                report.ready | all              (default: all)
 *
 * Options:
 *   --url <url>        Webhook endpoint (default: http://localhost:3000/api/webhooks/brightblue)
 *   --serial <serial>  Machine serial to reference (default: BVP-1024, from seed.sql)
 *   --event-id <uuid>  Portal event UUID (default: e1111111-… the seeded "Acme" event)
 *   --secret <secret>  HMAC secret (default: BRIGHTBLUE_WEBHOOK_SECRET from env/.env.local)
 *
 * Examples:
 *   npx tsx scripts/simulate-cloud-webhook.ts                       # fire all 4 at local dev
 *   npx tsx scripts/simulate-cloud-webhook.ts machine.heartbeat --serial BP-2110
 *   npx tsx scripts/simulate-cloud-webhook.ts all --url https://portal.example.com/api/webhooks/brightblue --secret prod-secret
 */

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

// ── env: mirror run-seed.ts so the local secret comes from .env.local ──
function loadEnvLocal() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    /* .env.local is optional */
  }
}
loadEnvLocal();

// ── CLI parsing (tiny by design — no dependency) ──
const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

const EVENT_TYPES = [
  "telemetry.batch",
  "lead.captured",
  "machine.heartbeat",
  "report.ready",
] as const;
type CloudEventType = (typeof EVENT_TYPES)[number];

const requested = positional[0] ?? "all";
if (requested !== "all" && !EVENT_TYPES.includes(requested as CloudEventType)) {
  console.error(
    `Unknown event type "${requested}". Use one of: ${EVENT_TYPES.join(", ")}, all`
  );
  process.exit(1);
}

const url = flag("url") ?? "http://localhost:3000/api/webhooks/brightblue";
const serial = flag("serial") ?? "BVP-1024"; // seeded machine (supabase/seed.sql)
const eventId = flag("event-id") ?? "e1111111-1111-1111-1111-111111111111"; // seeded event
const secret = flag("secret") ?? process.env.BRIGHTBLUE_WEBHOOK_SECRET;

if (!secret) {
  console.error(
    "No HMAC secret. Pass --secret or set BRIGHTBLUE_WEBHOOK_SECRET in .env.local " +
      "(the portal endpoint returns 503 until the same secret is configured there)."
  );
  process.exit(1);
}

// ── Sample payloads — the canonical shapes the route handlers expect ──
const now = new Date();
const iso = (offsetSec = 0) =>
  new Date(now.getTime() - offsetSec * 1000).toISOString();

function buildPayload(type: CloudEventType): Record<string, unknown> {
  switch (type) {
    case "telemetry.batch":
      return {
        event_type: "telemetry.batch",
        machine_serial: serial,
        event_id: eventId,
        events: [
          { type: "play_started", timestamp: iso(95), payload: {} },
          {
            type: "play_completed",
            timestamp: iso(50),
            payload: { score: 4200, duration_sec: 45 },
          },
          { type: "prize_awarded", timestamp: iso(48), payload: { prize: "tote-bag" } },
          { type: "screen_touch", timestamp: iso(20), payload: { x: 512, y: 384 } },
        ],
      };
    case "lead.captured":
      return {
        event_type: "lead.captured",
        event_id: eventId,
        machine_serial: serial,
        contact: {
          name: "Jane Simulated",
          email: `jane.sim+${Date.now()}@example.com`,
          phone: "+44 7700 900123",
          custom_fields: {
            company: "Simulated Ltd",
            marketing_opt_in: true,
            age_band: "25-34",
          },
        },
      };
    case "machine.heartbeat":
      return {
        event_type: "machine.heartbeat",
        machine_serial: serial,
        firmware_version: "2.4.1",
        status: "deployed",
      };
    case "report.ready":
      return {
        event_type: "report.ready",
        event_id: eventId,
        report: {
          total_plays: 2401,
          total_leads: 312,
          total_interactions: 5100,
          total_prizes: 180,
          avg_dwell_time: 47.2,
          hourly_breakdown: [
            { hour: 9, plays: 180, leads: 21 },
            { hour: 10, plays: 240, leads: 33 },
            { hour: 11, plays: 310, leads: 41 },
            { hour: 12, plays: 402, leads: 55 },
            { hour: 13, plays: 388, leads: 47 },
            { hour: 14, plays: 371, leads: 44 },
            { hour: 15, plays: 290, leads: 38 },
            { hour: 16, plays: 220, leads: 33 },
          ],
          generated_at: iso(),
        },
      };
  }
}

/** POST one signed payload; returns true when the portal accepted it. */
async function send(type: CloudEventType): Promise<boolean> {
  const rawBody = JSON.stringify(buildPayload(type));
  const signature = createHmac("sha256", secret!).update(rawBody).digest("hex");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-bb-signature": signature,
      },
      body: rawBody,
    });
  } catch (err) {
    console.error(`✗ ${type} — request failed: ${(err as Error).message}`);
    return false;
  }

  const text = await response.text();
  const ok = response.ok;
  console.log(`${ok ? "✓" : "✗"} ${type} — HTTP ${response.status} ${text}`);
  return ok;
}

async function main() {
  const types: CloudEventType[] =
    requested === "all" ? [...EVENT_TYPES] : [requested as CloudEventType];

  console.log(`Simulating Bright.Blue Cloud webhooks → ${url}`);
  console.log(`  serial=${serial}  event_id=${eventId}\n`);

  const results = await Promise.all(types.map((t) => send(t)));
  process.exit(results.every(Boolean) ? 0 : 1);
}

void main();
