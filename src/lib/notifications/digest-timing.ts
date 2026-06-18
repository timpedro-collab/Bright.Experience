/**
 * Per-recipient digest timing.
 *
 * The digest cron runs hourly. For each recipient we only actually send when
 * it's their chosen local hour, they're not inside their quiet-hours window,
 * and we haven't already sent them a digest in the last ~day. All of that
 * decision logic lives here as pure functions so it can be unit-tested without
 * a database or a real clock.
 */

export interface DigestTiming {
  /** IANA timezone, e.g. "Europe/London", "America/Chicago". */
  timezone: string;
  /** Local hour (0-23) the recipient wants their daily digest. */
  digestHour: number;
  /** Quiet-hours window start hour (0-23). Equal to end = no quiet hours. */
  quietStartHour: number;
  /** Quiet-hours window end hour (0-23). */
  quietEndHour: number;
  /** When we last sent this recipient a digest, or null if never. */
  lastSentAt: Date | null;
}

/** Defaults applied when a recipient has no saved timing row. */
export const DEFAULT_DIGEST_TIMING: Omit<DigestTiming, "lastSentAt"> = {
  timezone: "Europe/London",
  digestHour: 9,
  quietStartHour: 21,
  quietEndHour: 8,
};

/**
 * The recipient's local hour (0-23) for a given instant. Falls back to the
 * UTC hour if the timezone string is invalid so a bad value degrades rather
 * than throws.
 */
export function getLocalHour(now: Date, timezone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    const part = fmt.formatToParts(now).find((p) => p.type === "hour")?.value;
    const hour = Number.parseInt(part ?? "", 10);
    if (Number.isNaN(hour)) return now.getUTCHours();
    // Some runtimes format midnight as "24".
    return hour === 24 ? 0 : hour;
  } catch {
    return now.getUTCHours();
  }
}

/**
 * Is `localHour` inside the quiet window? Handles windows that wrap past
 * midnight (e.g. 21 -> 8). A zero-width window (start === end) means quiet
 * hours are disabled.
 */
export function isWithinQuietHours(
  localHour: number,
  startHour: number,
  endHour: number,
): boolean {
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return localHour >= startHour && localHour < endHour;
  }
  // Wraps past midnight.
  return localHour >= startHour || localHour < endHour;
}

/** Minimum gap before a recipient is eligible for another digest. */
const MIN_RESEND_GAP_MS = 20 * 60 * 60 * 1000;

/**
 * Should we send this recipient a digest right now? True only when it's their
 * local digest hour, they're outside quiet hours, and they haven't already
 * received one in the last ~20 hours (dedup against the hourly cron).
 */
export function shouldSendDigest(now: Date, timing: DigestTiming): boolean {
  if (timing.lastSentAt) {
    const elapsed = now.getTime() - timing.lastSentAt.getTime();
    if (elapsed < MIN_RESEND_GAP_MS) return false;
  }

  const localHour = getLocalHour(now, timing.timezone);
  if (localHour !== timing.digestHour) return false;
  if (isWithinQuietHours(localHour, timing.quietStartHour, timing.quietEndHour)) {
    return false;
  }
  return true;
}
