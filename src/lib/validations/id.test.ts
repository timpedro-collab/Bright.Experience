/**
 * Tests for the shared uuid-shaped id validator — must accept both real
 * RFC-4122 uuids and the hand-crafted seeded/demo ids.
 */

import { describe, it, expect } from "vitest";
import { uuidLike } from "./id";

const schema = uuidLike("Invalid ID");

describe("uuidLike", () => {
  it("accepts a real RFC-4122 uuid", () => {
    expect(() => schema.parse("6f9619ff-8b86-4d01-b42d-00c04fc964ff")).not.toThrow();
  });

  it("accepts hand-crafted seeded ids with non-compliant variant nibbles", () => {
    expect(() => schema.parse("e1111111-1111-1111-1111-111111111111")).not.toThrow();
    expect(() => schema.parse("ab111111-1111-1111-1111-111111111111")).not.toThrow();
  });

  it("rejects non-uuid-shaped strings with the given message", () => {
    for (const bad of ["evt-1", "", "e1111111", "not a uuid at all"]) {
      expect(() => schema.parse(bad)).toThrow(/Invalid ID/);
    }
  });
});
