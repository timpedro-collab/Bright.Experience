/**
 * Journey touch tracking — the open pixel and click redirect embedded in
 * post-play follow-up emails.
 *
 * Expected caller: the lead's email client (no auth possible). The capability
 * is the unguessable (journey UUID, lead UUID) pair, same trust model as
 * report share tokens. The click redirect target is resolved server-side from
 * the journey row — the URL never carries a redirect destination, so this
 * cannot be used as an open redirector.
 *
 * GET /api/journeys/track?j=<journeyId>&l=<leadId>&t=opened|clicked
 *   t=opened  → records the touch, returns a 1×1 transparent GIF
 *   t=clicked → records the touch, 302s to the journey's cta_url
 */
import { NextResponse } from "next/server";
import { getJourneyCtaUrl, recordJourneyTouch } from "@/server/journeys";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 1×1 transparent GIF, the smallest legal one. */
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const journeyId = url.searchParams.get("j") ?? "";
  const leadId = url.searchParams.get("l") ?? "";
  const touch = url.searchParams.get("t") ?? "";

  const valid =
    UUID_RE.test(journeyId) &&
    UUID_RE.test(leadId) &&
    (touch === "opened" || touch === "clicked");

  if (touch === "clicked") {
    // Record first (idempotent), then send the player on their way. An
    // unknown journey still gets a graceful landing rather than a 404.
    if (valid) await recordJourneyTouch(journeyId, leadId, "clicked");
    const target = valid ? await getJourneyCtaUrl(journeyId) : null;
    return NextResponse.redirect(target ?? new URL("/", url.origin), 302);
  }

  if (valid) await recordJourneyTouch(journeyId, leadId, "opened");
  return new NextResponse(new Uint8Array(PIXEL), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
