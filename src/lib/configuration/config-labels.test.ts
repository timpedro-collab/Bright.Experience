import { describe, it, expect } from "vitest";

import {
  PRIZE_MODES,
  CAPTURE_METHODS,
  prizeModeLabel,
  captureMethodLabel,
} from "./config-labels";

describe("config labels", () => {
  it("covers every prize mode the machine stack implements", () => {
    expect(PRIZE_MODES.map((m) => m.value)).toEqual([
      "random",
      "score_based",
      "guaranteed",
    ]);
  });

  it("covers every capture method", () => {
    expect(CAPTURE_METHODS.map((m) => m.value)).toEqual([
      "form",
      "badge_scan",
      "both",
    ]);
  });

  it("explains each option rather than restating its name", () => {
    for (const option of [...PRIZE_MODES, ...CAPTURE_METHODS]) {
      expect(option.description.length).toBeGreaterThan(40);
    }
  });

  it("labels a known mode and method", () => {
    expect(prizeModeLabel("score_based")).toBe("Score-based");
    expect(captureMethodLabel("badge_scan")).toBe("Badge scan");
  });

  it("degrades to a dash rather than rendering 'null'", () => {
    expect(prizeModeLabel(null)).toBe("—");
    expect(captureMethodLabel(undefined)).toBe("—");
  });
});
