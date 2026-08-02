/**
 * Capture-quality rules for event data capture (business-emails-only,
 * duplicate blocking, GDPR consent). The portal configures these per event;
 * the machine capture flow enforces them via the config-sync payload.
 */

/** Machine-enforced rules stored in game_configurations.capture_rules_json. */
export interface CaptureRules {
  /** Reject free/personal email domains on the capture form. */
  businessEmailsOnly: boolean;
  /** Lower-cased domains rejected when businessEmailsOnly is on. */
  blockedDomains: string[];
  /** One entry per person — repeat plays get a friendly "already played". */
  blockDuplicates: boolean;
  /** Require the GDPR consent checkbox before capturing a lead. */
  consentRequired: boolean;
  /** Consent copy shown next to the checkbox. Supports {brand} and {event}. */
  consentText: string;
}

/**
 * Starter blocklist of the most common personal email providers in the UK
 * and US (Bright.Blue's current core markets). Editable per event in the
 * configuration UI; the machine stack treats it as exact-domain matches.
 * Regional lists (e.g. Central Europe) can be layered in per event — see
 * OWNER-TODO.md.
 */
export const DEFAULT_BLOCKED_DOMAINS: string[] = [
  // Global webmail (dominant in both markets)
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "zoho.com",
  // UK variants + ISP inboxes
  "yahoo.co.uk",
  "hotmail.co.uk",
  "outlook.co.uk",
  "live.co.uk",
  "btinternet.com",
  "sky.com",
  "talktalk.net",
  "virginmedia.com",
  "ntlworld.com",
  // US ISP inboxes
  "comcast.net",
  "att.net",
  "verizon.net",
  "sbcglobal.net",
  "bellsouth.net",
  "cox.net",
];

/**
 * Default consent copy. {brand} and {event} are replaced by the machine
 * landing page at render time so one template serves every activation.
 */
export const DEFAULT_CONSENT_TEXT =
  "I agree to my details being processed by Bright.Blue as a partner of " +
  "{brand}, used only for follow-up related to {event}. See the privacy " +
  "policy for how data is handled and how long it is kept.";

/** Default retention window (days) for captured leads before auto-deletion. */
export const DEFAULT_RETENTION_DAYS = 60;

/**
 * The safe-posture defaults: every guardrail on. Marta's rule — configured
 * from the very beginning so nobody has to police the machine on the day.
 */
export function defaultCaptureRules(): CaptureRules {
  return {
    businessEmailsOnly: true,
    blockedDomains: [...DEFAULT_BLOCKED_DOMAINS],
    blockDuplicates: true,
    consentRequired: true,
    consentText: DEFAULT_CONSENT_TEXT,
  };
}

/**
 * Normalize a user-entered domain: trim, lower-case, strip protocol / "www."
 * / paths / leading "@". Returns null when nothing domain-shaped remains.
 */
export function normalizeDomain(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^@/, "")
    .split("/")[0]
    .split("?")[0];
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Parse a stored capture_rules_json blob into a complete CaptureRules,
 * filling any missing keys with the safe defaults (so rows written before
 * this feature — `{}` — behave as fully guarded).
 */
export function parseCaptureRules(raw: unknown): CaptureRules {
  const defaults = defaultCaptureRules();
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaults;
  }
  const obj = raw as Record<string, unknown>;
  const domains = Array.isArray(obj.blockedDomains)
    ? obj.blockedDomains
        .filter((d): d is string => typeof d === "string")
        .map(normalizeDomain)
        .filter((d): d is string => d !== null)
    : defaults.blockedDomains;
  return {
    businessEmailsOnly:
      typeof obj.businessEmailsOnly === "boolean"
        ? obj.businessEmailsOnly
        : defaults.businessEmailsOnly,
    blockedDomains: domains,
    blockDuplicates:
      typeof obj.blockDuplicates === "boolean"
        ? obj.blockDuplicates
        : defaults.blockDuplicates,
    consentRequired:
      typeof obj.consentRequired === "boolean"
        ? obj.consentRequired
        : defaults.consentRequired,
    consentText:
      typeof obj.consentText === "string" && obj.consentText.trim().length > 0
        ? obj.consentText
        : defaults.consentText,
  };
}

/**
 * Whether an email would be rejected under the given rules. The portal uses
 * this for previews/tests; the machine stack implements the same check at
 * the point of capture.
 */
export function isEmailBlocked(email: string, rules: CaptureRules): boolean {
  if (!rules.businessEmailsOnly) return false;
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return true;
  return rules.blockedDomains.includes(domain);
}
