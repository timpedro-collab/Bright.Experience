import { describe, it, expect } from "vitest";

import { firstRelated } from "./embed";

describe("firstRelated", () => {
  it("returns the row when the embed came back as an object", () => {
    expect(firstRelated({ id: "v1" })).toEqual({ id: "v1" });
  });

  it("returns the first row when the embed came back as an array", () => {
    expect(firstRelated([{ id: "v1" }, { id: "v2" }])).toEqual({ id: "v1" });
  });

  it("returns null for an empty array", () => {
    expect(firstRelated([])).toBeNull();
  });

  it("returns null for a missing relationship", () => {
    expect(firstRelated(null)).toBeNull();
    expect(firstRelated(undefined)).toBeNull();
  });
});
