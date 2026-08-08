/**
 * Player result standing — the maths behind the personal result card.
 * The player is the hero: their score, their rank, "top X% today".
 * Personalized-identity content shares at multiples of brand content.
 */

export interface PlayerStanding {
  /** 1-based rank among the day's scored plays. */
  rank: number;
  /** How many scored plays the rank is out of. */
  of: number;
  /** Rounded-up share of players at or below this score, e.g. 4 for "top 4%". */
  topPercent: number;
  /** The line the card prints, e.g. "Top 4% of today's players". */
  line: string;
}

/**
 * Rank a score against every scored play. Ties share the better rank.
 * Null when the score is missing or nobody was scored — the card then
 * falls back to the player-number line instead of inventing a rank.
 */
export function standingFromScores(
  score: number | null | undefined,
  allScores: number[]
): PlayerStanding | null {
  if (score == null || !Number.isFinite(score)) return null;
  const scored = allScores.filter((s) => Number.isFinite(s));
  if (scored.length === 0) return null;

  const better = scored.filter((s) => s > score).length;
  const rank = better + 1;
  const of = Math.max(scored.length, rank);
  const topPercent = Math.max(1, Math.ceil((rank / of) * 100));

  return {
    rank,
    of,
    topPercent,
    line:
      topPercent <= 50
        ? `Top ${topPercent}% of today's players`
        : `One of ${of.toLocaleString("en-GB")} players today`,
  };
}

/** First name for the hero line; null keeps the card impersonal, not broken. */
export function playerFirstName(
  contactName: string | null | undefined
): string | null {
  const name = contactName?.trim();
  if (!name) return null;
  return name.split(/\s+/)[0];
}
