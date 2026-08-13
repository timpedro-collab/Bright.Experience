import { Resend } from "resend";
import { getCapabilities } from "./capabilities";
import { escapeHtml } from "./notifications/email-shell";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const STUDIO_TEAM_EMAIL =
  process.env.STUDIO_TEAM_EMAIL ?? "studio@brightblue.co.uk";
const SALES_TEAM_EMAIL =
  process.env.SALES_TEAM_EMAIL ?? "sales@brightblue.co.uk";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@brightblue.co.uk";

export async function sendStudioOrderNotification({
  title,
  description,
  eventName,
  accountName,
  orderedBy,
  serviceType,
  portalUrl,
}: {
  title: string;
  description?: string;
  eventName: string;
  accountName: string;
  orderedBy: string;
  serviceType: string;
  portalUrl: string;
}) {
  if (!resend) {
    console.log(
      "[Email] Resend not configured — skipping notification:",
      title
    );
    return;
  }

  try {
    await resend.emails.send({
      from: `Bright.Experience <${FROM_EMAIL}>`,
      to: [STUDIO_TEAM_EMAIL],
      subject: `New Studio Order: ${title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0D1137; padding: 24px 32px; border-radius: 16px 16px 0 0;">
            <h1 style="color: #ffffff; font-size: 18px; margin: 0;">
              New Studio Order
            </h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Order</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 600;">${escapeHtml(title)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Service</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(serviceType)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Client</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(accountName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Event</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(eventName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Ordered By</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(orderedBy)}</td>
              </tr>
              ${
                description
                  ? `<tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Details</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; white-space: pre-line;">${escapeHtml(description)}</td>
              </tr>`
                  : ""
              }
            </table>
            <div style="margin-top: 24px;">
              <a href="${portalUrl}" style="display: inline-block; background: #246BFD; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                View in Portal
              </a>
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] Failed to send studio notification:", error);
  }
}

/**
 * Deliver a finished proposal to the customer.
 *
 * Fired when an AE hits "Send Proposal" (`prepareProposal`). The pricing on the
 * proposal page stays hidden until the 15-minute walkthrough is marked complete,
 * so this email leads with "view your proposal" and offers the walkthrough
 * booking as the natural next step. It never quotes a figure.
 *
 * When the customer already booked their walkthrough on the confirmation
 * screen, pass `scheduledSlotLabel` and the email confirms the existing call
 * instead of redundantly asking them to book one.
 *
 * Addressed to the quote's `contact_email` (the customer may not have a portal
 * account yet), which is why this is a direct transactional send rather than a
 * `dispatchNotification` fan-out.
 */
export async function sendProposalReadyEmail({
  contactName,
  contactEmail,
  companyName,
  eventType,
  proposalUrl,
  walkthroughUrl,
  scheduledSlotLabel,
}: {
  contactName: string;
  contactEmail: string;
  companyName?: string | null;
  eventType?: string | null;
  proposalUrl: string;
  /**
   * External booking/reschedule URL. Null when Cal.com is not configured —
   * booking then happens inline on the proposal page, so links fall back to
   * `proposalUrl` and the copy avoids promising a calendar invite that the
   * in-app picker doesn't send.
   */
  walkthroughUrl: string | null;
  /** Human label of an already-booked walkthrough, e.g. "Thu 2 Jul · 2:00 PM". */
  scheduledSlotLabel?: string | null;
}) {
  if (!resend) {
    console.log(
      "[Email] Resend not configured — skipping proposal-ready email to:",
      contactEmail
    );
    return;
  }

  const firstName = contactName.trim().split(/\s+/)[0] || "there";
  const eventPhrase = eventType ? ` for your ${escapeHtml(eventType)}` : "";

  // The closing block adapts to whether a walkthrough call is already booked:
  // confirm the existing call, or invite them to pick a time.
  const bookingHref = walkthroughUrl ?? proposalUrl;
  const callLinkLine = walkthroughUrl
    ? "your call link is in the calendar invite"
    : "your event lead will send the video call link ahead of time";
  const callBlock = scheduledSlotLabel
    ? `
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 8px;">
              You're booked for <strong>${escapeHtml(scheduledSlotLabel)}</strong>. We'll walk
              through the proposal together on a video call and cover the
              investment; ${callLinkLine}. Have a read
              before then if you can.
            </p>
            <div style="margin: 8px 0 4px;">
              <a href="${bookingHref}" style="display: inline-block; color: #246BFD; text-decoration: none; font-size: 14px; font-weight: 600;">
                Need a different time? Reschedule here →
              </a>
            </div>`
    : `
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 8px;">
              When you're ready, book a 15-minute video call. We'll walk through it together and cover the investment, with no commitment.
            </p>
            <div style="margin: 8px 0 4px;">
              <a href="${bookingHref}" style="display: inline-block; color: #246BFD; text-decoration: none; font-size: 14px; font-weight: 600;">
                Book your 15-minute walkthrough →
              </a>
            </div>`;

  try {
    await resend.emails.send({
      from: `Bright.Experience <${FROM_EMAIL}>`,
      to: [contactEmail],
      subject: `Your Bright.Blue proposal is ready, ${firstName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0D1137; padding: 28px 32px; border-radius: 16px 16px 0 0;">
            <p style="color: #7FB2FF; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px;">Bright.Blue · Proposal</p>
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Your proposal is ready</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #111827; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
              Hi ${escapeHtml(firstName)},
            </p>
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
              We've put together a proposal${eventPhrase}${companyName ? ` at ${escapeHtml(companyName)}` : ""}.
              It covers the concept, what's included, and the reach we're projecting.${scheduledSlotLabel ? " Here it is ahead of our call." : " Take a look whenever suits you."}
            </p>
            <div style="margin: 24px 0;">
              <a href="${proposalUrl}" style="display: inline-block; background: #246BFD; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                View your proposal
              </a>
            </div>${callBlock}
            <p style="margin-top: 28px; color: #9ca3af; font-size: 12px; line-height: 1.6;">
              Questions? Just reply to this email and it'll reach your event lead directly.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] Failed to send proposal-ready email:", error);
  }
}

/**
 * Confirm a Book Now submission to the buyer.
 *
 * The booking screen showed a receipt and then went quiet: the customer had
 * handed over dates and money-relevant choices with nothing in their inbox to
 * prove it. This is that proof, and it is deliberately not an invoice — the
 * quote is still `submitted` until the team confirms availability.
 *
 * Addressed to the quote's contact email rather than dispatched through the
 * notification spine, because a Book Now buyer has no portal account yet.
 */
export async function sendBookingConfirmationEmail({
  contactName,
  contactEmail,
  packageName,
  companyName,
  eventDateStart,
  eventDateEnd,
  totalAmount,
  receiptUrl,
}: {
  contactName: string;
  contactEmail: string;
  packageName: string;
  companyName?: string | null;
  eventDateStart?: string | null;
  eventDateEnd?: string | null;
  /** Whole pounds, as stored on the quote. */
  totalAmount: number;
  receiptUrl: string;
}) {
  if (!resend) {
    console.log(
      "[Email] Resend not configured — skipping booking confirmation to:",
      contactEmail
    );
    return;
  }

  const firstName = contactName.trim().split(/\s+/)[0] || "there";
  const dates = eventDateStart
    ? eventDateEnd && eventDateEnd !== eventDateStart
      ? `${eventDateStart} → ${eventDateEnd}`
      : eventDateStart
    : "To be confirmed";
  const total = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(totalAmount);

  try {
    await resend.emails.send({
      from: `Bright.Experience <${FROM_EMAIL}>`,
      to: [contactEmail],
      subject: `We've got your booking, ${firstName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0D1137; padding: 28px 32px; border-radius: 16px 16px 0 0;">
            <p style="color: #7FB2FF; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 6px;">Bright.Blue · Booking</p>
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">We've got your booking</h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #111827; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Hi ${escapeHtml(firstName)},</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.7; margin: 0 0 20px;">
              Thanks${companyName ? ` — and thanks to ${escapeHtml(companyName)}` : ""}. Here's what we have.
              We'll confirm availability and come back to you with the next step.
            </p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Package</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 600;">${escapeHtml(packageName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Dates</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(dates)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Total</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${total}</td>
              </tr>
            </table>
            <div style="margin-top: 24px;">
              <a href="${receiptUrl}" style="display: inline-block; background: #246BFD; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                View your booking
              </a>
            </div>
            <p style="margin-top: 28px; color: #9ca3af; font-size: 12px; line-height: 1.6;">
              Nothing is charged yet. Reply to this email and it reaches your event lead directly.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] Failed to send booking confirmation:", error);
  }
}

/**
 * Notify the sales team that a new proposal intake has landed.
 *
 * The capability slugs are translated to outcome lines so the AE reading the
 * email sees the same language the customer chose — never the raw slug.
 * `capabilitySlugs` is also embedded as a structured comma-separated list at
 * the foot of the email for traceability.
 */
export async function sendProposalIntakeNotification({
  quoteId,
  contactName,
  contactEmail,
  companyName,
  eventType,
  venueName,
  capabilitySlugs,
  portalUrl,
}: {
  quoteId: string;
  contactName: string;
  contactEmail: string;
  companyName?: string | null;
  eventType?: string | null;
  venueName?: string | null;
  capabilitySlugs: string[];
  portalUrl: string;
}) {
  if (!resend) {
    console.log(
      "[Email] Resend not configured — skipping proposal intake notification:",
      quoteId
    );
    return;
  }

  const capabilities = getCapabilities(capabilitySlugs);
  const outcomeListHtml =
    capabilities.length === 0
      ? `<li style="color:#6b7280;">No tailoring requested — turnkey activation as-is.</li>`
      : capabilities
          .map(
            (c) =>
              `<li style="margin: 4px 0; color:#111827;">${escapeHtml(c.outcome)} <span style="color:#6b7280;">— ${escapeHtml(c.mechanism)}</span></li>`
          )
          .join("");

  try {
    await resend.emails.send({
      from: `Bright.Experience <${FROM_EMAIL}>`,
      to: [SALES_TEAM_EMAIL],
      subject: `New proposal intake — ${contactName}${companyName ? ` · ${companyName}` : ""}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
          <div style="background: #0D1137; padding: 24px 32px; border-radius: 16px 16px 0 0;">
            <h1 style="color: #ffffff; font-size: 18px; margin: 0;">
              New proposal intake
            </h1>
          </div>
          <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Customer</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 600;">${escapeHtml(contactName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(contactEmail)}</td>
              </tr>
              ${
                companyName
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Company</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(companyName)}</td></tr>`
                  : ""
              }
              ${
                eventType
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Event type</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(eventType)}</td></tr>`
                  : ""
              }
              ${
                venueName
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Venue</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${escapeHtml(venueName)}</td></tr>`
                  : ""
              }
            </table>
            <div style="margin-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">Capabilities the customer asked for:</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px;">${outcomeListHtml}</ul>
            </div>
            <div style="margin-top: 24px;">
              <a href="${portalUrl}" style="display: inline-block; background: #246BFD; color: #ffffff; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
                Open in admin
              </a>
            </div>
            <p style="margin-top: 24px; color: #9ca3af; font-size: 11px;">
              Slugs (machine-readable): ${capabilitySlugs.length > 0 ? capabilitySlugs.join(", ") : "none"}
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[Email] Failed to send proposal intake notification:", error);
  }
}
