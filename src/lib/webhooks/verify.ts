/**
 * HMAC-SHA256 signature verification for inbound webhooks.
 *
 * INTEGRATION: Bright.Blue Cloud
 *
 * The Bright.Blue Cloud platform signs every webhook payload with a shared
 * secret using HMAC-SHA256. The signature travels in the `x-bb-signature`
 * header as a hex digest.
 *
 * To wire this up:
 *   1. Set `BRIGHTBLUE_WEBHOOK_SECRET` in your environment.
 *   2. In Bright.Blue Cloud → Settings → Webhooks, paste the same secret.
 *   3. Point the webhook URL to `https://<your-domain>/api/webhooks/brightblue`.
 */

import { createHmac, timingSafeEqual } from "crypto";

const SIGNATURE_HEADER = "x-bb-signature";

export function getWebhookSecret(): string {
  const secret = process.env.BRIGHTBLUE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "BRIGHTBLUE_WEBHOOK_SECRET is not set — inbound webhooks are disabled."
    );
  }
  return secret;
}

/** Compute the HMAC-SHA256 hex digest of a raw body. */
export function computeSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/**
 * Verify the `x-bb-signature` header against the raw body.
 * Returns `true` if valid, `false` otherwise.
 */
export function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const expected = computeSignature(rawBody, secret);
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signatureHeader, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Parse and verify an incoming webhook request.
 *
 * Returns `{ ok: true, body, rawBody }` on success.
 * Returns `{ ok: false, status, message }` on any failure.
 */
export async function parseWebhookRequest(
  request: Request
): Promise<
  | { ok: true; body: Record<string, unknown>; rawBody: string }
  | { ok: false; status: number; message: string }
> {
  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch {
    return { ok: false, status: 503, message: "Webhook secret not configured" };
  }

  const rawBody = await request.text();
  const signature = request.headers.get(SIGNATURE_HEADER);

  if (!verifySignature(rawBody, signature, secret)) {
    return { ok: false, status: 401, message: "Invalid signature" };
  }

  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    return { ok: true, body, rawBody };
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON" };
  }
}
