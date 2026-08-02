/** Tests for the Cal.com scheduling helpers. */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DEFAULT_CALCOM_LINK,
  getCalcomLink,
  calcomBookingUrl,
  walkthroughUrlFor,
  formatSlotLabel,
} from "./calcom";

const ORIGINAL = process.env.NEXT_PUBLIC_CALCOM_LINK;

afterEach(() => {
  if (ORIGINAL !== undefined) {
    process.env.NEXT_PUBLIC_CALCOM_LINK = ORIGINAL;
  } else {
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
  }
});

describe("getCalcomLink", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
  });

  it("returns null when the env var is unset", () => {
    expect(getCalcomLink()).toBeNull();
  });

  it("returns null when the env var is blank", () => {
    process.env.NEXT_PUBLIC_CALCOM_LINK = "   ";
    expect(getCalcomLink()).toBeNull();
  });

  it("returns the trimmed link with surrounding slashes stripped", () => {
    process.env.NEXT_PUBLIC_CALCOM_LINK = " /brightblue/15min/ ";
    expect(getCalcomLink()).toBe("brightblue/15min");
  });
});

describe("calcomBookingUrl", () => {
  it("builds the full cal.com URL", () => {
    expect(calcomBookingUrl("brightblue/15min")).toBe(
      "https://cal.com/brightblue/15min"
    );
  });

  it("tolerates a leading slash", () => {
    expect(calcomBookingUrl("/team/intro")).toBe("https://cal.com/team/intro");
  });
});

describe("walkthroughUrlFor", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
  });

  it("prefers the per-quote override URL", () => {
    expect(walkthroughUrlFor("https://cal.com/sarah/walkthrough")).toBe(
      "https://cal.com/sarah/walkthrough"
    );
  });

  it("falls back to the configured Cal.com link", () => {
    process.env.NEXT_PUBLIC_CALCOM_LINK = "brightblue/walkthrough";
    expect(walkthroughUrlFor(null)).toBe(
      "https://cal.com/brightblue/walkthrough"
    );
  });

  it("falls back to the default link when nothing is configured", () => {
    expect(walkthroughUrlFor(undefined)).toBe(
      `https://cal.com/${DEFAULT_CALCOM_LINK}`
    );
    expect(walkthroughUrlFor("  ")).toBe(
      `https://cal.com/${DEFAULT_CALCOM_LINK}`
    );
  });
});

describe("formatSlotLabel", () => {
  it("formats a UTC start time in the London timezone", () => {
    // 13:00 UTC on 2 July 2026 is 2:00 PM BST.
    expect(formatSlotLabel("2026-07-02T13:00:00Z")).toBe("Thu 2 Jul · 2:00 PM");
  });

  it("returns null for an unparseable timestamp", () => {
    expect(formatSlotLabel("not-a-date")).toBeNull();
  });
});
