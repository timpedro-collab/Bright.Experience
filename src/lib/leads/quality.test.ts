/** Tests for lead email classification and dedupe helpers. */
import { describe, it, expect } from "vitest";
import {
  assessLead,
  classifyEmail,
  DISPOSABLE_DOMAINS,
  normaliseEmailForDedupe,
} from "./quality";

describe("classifyEmail", () => {
  it("accepts pragmatically valid addresses", () => {
    expect(classifyEmail("jane@example.com")).toBe("verified");
    expect(classifyEmail("  bob.smith@company.co.uk  ")).toBe("verified");
  });

  it("rejects empty and whitespace-only input", () => {
    expect(classifyEmail("")).toBe("invalid");
    expect(classifyEmail("   ")).toBe("invalid");
  });

  it("rejects missing @, double @, no TLD, and embedded spaces", () => {
    expect(classifyEmail("not-an-email")).toBe("invalid");
    expect(classifyEmail("a@@b.com")).toBe("invalid");
    expect(classifyEmail("user@domain")).toBe("invalid");
    expect(classifyEmail("user @domain.com")).toBe("invalid");
    expect(classifyEmail("@domain.com")).toBe("invalid");
    expect(classifyEmail("user@.com")).toBe("invalid");
    expect(classifyEmail("user@domain.c")).toBe("invalid");
  });

  it("flags disposable domains regardless of casing", () => {
    expect(classifyEmail("scout@mailinator.com")).toBe("disposable");
    expect(classifyEmail("scout@MailInator.COM")).toBe("disposable");
    expect(classifyEmail("temp@YOPMAIL.com")).toBe("disposable");
  });

  it("exports a sizeable disposable-domain blocklist", () => {
    expect(DISPOSABLE_DOMAINS.size).toBeGreaterThanOrEqual(40);
    expect(DISPOSABLE_DOMAINS.has("mailinator.com")).toBe(true);
  });
});

describe("normaliseEmailForDedupe", () => {
  it("strips gmail dots and +tags", () => {
    expect(normaliseEmailForDedupe("j.ane+expo@gmail.com")).toBe("jane@gmail.com");
    expect(normaliseEmailForDedupe("Jane+VIP@GoogleMail.com")).toBe(
      "jane@googlemail.com",
    );
  });

  it("keeps dots on non-gmail domains", () => {
    expect(normaliseEmailForDedupe("first.last+tag@company.co.uk")).toBe(
      "first.last+tag@company.co.uk",
    );
  });

  it("trims and lower-cases all domains", () => {
    expect(normaliseEmailForDedupe("  BOB@Example.COM ")).toBe("bob@example.com");
  });
});

describe("assessLead", () => {
  it("combines classification with repeat detection", () => {
    const existing = new Set(["jane@gmail.com"]);
    expect(assessLead("j.ane+expo@gmail.com", existing)).toEqual({
      emailStatus: "verified",
      isRepeatPlayer: true,
    });
  });

  it("marks first-time verified leads as non-repeat", () => {
    const existing = new Set<string>();
    expect(assessLead("new@example.com", existing)).toEqual({
      emailStatus: "verified",
      isRepeatPlayer: false,
    });
  });

  it("still classifies disposable and invalid leads", () => {
    expect(
      assessLead("throwaway@mailinator.com", new Set(["throwaway@mailinator.com"])),
    ).toEqual({
      emailStatus: "disposable",
      isRepeatPlayer: true,
    });
    expect(assessLead("bad-address", new Set())).toEqual({
      emailStatus: "invalid",
      isRepeatPlayer: false,
    });
  });
});
