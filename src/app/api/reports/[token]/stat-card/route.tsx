/**
 * GET /api/reports/:token/stat-card
 *
 * LinkedIn-safe stat card (1200×627 PNG) for a published report — the
 * headline number, the event name, and the Bright.Blue measurement mark.
 * Public by unguessable share token, exactly like the report page itself;
 * renders nothing that the shared report doesn't already show.
 *
 * Expected caller: the "LinkedIn stat card (PNG)" link on the report page.
 */

import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getEventReportByShareToken } from "@/lib/queries/event-reports";
import { normaliseMetrics } from "@/lib/reports/normalise";
import {
  eventNameFromReportTitle,
  pickHeadlineStat,
} from "@/lib/reports/reveal";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const report = await getEventReportByShareToken(token);
  if (!report || !report.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const stat = pickHeadlineStat(normaliseMetrics(report.metricsJson));
  if (!stat) {
    return NextResponse.json(
      { error: "No headline metric to share" },
      { status: 404 },
    );
  }

  const eventName = eventNameFromReportTitle(report.title) || "Event";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#070b26",
          backgroundImage:
            "linear-gradient(135deg, rgba(28,62,240,0.35) 0%, rgba(7,11,38,0) 55%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8fd8ff",
          }}
        >
          {eventName}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 176, fontWeight: 700, lineHeight: 1 }}>
            {stat.value}
          </div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 16, color: "#c7d2fe" }}>
            {stat.label}
            {stat.support ? ` · ${stat.support}` : ""}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#9aa3c7",
          }}
        >
          <div style={{ display: "flex" }}>Measured at a live activation</div>
          <div style={{ display: "flex", fontWeight: 700, color: "#ffffff" }}>
            bright.blue
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 627 },
  );
}
