/**
 * Tests for the command-palette recents store — a small localStorage list
 * that must dedupe by destination, stay capped, and never throw.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getPaletteRecents, pushPaletteRecent } from "./palette-recents";

beforeEach(() => {
  window.localStorage.clear();
});

describe("palette recents", () => {
  it("returns an empty list when nothing has been recorded", () => {
    expect(getPaletteRecents()).toEqual([]);
  });

  it("records entries most-recent-first", () => {
    pushPaletteRecent({ href: "/a", label: "A" });
    pushPaletteRecent({ href: "/b", label: "B" });
    expect(getPaletteRecents().map((e) => e.href)).toEqual(["/b", "/a"]);
  });

  it("dedupes by href, moving a revisit to the front", () => {
    pushPaletteRecent({ href: "/a", label: "A" });
    pushPaletteRecent({ href: "/b", label: "B" });
    pushPaletteRecent({ href: "/a", label: "A again" });
    const recents = getPaletteRecents();
    expect(recents.map((e) => e.href)).toEqual(["/a", "/b"]);
    expect(recents[0].label).toBe("A again");
  });

  it("keeps only the newest five entries", () => {
    for (let i = 1; i <= 7; i++) {
      pushPaletteRecent({ href: `/p${i}`, label: `P${i}` });
    }
    const recents = getPaletteRecents();
    expect(recents).toHaveLength(5);
    expect(recents[0].href).toBe("/p7");
    expect(recents[4].href).toBe("/p3");
  });

  it("survives corrupt storage without throwing", () => {
    window.localStorage.setItem("bright:palette-recents", "{not json");
    expect(getPaletteRecents()).toEqual([]);
    window.localStorage.setItem(
      "bright:palette-recents",
      JSON.stringify([{ href: "/ok", label: "OK" }, { junk: true }, 42])
    );
    expect(getPaletteRecents()).toEqual([{ href: "/ok", label: "OK" }]);
  });
});
