/**
 * GET /api/reports/:token/slide-pdf
 *
 * Renders the all-hands results slide at /report/:token/slide to a single
 * landscape PDF page via the shared Puppeteer pipeline. Public by
 * unguessable share token, like the report page itself.
 *
 * Expected caller: the "All-hands slide (PDF)" link on the report page.
 */

import { NextResponse } from "next/server";
import { generatePdf } from "@/lib/exports/pdf";
import { getEventReportByShareToken } from "@/lib/queries/event-reports";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  try {
    const pdfBuf = await generatePdf({
      url: `${origin}/report/${token}/slide`,
      landscape: true,
      waitForSelector: ".report-slide",
    });

    const name = String(report.title ?? "results")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    const filename = `${name || "results"}-slide.pdf`;

    return new Response(new Uint8Array(pdfBuf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[slide-pdf] generation failed:", err);
    return NextResponse.json(
      { error: "Export generation failed" },
      { status: 500 },
    );
  }
}
