/**
 * GET /api/quotes/:id/proposal-pdf
 *
 * Renders the customer-facing narrative proposal at /proposal/:id to a
 * print-optimised PDF (the same editorial document, captured under print
 * media so interactive controls drop away). Public, like the proposal page
 * itself — the link is unguessable (UUID) and only exposes what the page
 * already shows.
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

  // Parity with /proposal/:id itself: the document is built on the fly from
  // the quote row (buildProposalDocument), so the quote existing is the whole
  // requirement. (`proposal_content` is a jsonb column no code path writes —
  // gating on it made this route 404 for every real quote.)
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
      url: `${origin}/proposal/${id}`,
      cookies,
      waitForSelector: ".proposal-section",
    });

    const company = String(quote.company_name ?? quote.contact_name ?? "proposal")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    const filename = `${company || "proposal"}-bright-blue-proposal.pdf`;

    return new Response(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[proposal-pdf] generation failed:", err);
    return NextResponse.json(
      { error: "Export generation failed" },
      { status: 500 },
    );
  }
}
