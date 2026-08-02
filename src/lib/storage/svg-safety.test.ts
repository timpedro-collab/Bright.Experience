/**
 * Tests for the SVG upload screen.
 *
 * The point of the module is that a real brand logo goes through and anything
 * active does not, so both halves are pinned: an Illustrator-style export is
 * accepted, every known way of hiding script in SVG is refused.
 */
import { describe, it, expect } from "vitest";

import { isSvgUpload, inspectSvg } from "./svg-safety";

/** Encode markup the way an upload arrives — raw bytes. */
function bytes(markup: string): Uint8Array {
  return new TextEncoder().encode(markup);
}

const CLEAN_LOGO = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
  <title>Acme Drinks</title>
  <path d="M10 10 H 90 V 70 H 10 Z" fill="#0033A0"/>
  <image xlink:href="data:image/png;base64,iVBORw0KGgo=" width="20" height="20"/>
</svg>`;

describe("isSvgUpload", () => {
  it("recognises an SVG by its content type", () => {
    expect(isSvgUpload("image/svg+xml", "logo")).toBe(true);
  });

  it("recognises one by extension when the browser sent no type", () => {
    expect(isSvgUpload(undefined, "acme-logo.SVG")).toBe(true);
    expect(isSvgUpload("", "acme-logo.svgz")).toBe(true);
  });

  it("leaves other uploads alone", () => {
    expect(isSvgUpload("image/png", "hero.png")).toBe(false);
    expect(isSvgUpload("application/pdf", "brand-guidelines.pdf")).toBe(false);
  });
});

describe("inspectSvg", () => {
  it("accepts a real logo export, including an embedded data-URI image", () => {
    expect(inspectSvg(bytes(CLEAN_LOGO))).toEqual({ ok: true });
  });

  it("refuses a script block", () => {
    const result = inspectSvg(
      bytes(`<svg xmlns="http://www.w3.org/2000/svg"><script>fetch('/x')</script></svg>`)
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/script/i);
  });

  it("refuses a script block hidden by whitespace", () => {
    expect(
      inspectSvg(bytes(`<svg><  script >alert(1)</script></svg>`)).ok
    ).toBe(false);
  });

  it("refuses an inline event handler", () => {
    const result = inspectSvg(bytes(`<svg onload="alert(1)"><path d="M0 0"/></svg>`));

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/event handler/i);
  });

  it("refuses an event handler on a nested element", () => {
    expect(
      inspectSvg(bytes(`<svg><rect width="1" height="1" onmouseover="alert(1)"/></svg>`))
        .ok
    ).toBe(false);
  });

  it("refuses embedded HTML via foreignObject", () => {
    const result = inspectSvg(
      bytes(`<svg><foreignObject><body>hi</body></foreignObject></svg>`)
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/external content/i);
  });

  it("refuses a javascript: link", () => {
    const result = inspectSvg(bytes(`<svg><a href="javascript:alert(1)">x</a></svg>`));

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/javascript/i);
  });

  it("refuses a remote reference that would phone home", () => {
    const result = inspectSvg(
      bytes(`<svg><use xlink:href="https://evil.example/payload.svg#a"/></svg>`)
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/remote file/i);
  });

  it("keeps the xmlns declaration from tripping the remote-reference check", () => {
    expect(inspectSvg(bytes(CLEAN_LOGO)).ok).toBe(true);
  });

  it("refuses declared XML entities", () => {
    const result = inspectSvg(
      bytes(`<!DOCTYPE svg [<!ENTITY x "y">]><svg><text>&x;</text></svg>`)
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/entities/i);
  });

  it("refuses a gzipped SVG rather than inflating it", () => {
    const gzipped = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x00]);
    const result = inspectSvg(gzipped);

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/compressed/i);
  });
});
