/**
 * Tests for the Pipedrive note formatters. Each note has a consistent
 * voice and a back-link to the portal — pin both so a copy regression
 * surfaces in CI before the customer sees stale wording.
 */

import { describe, it, expect } from "vitest";
import {
  formatDealKickoffNote,
  formatStageAdvanceNote,
  formatApprovalDecisionNote,
  formatAssetReviewDecisionNote,
  formatEventLiveNote,
  formatEventDeliveredNote,
  escapeHtml,
  type EventLite,
} from "./format";

const baseEvent: EventLite = {
  id: "evt-1",
  name: "Spring Activation",
  account: { name: "Acme Brands" },
};

describe("escapeHtml", () => {
  it("escapes the five common HTML chars", () => {
    expect(escapeHtml("<b>x & y \"z\"</b>")).toBe("&lt;b&gt;x &amp; y &quot;z&quot;&lt;/b&gt;");
  });
});

describe("formatDealKickoffNote", () => {
  it("uses the account name when present", () => {
    const note = formatDealKickoffNote(baseEvent);
    expect(note.title).toMatch(/Delivery kicked off/);
    expect(note.body).toContain("Acme Brands");
    expect(note.body).toContain("Spring Activation");
    expect(note.body).toContain("Open in Bright.Experience");
  });

  it("falls back to 'the customer' when account is missing", () => {
    const note = formatDealKickoffNote({ ...baseEvent, account: null });
    expect(note.body).toContain("the customer");
  });

  it("includes a link to the event page", () => {
    const note = formatDealKickoffNote(baseEvent);
    expect(note.body).toContain("/events/evt-1");
  });
});

describe("formatStageAdvanceNote", () => {
  it("renders stage label + percent in the title", () => {
    const note = formatStageAdvanceNote(baseEvent, "creative_assets", 40);
    expect(note.title).toContain("40%");
    expect(note.title.toLowerCase()).toContain("creative");
  });

  it("links to the timeline page", () => {
    const note = formatStageAdvanceNote(baseEvent, "creative_assets", 40);
    expect(note.body).toContain("/events/evt-1/timeline");
  });
});

describe("formatApprovalDecisionNote", () => {
  it("renders an approved title for the approval decision", () => {
    const note = formatApprovalDecisionNote(baseEvent, "Logo v3", "approved");
    expect(note.title).toContain("approved");
    expect(note.title).toContain("Logo v3");
  });

  it("renders revision_requested with feedback in the body", () => {
    const note = formatApprovalDecisionNote(
      baseEvent,
      "Logo v3",
      "revision_requested",
      "Make the wordmark bolder"
    );
    expect(note.title.toLowerCase()).toContain("revision");
    expect(note.body).toContain("Make the wordmark bolder");
  });

  it("escapes HTML in feedback to prevent injection", () => {
    const note = formatApprovalDecisionNote(
      baseEvent,
      "Logo v3",
      "revision_requested",
      "<script>alert('x')</script>"
    );
    expect(note.body).not.toContain("<script>");
    expect(note.body).toContain("&lt;script&gt;");
  });

  it("truncates very long feedback to 240 chars", () => {
    const longFeedback = "a".repeat(500);
    const note = formatApprovalDecisionNote(
      baseEvent,
      "Logo v3",
      "revision_requested",
      longFeedback
    );
    // 240 a's should be in the body, 500 should not
    expect(note.body).toContain("a".repeat(240));
    expect(note.body).not.toContain("a".repeat(241));
  });
});

describe("formatAssetReviewDecisionNote", () => {
  it("approves with the asset name in the title", () => {
    const note = formatAssetReviewDecisionNote(baseEvent, "hero.png", "approved");
    expect(note.title).toContain("hero.png");
    expect(note.title.toLowerCase()).toContain("approved");
  });

  it("requests revision with feedback truncated and escaped", () => {
    const note = formatAssetReviewDecisionNote(
      baseEvent,
      "hero.png",
      "revision_requested",
      "<x>bad</x>"
    );
    expect(note.body).toContain("&lt;x&gt;bad");
  });
});

describe("formatEventLiveNote", () => {
  it("renders venue + start date in the title", () => {
    const note = formatEventLiveNote(baseEvent, "ExCeL London", "2026-06-15T09:00:00Z");
    expect(note.title).toContain("ExCeL London");
    expect(note.title).toContain("2026-06-15");
  });

  it("falls back to 'venue' when name is missing", () => {
    const note = formatEventLiveNote(baseEvent, undefined, "2026-06-15");
    expect(note.title).toContain("venue");
  });

  it("links to the live page", () => {
    const note = formatEventLiveNote(baseEvent, "ExCeL", "2026-06-15");
    expect(note.body).toContain("/events/evt-1/live");
  });
});

describe("formatEventDeliveredNote", () => {
  it("singularises 'lead' for 1 lead", () => {
    const note = formatEventDeliveredNote(baseEvent, 1);
    expect(note.body).toMatch(/1 lead\b/);
  });

  it("pluralises 'leads' for 2+", () => {
    const note = formatEventDeliveredNote(baseEvent, 87);
    expect(note.body).toMatch(/87 leads\b/);
  });

  it("includes the optional report link when provided", () => {
    const note = formatEventDeliveredNote(baseEvent, 10, "https://reports.example/r/1");
    expect(note.body).toContain("https://reports.example/r/1");
  });

  it("does not mention 'Final report' when no link provided", () => {
    const note = formatEventDeliveredNote(baseEvent, 10);
    expect(note.body).not.toContain("Final report:");
  });
});
