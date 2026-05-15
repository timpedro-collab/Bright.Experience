/**
 * Email shell for the unified notification spine.
 *
 * The plan calls for a single shared template so every notification email
 * the customer (or internal team) receives looks like it came from the
 * same brand. We deliberately keep this as a tagged-template string
 * builder rather than React Email — the existing transactional emails
 * (`sendStudioOrderNotification`, `sendProposalIntakeNotification`) use
 * the same inline-styled approach and adding React Email would force
 * every consumer to also adopt JSX rendering. The shape and props match
 * what a React Email component would expose, so swapping the rendering
 * out later is a one-file change.
 *
 * The template renders:
 *   - Bright.Blue gradient header
 *   - Eyebrow chip (Action required / FYI / Reminder)
 *   - Headline (subject)
 *   - Body paragraph
 *   - Optional feedback block (asset revisions)
 *   - Optional CTA button
 *   - Optional reminder hint
 *   - Named-AE sign-off
 *   - "Manage these notifications" footer link
 */

import { DEFAULT_ACCOUNT_MANAGER } from "@/lib/team";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #0D1137 0%, #142563 50%, #1F3FA8 100%)";

const COLORS = {
  bg: "#F4F6FB",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  primary: "#246BFD",
  amber: "#B45309",
  amberSoft: "#FEF3C7",
  ink: "#0D1137",
};

export interface EmailShellPayload {
  /** "Action required" | "FYI" | "Reminder" | "Final checks" — drives chip styling. */
  eyebrow: string;
  /** Pre-rendered subject line. */
  subject: string;
  /** Plain-text body, supports newlines. */
  body: string;
  /** Optional CTA. Hidden when omitted. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Optional, used for asset revision feedback. */
  feedback?: string;
  /** Optional reminder context — adds a small italic line above the body. */
  reminderHint?: string;
  /** Where the recipient can adjust their preferences for this archetype. */
  manageHref?: string;
  /** Slugged "manage" hash so the page can deep-link to the right row. */
  manageAnchor?: string;
  /** Whether to surface the named AE sign-off. Default true. */
  showSignOff?: boolean;
}

function eyebrowTone(eyebrow: string): { bg: string; fg: string } {
  const upper = eyebrow.toLowerCase();
  if (upper.includes("action")) return { bg: "#FEF3C7", fg: "#B45309" };
  if (upper.includes("reminder")) return { bg: "#FEE2E2", fg: "#B91C1C" };
  if (upper.includes("final")) return { bg: "#FEE2E2", fg: "#B91C1C" };
  return { bg: "#E0E7FF", fg: "#1F3FA8" };
}

/**
 * Escape user-supplied strings before they land in the HTML body. Keeps
 * notes/feedback from accidentally injecting markup when a customer
 * pastes something exotic into a review note.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderNotificationEmail(payload: EmailShellPayload): string {
  const tone = eyebrowTone(payload.eyebrow);
  const ae = DEFAULT_ACCOUNT_MANAGER;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
  const manageHref =
    payload.manageHref ??
    `${baseUrl}/settings/notifications${
      payload.manageAnchor ? `#${payload.manageAnchor}` : ""
    }`;
  const cta =
    payload.ctaHref && payload.ctaLabel
      ? `
        <div style="margin-top: 28px;">
          <a href="${payload.ctaHref}" style="display: inline-block; background: ${COLORS.primary}; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.01em;">
            ${escapeHtml(payload.ctaLabel)}
          </a>
        </div>
      `
      : "";

  const feedbackBlock = payload.feedback
    ? `
      <div style="margin-top: 20px; background: ${COLORS.amberSoft}; border-left: 3px solid ${COLORS.amber}; padding: 14px 16px; border-radius: 8px;">
        <p style="margin: 0 0 6px; color: ${COLORS.amber}; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;">Note from the team</p>
        <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.55; white-space: pre-line;">${escapeHtml(payload.feedback)}</p>
      </div>
    `
    : "";

  const reminderLine = payload.reminderHint
    ? `<p style="margin: 0 0 12px; color: ${COLORS.muted}; font-size: 12px; font-style: italic;">${escapeHtml(payload.reminderHint)}</p>`
    : "";

  const signOff =
    payload.showSignOff !== false
      ? `
        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid ${COLORS.border};">
          <p style="margin: 0; color: ${COLORS.text}; font-size: 14px; font-weight: 600;">${ae.fullName}</p>
          <p style="margin: 2px 0 0; color: ${COLORS.muted}; font-size: 12px;">${ae.title} · Bright.Blue</p>
          <p style="margin: 6px 0 0; color: ${COLORS.muted}; font-size: 12px;">Reply directly — you'll reach me.</p>
        </div>
      `
      : "";

  // Body supports newlines without exposing raw \n to recipients.
  const bodyHtml = escapeHtml(payload.body)
    .split(/\n+/)
    .map(
      (line) =>
        `<p style="margin: 0 0 12px; color: ${COLORS.text}; font-size: 15px; line-height: 1.6;">${line}</p>`
    )
    .join("");

  return `
    <div style="background: ${COLORS.bg}; padding: 32px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 580px; margin: 0 auto;">
        <div style="background: ${BRAND_GRADIENT}; padding: 28px 32px; border-radius: 16px 16px 0 0;">
          <div style="display: inline-block; background: rgba(255,255,255,0.12); padding: 6px 12px; border-radius: 999px;">
            <span style="color: #ffffff; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(payload.eyebrow)}</span>
          </div>
          <h1 style="color: #ffffff; font-size: 22px; line-height: 1.35; margin: 14px 0 0; font-weight: 600;">${escapeHtml(payload.subject)}</h1>
        </div>
        <div style="background: ${COLORS.card}; padding: 28px 32px; border: 1px solid ${COLORS.border}; border-top: none; border-radius: 0 0 16px 16px;">
          ${reminderLine}
          ${bodyHtml}
          ${feedbackBlock}
          ${cta}
          ${signOff}
        </div>
        <div style="text-align: center; margin-top: 18px;">
          <a href="${manageHref}" style="color: ${COLORS.muted}; font-size: 11px; text-decoration: none;">Manage these notifications</a>
          <span style="color: ${COLORS.muted}; font-size: 11px;"> · </span>
          <span style="color: ${COLORS.muted}; font-size: 11px;">Bright.Blue · Experience Portal</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Eyebrow chip with explicit colours — exposed for unit tests / Storybook
 * if those land later. Kept here so the rendering and the colour rules
 * never drift.
 */
export const eyebrowToneFor = eyebrowTone;
