/**
 * Tests for the profile name schema used by `updateProfileName`.
 */

import { describe, it, expect } from "vitest";
import { profileNameSchema } from "./profile";

describe("profileNameSchema", () => {
  it("accepts a normal display name", () => {
    expect(() => profileNameSchema.parse({ name: "Tim Pedro" })).not.toThrow();
  });

  it("accepts a two-character name after trimming", () => {
    expect(() => profileNameSchema.parse({ name: "  Jo  " })).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() => profileNameSchema.parse({ name: "" })).toThrow(
      /at least 2 characters/
    );
  });

  it("rejects a whitespace-only name", () => {
    expect(() => profileNameSchema.parse({ name: "   " })).toThrow(
      /at least 2 characters/
    );
  });

  it("rejects a single-character name", () => {
    expect(() => profileNameSchema.parse({ name: "T" })).toThrow(
      /at least 2 characters/
    );
  });
});
