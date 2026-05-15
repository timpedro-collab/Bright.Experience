import { Resend } from "resend";
import { getCapabilities } from "./capabilities";

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
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 600;">${title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Service</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${serviceType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Client</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${accountName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Event</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Ordered By</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${orderedBy}</td>
              </tr>
              ${
                description
                  ? `<tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Details</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px; white-space: pre-line;">${description}</td>
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
              `<li style="margin: 4px 0; color:#111827;">${c.outcome} <span style="color:#6b7280;">— ${c.mechanism}</span></li>`
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
                <td style="padding: 8px 0; color: #111827; font-size: 13px; font-weight: 600;">${contactName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-size: 13px;">${contactEmail}</td>
              </tr>
              ${
                companyName
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Company</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${companyName}</td></tr>`
                  : ""
              }
              ${
                eventType
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Event type</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${eventType}</td></tr>`
                  : ""
              }
              ${
                venueName
                  ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Venue</td><td style="padding: 8px 0; color: #111827; font-size: 13px;">${venueName}</td></tr>`
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
