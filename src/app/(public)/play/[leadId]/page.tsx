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
    /* Cinematic share surface — force-Ink (`theme-dark`) like the wrapped
       report, so the player card always reads as the night-mode keepsake
       regardless of the visitor's theme. */
    <div className="theme-dark ink-glows relative min-h-screen bg-background text-foreground">
      <div className="relative mx-auto max-w-xl px-6 py-16 text-center sm:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-cyan">
          {result.eventName}
        </p>

        <h1 className="mt-6 text-4xl font-bold leading-tight">
          {firstName ? `${firstName}, you showed up.` : "What a play."}
        </h1>

        {result.score != null && (
          /* The page's one gradient accent — the score is the key metric. */
          <p className="text-brand-gradient mt-12 text-[clamp(4rem,20vw,8rem)] font-bold leading-none tabular-nums">
            {result.score.toLocaleString("en-GB")}
          </p>
        )}

        {(standing || fallbackLine) && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-5 py-2 text-base font-semibold text-brand-cyan">
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

        <div className="mt-16">
          <InvitationFooter
            artifact="player_card"
            fromEvent={result.eventName}
          />
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
          Measured live at the machine · bright.blue
        </p>
      </div>
    </div>
  );
}
