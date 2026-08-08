/**
 * GET /api/quotes/:id/one-pager-pdf
 *
 * Renders the champion one-pager at /proposal/:id/one-pager to a single-page
 * A4 PDF via the shared Puppeteer pipeline. Public like the proposal page
 * itself — the link is unguessable (UUID) and the one-pager only exposes
 * what the proposal already shows (price stays hidden until revealed).
 *
 * Expected caller: the "Download the one-pager" link on /proposal/:id.
 */

import { NextResponse } from "next/server";
import { generatePdf } from "@/lib/exports/pdf";
import { getQuoteForProposal } from "@/lib/queries/quotes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const quote = await getQuoteForProposal(id);
  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  // Forward auth cookies so a logged-in AE preview renders identically.
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [name, ...rest] = c.split("=");
      return {
        name: name.trim(),
        value: rest.join("=").trim(),
        domain: new URL(origin).hostname,
      };
    });

  try {
    const pdfBuf = await generatePdf({
      url: `${origin}/proposal/${id}/one-pager`,
      cookies,
      waitForSelector: ".one-pager",
    });

    const company = String(quote.company_name ?? quote.contact_name ?? "proposal")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const filename = `${company || "proposal"}-bright-blue-one-pager.pdf`;

    return new Response(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[one-pager-pdf] generation failed:", err);
    return NextResponse.json(
      { error: "Export generation failed" },
      { status: 500 },
    );
  }
}
