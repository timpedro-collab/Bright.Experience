/**
 * Tests for the shared email shell template.
 *
 * Asserts on the *content* shape (eyebrow, subject, CTA, sign-off) and
 * on the safety contract (HTML escaping). Visual fidelity is covered
 * by snapshot-style assertions on substrings, not full markup — see
 * the testing guide on why we avoid raw snapshots.
 */

import { describe, it, expect } from "vitest";
import { renderNotificationEmail, escapeHtml, eyebrowToneFor } from "./email-shell";

describe("escapeHtml", () => {
  it("escapes the five common HTML chars + apostrophe", () => {
    expect(escapeHtml("<b>x & y \"z\" 'w'</b>")).toBe(
      "&lt;b&gt;x &amp; y &quot;z&quot; &#39;w&#39;&lt;/b&gt;"
    );
  });
});

describe("eyebrowToneFor", () => {
  it("uses amber for action-required", () => {
    expect(eyebrowToneFor("Action required").fg).toBe("#B45309");
  });

  it("uses red for reminders and final checks", () => {
    expect(eyebrowToneFor("Reminder").fg).toBe("#B91C1C");
    expect(eyebrowToneFor("Final checks").fg).toBe("#B91C1C");
  });

  it("defaults to blue for FYI", () => {
    expect(eyebrowToneFor("FYI").fg).toBe("#1F3FA8");
  });
});

describe("renderNotificationEmail", () => {
  it("includes the eyebrow, subject, and body", () => {
    const html = renderNotificationEmail({
      eyebrow: "Action required",
      subject: "Test subject",
      body: "Hello world.",
    });
    expect(html).toContain("Action required");
    expect(html).toContain("Test subject");
    expect(html).toContain("Hello world.");
  });

  it("renders the CTA when both label and href are present", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
      ctaLabel: "Open in portal",
      ctaHref: "https://test.local/foo",
    });
    expect(html).toContain("Open in portal");
    expect(html).toContain("https://test.local/foo");
  });

  it("omits the CTA when label is missing", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
      ctaHref: "https://test.local/foo",
    });
    expect(html).not.toContain("https://test.local/foo");
  });

  it("renders feedback in an amber block", () => {
    const html = renderNotificationEmail({
      eyebrow: "Action required",
      subject: "x",
      body: "y",
      feedback: "Make it pop",
    });
    expect(html).toContain("Make it pop");
    expect(html).toContain("Note from the team");
  });

  it("renders the reminder hint when provided", () => {
    const html = renderNotificationEmail({
      eyebrow: "Reminder",
      subject: "x",
      body: "y",
      reminderHint: "Following up since Tuesday",
    });
    expect(html).toContain("Following up since Tuesday");
  });

  it("includes the named-AE sign-off by default", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
    });
    expect(html).toContain("Sarah Chen");
    expect(html).toContain("Bright.Blue");
  });

  it("hides the sign-off when showSignOff is false", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
      showSignOff: false,
    });
    expect(html).not.toContain("Sarah Chen");
  });

  it("includes a manage-preferences footer link", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
    });
    expect(html).toContain("Manage these notifications");
    expect(html).toContain("/settings/notifications");
  });

  it("uses a custom manageHref when provided", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
      manageHref: "https://example.com/prefs",
    });
    expect(html).toContain("https://example.com/prefs");
  });

  it("appends an anchor when manageAnchor is provided", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "y",
      manageAnchor: "asset-review",
    });
    expect(html).toContain("#asset-review");
  });

  it("escapes user-supplied subject and body", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "<script>alert(1)</script>",
      body: "<img src=x>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });

  it("converts newlines in body into paragraph tags", () => {
    const html = renderNotificationEmail({
      eyebrow: "FYI",
      subject: "x",
      body: "para 1\n\npara 2",
    });
    expect(html).toContain("para 1");
    expect(html).toContain("para 2");
    // We expect at least two <p> tags in the body section
    expect((html.match(/<p[^>]*>para/g) || []).length).toBe(2);
  });
});
