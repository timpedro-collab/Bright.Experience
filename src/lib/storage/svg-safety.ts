/**
 * Content screen for uploaded SVGs.
 *
 * An SVG is a document, not a picture: it can carry `<script>`, inline event
 * handlers, remote `<use>` references and XML entities. Customers legitimately
 * send SVG logos for the machine wrap, so refusing the format outright would
 * push real work back onto email — instead an upload that contains anything
 * active is rejected with a reason the customer can act on.
 *
 * This is deliberately a detector, not a sanitiser. Rewriting attacker-supplied
 * XML correctly is a library-sized problem, and a half-working sanitiser that
 * says "cleaned" is worse than a blunt refusal.
 *
 * Second layer: `createSignedReadUrl` signs every stored SVG with `download`,
 * so even a file that slips through this screen can't be rendered inline from
 * the storage origin.
 */

/** Verdict for one candidate file. */
export interface SvgInspection {
  /** True when the file is safe to store. */
  ok: boolean;
  /** Customer-facing explanation when it isn't. */
  reason?: string;
}

/** Matched against the decoded markup. First hit wins, so order by clarity. */
const UNSAFE_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /<\s*script/i,
    reason:
      "This SVG contains a script block. Re-export it from your design tool without scripting, or send a PNG.",
  },
  {
    pattern: /<\s*(foreignobject|iframe|embed|object)\b/i,
    reason:
      "This SVG embeds external content. Re-export it as a flat vector, or send a PNG.",
  },
  {
    // Any `on…=` attribute: onload, onclick, onmouseover, onbegin.
    pattern: /\son[a-z]+\s*=/i,
    reason:
      "This SVG contains interactive event handlers. Re-export it without interactivity, or send a PNG.",
  },
  {
    pattern: /javascript\s*:/i,
    reason:
      "This SVG contains a javascript: link. Re-export it without links, or send a PNG.",
  },
  {
    // Remote references phone home when the logo is rendered, and are the usual
    // shape of an SVG that pulls its payload in later.
    pattern: /(xlink:)?href\s*=\s*["']\s*https?:/i,
    reason:
      "This SVG links out to a remote file. Embed the artwork in the file itself, or send a PNG.",
  },
  {
    pattern: /<!ENTITY/i,
    reason:
      "This SVG declares XML entities, which we don't accept. Re-export it from your design tool, or send a PNG.",
  },
];

/** True when this upload should be screened as SVG markup. */
export function isSvgUpload(mime: string | undefined, filename: string): boolean {
  return (
    mime === "image/svg+xml" ||
    /\.svgz?$/i.test(filename.split(/[?#]/)[0] ?? "")
  );
}

/**
 * Screen SVG bytes for active content.
 *
 * Compressed SVGs (`.svgz`) are refused rather than inflated: nothing in the
 * product needs them, and inflating attacker-supplied gzip to inspect it is a
 * decompression-bomb invitation.
 */
export function inspectSvg(bytes: Uint8Array): SvgInspection {
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return {
      ok: false,
      reason:
        "This is a compressed SVG (.svgz), which we can't check. Save it as a plain .svg and upload again.",
    };
  }

  const markup = new TextDecoder("utf-8").decode(bytes);
  const hit = UNSAFE_PATTERNS.find(({ pattern }) => pattern.test(markup));
  return hit ? { ok: false, reason: hit.reason } : { ok: true };
}
