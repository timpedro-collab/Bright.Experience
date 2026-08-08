/**
 * Personal player result card — the player is the hero. Score, rank,
 * a downloadable share image; the brand and a subtle Bright mark ride
 * along. Capability URL: the lead's unguessable UUID is the credential.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

import { getPlayerResult } from "@/lib/queries/player-result";
import { playerFirstName, standingFromScores } from "@/lib/player-result";
import { recordLoopEvent } from "@/server/loop-events";
import { WrappedShareActions } from "@/components/reports/WrappedShareActions";
import { InvitationFooter } from "@/components/public/InvitationFooter";

interface Props {
  params: Promise<{ leadId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leadId } = await params;
  const result = await getPlayerResult(leadId);
  if (!result) return { title: "Not found" };
  return {
    title: `Your result — ${result.eventName}`,
    description: "Your play, measured live at the machine.",
    openGraph: { images: [`/api/play/${leadId}/card`] },
    robots: { index: false, follow: false },
  };
}

export default async function PlayerResultPage({ params }: Props) {
  const { leadId } = await params;
  const result = await getPlayerResult(leadId);
  if (!result) return notFound();

  // Loop pulse: player cards are a share surface — count the views.
  await recordLoopEvent("player_card_view", {
    artifact: "player_card",
    eventId: result.eventId,
  });

  const firstName = playerFirstName(result.firstNameSource);
  const standing = standingFromScores(result.score, result.dayScores);
  const fallbackLine =
    !standing && result.dayPlays > 0
      ? `One of ${result.dayPlays.toLocaleString("en-GB")} players today`
      : null;

  const shareText = [
    standing?.line ?? `I played at ${result.eventName}.`,
    result.score != null ? `Scored ${result.score.toLocaleString("en-GB")}.` : null,
    `Measured live at ${result.eventName}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-[#070b26] text-white">
      <div className="mx-auto max-w-xl px-6 py-16 text-center sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8fd8ff]">
          {result.eventName}
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight">
          {firstName ? `${firstName}, you showed up.` : "What a play."}
        </h1>

        {result.score != null && (
          <p className="mt-12 text-[clamp(4rem,20vw,8rem)] font-bold leading-none tabular-nums">
            {result.score.toLocaleString("en-GB")}
          </p>
        )}

        {(standing || fallbackLine) && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#8fd8ff]/40 bg-[#8fd8ff]/5 px-5 py-2 text-base font-semibold text-[#8fd8ff]">
            <Trophy size={16} />
            {standing?.line ?? fallbackLine}
          </p>
        )}

        <div className="mt-14">
          <WrappedShareActions
            shareText={shareText}
            cardUrl={`/api/play/${leadId}/card`}
          />
        </div>

        <div className="theme-dark mt-16">
          <InvitationFooter
            artifact="player_card"
            fromEvent={result.eventName}
          />
        </div>

        <p className="mt-8 text-xs text-white/40">
          Measured live at the machine · bright.blue
        </p>
      </div>
    </div>
  );
}
