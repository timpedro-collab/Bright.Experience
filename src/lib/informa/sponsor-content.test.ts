/**
 * Show-config templating: bad links degrade to the Tampa defaults, good
 * links round-trip through the shareable query string.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_SHOW,
  parseShowConfig,
  showConfigQuery,
} from "./sponsor-content";

describe("parseShowConfig", () => {
  it("falls back to the Tampa defaults on an empty link", () => {
    expect(parseShowConfig({})).toEqual(DEFAULT_SHOW);
  });

  it("reads a fully templated show link", () => {
    expect(
      parseShowConfig({
        show: "World of Concrete",
        dates: "January 20 to 22, 2027",
        attendees: "48000",
        days: "3",
      })
    ).toEqual({
      show: "World of Concrete",
      dates: "January 20 to 22, 2027",
      attendees: 48_000,
      days: 3,
    });
  });

  it("clamps out-of-range numbers into the configurator's lever range", () => {
    const config = parseShowConfig({ attendees: "999999", days: "45" });
    expect(config.attendees).toBe(60_000);
    expect(config.days).toBe(6);
  });

  it("ignores junk values instead of rendering a broken deck", () => {
    const config = parseShowConfig({
      show: "   ",
      attendees: "not-a-number",
      days: ["2", "9"],
    });
    expect(config.show).toBe(DEFAULT_SHOW.show);
    expect(config.attendees).toBe(DEFAULT_SHOW.attendees);
    expect(config.days).toBe(2);
  });

  it("round-trips through the shareable query string", () => {
    const config = {
      show: "SupplySide West",
      dates: "October 27 to 30, 2026",
      attendees: 20_000,
      days: 4,
    };
    const parsed = parseShowConfig(
      Object.fromEntries(new URLSearchParams(showConfigQuery(config)))
    );
    expect(parsed).toEqual(config);
  });
});
