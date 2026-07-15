/**
 * Tests for the stage advancement schema used by `advanceStage`.
 */

import { describe, it, expect } from "vitest";
import { advanceStageSchema } from "./stages";

describe("advanceStageSchema", () => {
  it("accepts a UUID-shaped event id", () => {
    expect(() =>
      advanceStageSchema.parse({
        eventId: "e1111111-1111-1111-1111-111111111111",
      })
    ).not.toThrow();
  });

  it("rejects a short non-UUID event id", () => {
    expect(() => advanceStageSchema.parse({ eventId: "evt-1" })).toThrow(
      /Invalid event ID/
    );
  });

  it("rejects a missing event id", () => {
    expect(() => advanceStageSchema.parse({})).toThrow();
  });
});
