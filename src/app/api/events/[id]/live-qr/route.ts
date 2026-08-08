/**
 * GET /api/events/:id/live-qr
 *
 * Generates a downloadable PNG QR code that points at the event's public
 * live-proof page (`/live/:token`) with on-machine UTM parameters so ops
 * can print or tape the code near the unit.
 *
 * Expected caller: authenticated ops users from LiveShareControls ("Download QR")
 * or the print sheet page (`/live-qr/:id`) embedding the image.
 * Auth: valid Supabase session cookie; RLS on `events` enforces event access.
 * Response: `image/png` with `Content-Disposition: attachment; filename=live-qr-{id}.png`,
 * or JSON `{ error }` with 401 / 403 / 404.
 */
import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bright-experience.vercel.app";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;

  const { data: eventRow } = await supabase
    .from("events")
    .select("id, live_share_token")
    .eq("id", eventId)
    .maybeSingle();

  if (!eventRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = eventRow.live_share_token as string | null;
  if (!token) {
    return NextResponse.json({ error: "No live share link" }, { status: 404 });
  }

  const liveUrl = `${SITE_URL}/live/${token}?utm_source=on_machine_qr&utm_medium=qr&utm_campaign=invitation`;

  const png = await QRCode.toBuffer(liveUrl, {
    type: "png",
    width: 600,
    margin: 2,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="live-qr-${eventId}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
