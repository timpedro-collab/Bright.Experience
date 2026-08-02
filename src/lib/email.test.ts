/**
 * Tests for the transactional email senders.
 *
 * These emails interpolate customer-supplied names and company names straight
 * into HTML, so escaping is the load-bearing behaviour here — a contact called
 * `<script>` must not become markup in an inbox.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

/** One sent email as Resend receives it — only the fields the tests read. */
interface SentEmail {
  to: string[];
  subject: string;
  html: string;
}

const resendSend = vi.fn(async (_payload: SentEmail) => ({
  data: { id: "email_1" },
  error: null,
}));

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: resendSend };
  },
}));

/** The module reads RESEND_API_KEY at import time, so import after setting it. */
async function loadEmail() {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.resetModules();
  return import("./email");
}

/** The single payload passed to Resend by the call under test. */
function sentPayload(): SentEmail {
  return resendSend.mock.calls[0]![0];
}

beforeEach(() => {
  resendSend.mockClear();
});

describe("sendBookingConfirmationEmail", () => {
  const BOOKING = {
    contactName: "Dana Reyes",
    contactEmail: "dana@acme.com",
    packageName: "Signature Activation",
    companyName: "Acme Drinks",
    eventDateStart: "2026-09-01",
    eventDateEnd: "2026-09-03",
    totalAmount: 12500,
    receiptUrl: "https://portal.test/proposal/q1",
  };

  it("sends the buyer a receipt with their package, dates and total", async () => {
    const { sendBookingConfirmationEmail } = await loadEmail();
    await sendBookingConfirmationEmail(BOOKING);

    const payload = sentPayload();
    expect(payload.to).toEqual(["dana@acme.com"]);
    expect(payload.subject).toContain("Dana");
    expect(payload.html).toContain("Signature Activation");
    expect(payload.html).toContain("2026-09-01 → 2026-09-03");
    expect(payload.html).toContain("£12,500");
    expect(payload.html).toContain("https://portal.test/proposal/q1");
  });

  it("shows a single date when the event is one day", async () => {
    const { sendBookingConfirmationEmail } = await loadEmail();
    await sendBookingConfirmationEmail({
      ...BOOKING,
      eventDateEnd: "2026-09-01",
    });

    expect(sentPayload().html).toContain("2026-09-01");
    expect(sentPayload().html).not.toContain("→");
  });

  it("says the dates are unconfirmed when none were given", async () => {
    const { sendBookingConfirmationEmail } = await loadEmail();
    await sendBookingConfirmationEmail({
      ...BOOKING,
      eventDateStart: null,
      eventDateEnd: null,
    });

    expect(sentPayload().html).toContain("To be confirmed");
  });

  it("escapes a company name that contains markup", async () => {
    const { sendBookingConfirmationEmail } = await loadEmail();
    await sendBookingConfirmationEmail({
      ...BOOKING,
      companyName: '<img src=x onerror="alert(1)">',
      packageName: "<b>Bold</b> Package",
    });

    const html = sentPayload().html;
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>Bold</b>");
    expect(html).toContain("&lt;img src=x");
  });

  it("keeps the subject line plain text, not HTML entities", async () => {
    const { sendBookingConfirmationEmail } = await loadEmail();
    await sendBookingConfirmationEmail({ ...BOOKING, contactName: "O'Brien" });

    expect(sentPayload().subject).toContain("O'Brien");
    expect(sentPayload().subject).not.toContain("&#39;");
  });

  it("does nothing when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.resetModules();
    const { sendBookingConfirmationEmail } = await import("./email");
    await sendBookingConfirmationEmail(BOOKING);

    expect(resendSend).not.toHaveBeenCalled();
  });

  it("swallows a Resend failure so the booking itself still stands", async () => {
    resendSend.mockRejectedValueOnce(new Error("provider down"));
    const { sendBookingConfirmationEmail } = await loadEmail();

    await expect(sendBookingConfirmationEmail(BOOKING)).resolves.toBeUndefined();
  });
});

describe("sendProposalReadyEmail", () => {
  const PROPOSAL = {
    contactName: "Dana Reyes",
    contactEmail: "dana@acme.com",
    companyName: "Acme Drinks",
    eventType: "Conference",
    proposalUrl: "https://portal.test/proposal/q1",
    walkthroughUrl: "https://cal.test/walkthrough",
  };

  it("invites the customer to book a walkthrough when none is held", async () => {
    const { sendProposalReadyEmail } = await loadEmail();
    await sendProposalReadyEmail(PROPOSAL);

    const html = sentPayload().html;
    expect(html).toContain("Book your 15-minute walkthrough");
    expect(html).not.toContain("Reschedule here");
  });

  it("confirms an existing call instead of asking again", async () => {
    const { sendProposalReadyEmail } = await loadEmail();
    await sendProposalReadyEmail({
      ...PROPOSAL,
      scheduledSlotLabel: "Thu 2 Jul · 2:00 PM",
    });

    const html = sentPayload().html;
    expect(html).toContain("Thu 2 Jul");
    expect(html).toContain("Reschedule here");
    expect(html).not.toContain("Book your 15-minute walkthrough");
  });

  it("escapes the event type and company name once, not twice", async () => {
    const { sendProposalReadyEmail } = await loadEmail();
    await sendProposalReadyEmail({
      ...PROPOSAL,
      eventType: "Awards & Gala",
      companyName: "Smith & Sons",
    });

    const html = sentPayload().html;
    expect(html).toContain("Awards &amp; Gala");
    expect(html).toContain("Smith &amp; Sons");
    expect(html).not.toContain("&amp;amp;");
  });
});

describe("sendProposalIntakeNotification", () => {
  const INTAKE = {
    quoteId: "q1",
    contactName: "Dana Reyes",
    contactEmail: "dana@acme.com",
    companyName: "Acme Drinks",
    eventType: "Conference",
    venueName: "Riverside Arena",
    capabilitySlugs: [],
    portalUrl: "https://portal.test/admin/quotes/q1",
  };

  it("tells the sales team who came in and what they asked for", async () => {
    const { sendProposalIntakeNotification } = await loadEmail();
    await sendProposalIntakeNotification({
      ...INTAKE,
      capabilitySlugs: ["branded-landing-page"],
    });

    const payload = sentPayload();
    expect(payload.subject).toContain("Dana Reyes");
    expect(payload.html).toContain("Riverside Arena");
    expect(payload.html).toContain("branded-landing-page");
  });

  it("says so plainly when no tailoring was requested", async () => {
    const { sendProposalIntakeNotification } = await loadEmail();
    await sendProposalIntakeNotification(INTAKE);

    expect(sentPayload().html).toContain("No tailoring requested");
  });

  it("escapes a contact name that contains markup", async () => {
    const { sendProposalIntakeNotification } = await loadEmail();
    await sendProposalIntakeNotification({
      ...INTAKE,
      contactName: "<script>alert(1)</script>",
    });

    expect(sentPayload().html).not.toContain("<script>");
    expect(sentPayload().html).toContain("&lt;script&gt;");
  });
});

describe("sendStudioOrderNotification", () => {
  const ORDER = {
    title: "Wrap artwork",
    eventName: "Tech Summit",
    accountName: "Acme Drinks",
    orderedBy: "Dana Reyes",
    serviceType: "design",
    portalUrl: "https://portal.test/studio/o1",
  };

  it("escapes the free-text details the requester typed", async () => {
    const { sendStudioOrderNotification } = await loadEmail();
    await sendStudioOrderNotification({
      ...ORDER,
      description: '<iframe src="evil"></iframe>',
    });

    const html = sentPayload().html;
    expect(html).not.toContain("<iframe");
    expect(html).toContain("&lt;iframe");
  });

  it("omits the details row when no description was given", async () => {
    const { sendStudioOrderNotification } = await loadEmail();
    await sendStudioOrderNotification(ORDER);

    expect(sentPayload().html).not.toContain("Details");
  });
});
