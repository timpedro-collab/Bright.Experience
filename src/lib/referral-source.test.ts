import { describe, it, expect } from "vitest";
import { referralSourceLabel } from "./referral-source";

describe("referralSourceLabel", () => {
  it("returns the human label for known values", () => {
    expect(referralSourceLabel("social")).toBe("LinkedIn or social media");
    expect(referralSourceLabel("event_saw_machine")).toBe("Saw a machine at an event");
  });

  it("returns null for unknown values", () => {
    expect(referralSourceLabel("word_of_mouth")).toBeNull();
  });

  it("returns null for null, undefined, or blank input", () => {
    expect(referralSourceLabel(null)).toBeNull();
    expect(referralSourceLabel(undefined)).toBeNull();
    expect(referralSourceLabel("   ")).toBeNull();
  });
});
