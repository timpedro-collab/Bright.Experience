/** Pure lead email classification and dedupe helpers — no network I/O. */

/** Well-known disposable inbox domains (lowercase). Inspectable for tests and ops. */
export const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "discard.email",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "harakirimail.com",
  "jetable.org",
  "mailcatch.com",
  "maildrop.cc",
  "mailexpire.com",
  "mailinator.com",
  "mailmoat.com",
  "mailnesia.com",
  "mailnull.com",
  "mintemail.com",
  "mohmal.com",
  "mytemp.email",
  "mytrashmail.com",
  "nowmymail.com",
  "pookmail.com",
  "proxymail.eu",
  "rcpt.at",
  "sharklasers.com",
  "spambox.us",
  "spamfree24.org",
  "spamgourmet.com",
  "spammotel.com",
  "temp-mail.org",
  "tempail.com",
  "tempinbox.com",
  "tempmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "trashymail.com",
  "wegwerfmail.de",
  "yopmail.com",
]);

/** Pragmatic RFC-lite: one @, non-empty local, domain with dot + 2+ char TLD, no spaces. */
const EMAIL_SYNTAX_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface LeadQualityAssessment {
  emailStatus: "verified" | "disposable" | "invalid";
  isRepeatPlayer: boolean;
}

/** Syntax + disposable-domain screen. No network calls — deliverability probes are a paid-API upgrade later. */
export function classifyEmail(email: string): "verified" | "disposable" | "invalid" {
  const trimmed = email.trim();
  if (!trimmed || /\s/.test(trimmed) || !EMAIL_SYNTAX_REGEX.test(trimmed)) {
    return "invalid";
  }

  const domain = trimmed.slice(trimmed.lastIndexOf("@") + 1).toLowerCase();
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return "disposable";
  }

  return "verified";
}

/** Normalise for dedupe: trim, lower-case, strip gmail dots and +tags (gmail/googlemail only). */
export function normaliseEmailForDedupe(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1) return trimmed;

  let local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plusIndex = local.indexOf("+");
    if (plusIndex !== -1) {
      local = local.slice(0, plusIndex);
    }
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

/** Classify email quality and flag repeat players against emails already captured at the event. */
export function assessLead(
  email: string,
  existingEmails: Set<string>,
): LeadQualityAssessment {
  const emailStatus = classifyEmail(email);
  const isRepeatPlayer = existingEmails.has(normaliseEmailForDedupe(email));
  return { emailStatus, isRepeatPlayer };
}
