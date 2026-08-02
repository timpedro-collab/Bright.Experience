/** Tests for capture-quality rule defaults, parsing, and email blocking. */
import { describe, it, expect } from "vitest";
import {
  DEFAULT_BLOCKED_DOMAINS,
  DEFAULT_CONSENT_TEXT,
  defaultCaptureRules,
  normalizeDomain,
  parseCaptureRules,
  isEmailBlocked,
} from "./capture-rules";

describe("defaultCaptureRules", () => {
  it("turns every guardrail on by default", () => {
    const rules = defaultCaptureRules();
    expect(rules.businessEmailsOnly).toBe(true);
    expect(rules.blockDuplicates).toBe(true);
    expect(rules.consentRequired).toBe(true);
    expect(rules.consentText).toBe(DEFAULT_CONSENT_TEXT);
    expect(rules.blockedDomains).toEqual(DEFAULT_BLOCKED_DOMAINS);
  });

  it("returns a fresh copy of the blocklist each call", () => {
    const a = defaultCaptureRules();
    a.blockedDomains.push("evil.example");
    expect(defaultCaptureRules().blockedDomains).not.toContain("evil.example");
  });

  it("covers the top UK and US personal-email providers", () => {
    const { blockedDomains } = defaultCaptureRules();
    expect(blockedDomains).toContain("gmail.com");
    expect(blockedDomains).toContain("yahoo.co.uk");
    expect(blockedDomains).toContain("btinternet.com");
    expect(blockedDomains).toContain("comcast.net");
  });
});

describe("normalizeDomain", () => {
  it("lower-cases and trims a plain domain", () => {
    expect(normalizeDomain("  GMail.Com ")).toBe("gmail.com");
  });

  it("strips protocol, www, paths and leading @", () => {
    expect(normalizeDomain("https://www.onet.pl/poczta")).toBe("onet.pl");
    expect(normalizeDomain("@wp.pl")).toBe("wp.pl");
  });

  it("rejects strings that are not domain-shaped", () => {
    expect(normalizeDomain("not a domain")).toBeNull();
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain("nodot")).toBeNull();
  });
});

describe("parseCaptureRules", () => {
  it("fills an empty blob with the safe defaults", () => {
    expect(parseCaptureRules({})).toEqual(defaultCaptureRules());
  });

  it("treats non-object input as defaults", () => {
    expect(parseCaptureRules(null)).toEqual(defaultCaptureRules());
    expect(parseCaptureRules("x")).toEqual(defaultCaptureRules());
    expect(parseCaptureRules([1])).toEqual(defaultCaptureRules());
  });

  it("keeps explicit opt-outs", () => {
    const rules = parseCaptureRules({
      businessEmailsOnly: false,
      blockDuplicates: false,
      consentRequired: false,
    });
    expect(rules.businessEmailsOnly).toBe(false);
    expect(rules.blockDuplicates).toBe(false);
    expect(rules.consentRequired).toBe(false);
  });

  it("normalizes and filters a stored blocklist", () => {
    const rules = parseCaptureRules({
      blockedDomains: ["  GMAIL.COM", "https://onet.pl", "junk value", 42],
    });
    expect(rules.blockedDomains).toEqual(["gmail.com", "onet.pl"]);
  });

  it("falls back to the default consent text when blank", () => {
    expect(parseCaptureRules({ consentText: "   " }).consentText).toBe(
      DEFAULT_CONSENT_TEXT
    );
    expect(parseCaptureRules({ consentText: "Custom copy" }).consentText).toBe(
      "Custom copy"
    );
  });
});

describe("isEmailBlocked", () => {
  const rules = defaultCaptureRules();

  it("blocks free-mail domains when the rule is on", () => {
    expect(isEmailBlocked("anna@gmail.com", rules)).toBe(true);
    expect(isEmailBlocked("dave@btinternet.com", rules)).toBe(true);
  });

  it("allows business domains", () => {
    expect(isEmailBlocked("marta@adyen.com", rules)).toBe(false);
  });

  it("blocks malformed emails with no domain", () => {
    expect(isEmailBlocked("no-at-sign", rules)).toBe(true);
  });

  it("allows everything when the rule is off", () => {
    const open = { ...rules, businessEmailsOnly: false };
    expect(isEmailBlocked("anna@gmail.com", open)).toBe(false);
  });
});
