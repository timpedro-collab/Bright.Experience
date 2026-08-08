/**
 * GET /api/reports/:token/wrapped-card
 *
 * LinkedIn-ready "Event Wrapped" card (1200×627 PNG) — the headline number,
 * the Bright Index placement when earned, and the event name. Public by
 * unguessable share token; shows nothing the shared report doesn't.
 *
 * Expected caller: the share actions on /report/[token]/wrapped.
 */

import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import {
  getEventReportByShareToken,
  getEventSummaryForReport,
} from "@/lib/queries/event-reports";
import { getPublicBenchmarks } from "@/lib/queries/public-benchmarks";
import { normaliseHighlights, normaliseMetrics } from "@/lib/reports/normalise";
import { buildWrappedStory } from "@/lib/reports/wrapped";

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

  const [event, benchmarks] = await Promise.all([
    getEventSummaryForReport(report.eventId),
    getPublicBenchmarks(),
  ]);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const story = buildWrappedStory({
    eventName: event.name,
    eventType: event.eventType,
    eventDateStart: event.eventDateStart,
    eventDateEnd: event.eventDateEnd,
    metrics: normaliseMetrics(report.metricsJson),
    personalNote: report.personalNote,
    personalNoteAuthor: report.personalNoteAuthor,
    highlights: normaliseHighlights(report.highlightsJson),
    credit: null,
    benchmarks,
  });
  if (!story) {
    return NextResponse.json(
      { error: "No headline metric to share" },
      { status: 404 },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          backgroundColor: "#070b26",
          backgroundImage:
            "linear-gradient(160deg, rgba(28,62,240,0.45) 0%, rgba(7,11,38,0) 60%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
            {`${story.eventName} — wrapped`}
          </div>
          {story.placement?.badge ? (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontWeight: 700,
                padding: "10px 22px",
                borderRadius: 999,
                border: "2px solid #8fd8ff",
                color: "#8fd8ff",
              }}
            >
              {story.placement.badge}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ display: "flex", fontSize: 168, fontWeight: 700, lineHeight: 1 }}
          >
            {story.headline.value}
          </div>
          <div
            style={{ display: "flex", fontSize: 42, marginTop: 14, color: "#c7d2fe" }}
          >
            {story.headline.label}
            {story.headline.support ? ` · ${story.headline.support}` : ""}
          </div>
          {story.placement && !story.placement.badge ? (
            <div
              style={{ display: "flex", fontSize: 28, marginTop: 18, color: "#9aa3c7" }}
            >
              {story.placement.label}
            </div>
          ) : null}
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
          <div style={{ display: "flex" }}>
            Measured live at the machine — not modelled
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: "#ffffff" }}>
            bright.blue
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 627 },
  );
}
