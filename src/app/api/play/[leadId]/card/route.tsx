/**
 * GET /api/play/:leadId/card
 *
 * Personal result share card (1080×1080 PNG) — the player's score and
 * standing, the event name, and a subtle Bright mark. Public by the lead's
 * unguessable UUID, exactly like the /play page it belongs to.
 *
 * Expected caller: the "Download the card" action on /play/[leadId].
 */

import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { getPlayerResult } from "@/lib/queries/player-result";
import { playerFirstName, standingFromScores } from "@/lib/player-result";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await params;
  const result = await getPlayerResult(leadId);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const firstName = playerFirstName(result.firstNameSource);
  const standing = standingFromScores(result.score, result.dayScores);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "88px 72px",
          backgroundColor: "#070b26",
          backgroundImage:
            "linear-gradient(160deg, rgba(28,62,240,0.5) 0%, rgba(7,11,38,0) 60%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8fd8ff",
          }}
        >
          {result.eventName}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {firstName ? (
            <div style={{ display: "flex", fontSize: 44, color: "#c7d2fe" }}>
              {firstName}
            </div>
          ) : null}
          {result.score != null ? (
            <div
              style={{
                display: "flex",
                fontSize: 220,
                fontWeight: 700,
                lineHeight: 1,
                marginTop: 12,
              }}
            >
              {result.score.toLocaleString("en-GB")}
            </div>
          ) : null}
          {standing ? (
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 700,
                marginTop: 28,
                padding: "16px 36px",
                borderRadius: 999,
                border: "3px solid rgba(143,216,255,0.5)",
                color: "#8fd8ff",
              }}
            >
              {standing.line}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 26,
            color: "#9aa3c7",
          }}
        >
          <div style={{ display: "flex" }}>Measured live at the machine</div>
          <div style={{ display: "flex", fontWeight: 700, color: "#ffffff" }}>
            bright.blue
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  );
}
