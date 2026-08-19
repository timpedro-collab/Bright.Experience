import { describe, expect, it } from "vitest";

import { deckBackHref } from "./deck-link";

describe("deckBackHref", () => {
  it("returns to the exact slide the reader left", () => {
    expect(deckBackHref({ slide: "8" })).toBe("/informa?slide=8");
  });

  it("falls back to the deck cover when no slide was carried over", () => {
    expect(deckBackHref({})).toBe("/informa");
    expect(deckBackHref({ other: "x" })).toBe("/informa");
  });

  it("ignores tampered or non-numeric slide values", () => {
    expect(deckBackHref({ slide: "javascript:alert(1)" })).toBe("/informa");
    expect(deckBackHref({ slide: "-3" })).toBe("/informa");
    expect(deckBackHref({ slide: "8.5" })).toBe("/informa");
    expect(deckBackHref({ slide: "9999" })).toBe("/informa");
  });

  it("takes the first value when the param arrives as an array", () => {
    expect(deckBackHref({ slide: ["7", "2"] })).toBe("/informa?slide=7");
  });
});
