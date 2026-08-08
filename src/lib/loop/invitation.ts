/**
 * Invitation-loop helpers — every public artefact carries an invitation
 * ("Want results like this at your event?"), UTM-tagged per surface so the
 * loop-pulse dashboard can measure CTR by artefact.
 */

/** The public artefacts that carry an invitation footer. */
export type InvitationArtifact =
  | "report"
  | "wrapped"
  | "live_dashboard"
  | "sponsor_pitch"
  | "venue_widget"
  | "player_card"
  | "post_play_email"
  | "on_machine_qr";

/**
 * The UTM-tagged landing href for an invitation link. `fromEvent`
 * personalises the landing page ("You've seen what this did at {event}").
 */
export function invitationHref(
  artifact: InvitationArtifact,
  opts: { fromEvent?: string | null } = {}
): string {
  const params = new URLSearchParams({
    utm_source: artifact,
    utm_medium: "referral",
    utm_campaign: "invitation",
  });
  const from = opts.fromEvent?.trim();
  if (from) params.set("from", from);
  return `/book?${params.toString()}`;
}
