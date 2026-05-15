/**
 * Pure formatters for Pipedrive note bodies.
 *
 * Every note carries a consistent voice — short title, short body, link
 * back to the relevant portal page. The portal back-link uses the same
 * base URL precedence as the rest of the app (`NEXT_PUBLIC_SITE_URL`
 * with a sensible production default).
 *
 * Pure functions only. No I/O, no Supabase, no fetch — keeps the
 * formatter trivially testable and reusable from both the live drain
 * and any future replay tooling.
 */

import { STAGE_CONFIG } from "@/types";
import type { Stage } from "@/types";

const PORTAL_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://experience.brightblue.com";

function eventLink(eventId: string, suffix = ""): string {
  return `${PORTAL_BASE}/events/${eventId}${suffix}`;
}

export interface EventLite {
  id: string;
  name: string;
  account?: { name?: string } | null;
}

/** Title + body bundle for a Pipedrive note. */
export interface NotePayload {
  title: string;
  body: string;
}

function compose(title: string, body: string, link: string): NotePayload {
  // Pipedrive notes accept HTML — we keep it intentionally simple so the
  // note reads cleanly in both the Pipedrive UI and email digests.
  return {
    title,
    body: `<p><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(body)}</p><p><a href="${link}">Open in Bright.Experience</a></p>`,
  };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDealKickoffNote(event: EventLite): NotePayload {
  return compose(
    "Delivery kicked off in Bright.Experience",
    `${event.name} for ${event.account?.name ?? "the customer"} is now in delivery. The Bright.Experience portal is the source of truth from here on out — assets, approvals, briefing and live results all flow through it.`,
    eventLink(event.id)
  );
}

export function formatStageAdvanceNote(
  event: EventLite,
  toStage: Stage,
  percentComplete: number
): NotePayload {
  const stageLabel = STAGE_CONFIG[toStage]?.label ?? toStage;
  return compose(
    `Moved to ${stageLabel} · ${percentComplete}%`,
    `${event.name} just advanced to ${stageLabel}. Customer-side delivery is ${percentComplete}% complete.`,
    eventLink(event.id, "/timeline")
  );
}

export function formatApprovalDecisionNote(
  event: EventLite,
  approvalTitle: string,
  decision: "approved" | "revision_requested",
  feedback?: string
): NotePayload {
  if (decision === "approved") {
    return compose(
      `Customer approved ${approvalTitle}`,
      `${event.name}: ${approvalTitle} was approved. Delivery rolls forward to the next stage.`,
      eventLink(event.id, "/approvals")
    );
  }
  const tail = feedback ? ` Feedback: "${feedback.slice(0, 240)}"` : "";
  return compose(
    `Customer requested a revision on ${approvalTitle}`,
    `${event.name}: ${approvalTitle} needs another pass.${tail} See the portal for the full thread.`,
    eventLink(event.id, "/approvals")
  );
}

export function formatAssetReviewDecisionNote(
  event: EventLite,
  assetName: string,
  decision: "approved" | "revision_requested",
  feedback?: string
): NotePayload {
  if (decision === "approved") {
    return compose(
      `Bright.Blue approved customer asset ${assetName}`,
      `${event.name}: ${assetName} cleared review and is ready to ship.`,
      eventLink(event.id, "/assets")
    );
  }
  const tail = feedback ? ` Note to customer: "${feedback.slice(0, 240)}"` : "";
  return compose(
    `Revision requested on ${assetName}`,
    `${event.name}: customer asset ${assetName} needs a re-upload.${tail}`,
    eventLink(event.id, "/assets")
  );
}

export function formatEventLiveNote(
  event: EventLite,
  venueName: string | undefined,
  startDate: string
): NotePayload {
  return compose(
    `Live at ${venueName ?? "venue"} on ${startDate.split("T")[0]}`,
    `${event.name} is live. Live ops dashboard and lead-flow are streaming in the portal.`,
    eventLink(event.id, "/live")
  );
}

export function formatEventDeliveredNote(
  event: EventLite,
  leadCount: number,
  reportLink?: string
): NotePayload {
  const reportNote = reportLink ? ` Final report: ${reportLink}.` : "";
  return compose(
    "Delivered — final report ready",
    `${event.name} wrapped. ${leadCount} lead${leadCount === 1 ? "" : "s"} captured.${reportNote} Pull the highlights into your next conversation with ${event.account?.name ?? "the customer"}.`,
    eventLink(event.id, "/reports")
  );
}

export { escapeHtml };
