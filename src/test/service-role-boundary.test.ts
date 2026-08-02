/**
 * Architecture guard: no ungated service-role Server Action.
 *
 * Every exported async function in a `"use server"` module is a public RPC
 * endpoint that anyone can POST to, with or without a session. Combining that
 * with the service-role client — which bypasses RLS entirely — is how the audit
 * found unauthenticated tenant takeover, event provisioning and bulk lead
 * export. Privileged bodies belong in `src/server/**`, which carries no
 * directive and is therefore unreachable from the network.
 *
 * This test fails when a new action file reaches for the service role without an
 * authorisation call, so the fix cannot silently regress.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ACTIONS_DIR = join(process.cwd(), "src/app/actions");

/** Any of these proves the action authorises before using the privileged client. */
const GATE_PATTERNS = [
  "requireInternalUser",
  "requireOrganizerForShow",
  "requireVenueManagerForSlot",
  "requirePartner",
  "ensureInternal",
  "getUser()",
  "auth.getUser()",
];

/**
 * Actions that are deliberately reachable without a session. Each entry must
 * say why it is safe, and what stops it being abused.
 */
const PUBLIC_BY_DESIGN: Record<string, string> = {
  "quotes/book-now.ts":
    "Public funnel: submitBookNowQuote is rate-limited and only writes a quote; " +
    "getBookingReceipt requires the quote UUID and returns receipt-safe fields only.",
  "sponsor-pitch.ts":
    "Sponsor pitch link: the caller is an anonymous sponsor holding a capability " +
    "token, re-validated server-side (match + expiry) before any write. " +
    "Rate-limited by IP, and only ever moves the one resolved slot to reserved.",
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    if (!full.endsWith(".ts") || full.includes(".test.")) return [];
    return [full];
  });
}

describe("service-role boundary", () => {
  const offenders: string[] = [];
  const declaredPublic = new Set(Object.keys(PUBLIC_BY_DESIGN));
  const seenPublic = new Set<string>();
  let privilegedActionFiles = 0;

  for (const file of walk(ACTIONS_DIR)) {
    const source = readFileSync(file, "utf8");
    const relative = file.slice(file.indexOf("src/app/actions/") + 16);

    const isServerAction = /^\s*(\/\*[\s\S]*?\*\/\s*)?"use server";/.test(source);
    if (!isServerAction) continue;
    if (!source.includes("getServiceRoleClient")) continue;
    privilegedActionFiles += 1;

    if (declaredPublic.has(relative)) {
      seenPublic.add(relative);
      continue;
    }
    if (!GATE_PATTERNS.some((gate) => source.includes(gate))) {
      offenders.push(relative);
    }
  }

  it("no Server Action uses the service role without authorising the caller", () => {
    expect(offenders).toEqual([]);
  });

  it("actually inspected the action files", () => {
    // Without this the suite would pass vacuously if the directive regex or the
    // directory layout ever changed.
    expect(privilegedActionFiles).toBeGreaterThan(5);
  });

  it("keeps the public-by-design allowlist honest", () => {
    // A stale entry means the file moved or was gated; drop it rather than
    // leaving a standing exemption nobody re-reads.
    expect([...declaredPublic].filter((f) => !seenPublic.has(f))).toEqual([]);
  });

  it("keeps privileged internals out of the action surface", () => {
    const serverDir = join(process.cwd(), "src/server");
    for (const file of walk(serverDir)) {
      const source = readFileSync(file, "utf8");
      expect(
        /^\s*(\/\*[\s\S]*?\*\/\s*)?"use server";/.test(source),
        `${file} must not be a Server Action module`
      ).toBe(false);
      expect(
        source.includes('import "server-only"'),
        `${file} must carry the server-only marker`
      ).toBe(true);
    }
  });
});
