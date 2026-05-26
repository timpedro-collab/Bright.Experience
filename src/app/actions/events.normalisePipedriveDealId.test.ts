/**
 * Tests for `normalisePipedriveDealId` — the helper that turns either a
 * bare Pipedrive deal ID or a Pipedrive deal URL into the numeric ID we
 * store on the event. Coverage matters because the event-creation form
 * accepts both shapes.
 */

import { describe, it, expect } from "vitest";
import { normalisePipedriveDealId } from "./events";

describe("normalisePipedriveDealId", () => {
  it("returns null for undefined input", () => {
    expect(normalisePipedriveDealId(undefined)).toBeNull();
  });

  it("returns null for empty/whitespace input", () => {
    expect(normalisePipedriveDealId("")).toBeNull();
    expect(normalisePipedriveDealId("   ")).toBeNull();
  });

  it("returns the trimmed numeric ID for a bare ID", () => {
    expect(normalisePipedriveDealId("12345")).toBe("12345");
    expect(normalisePipedriveDealId("  12345  ")).toBe("12345");
  });

  it("extracts the trailing numeric segment from a full Pipedrive URL", () => {
    expect(
      normalisePipedriveDealId(
        "https://brightblue.pipedrive.com/deal/12345"
      )
    ).toBe("12345");
  });

  it("strips a trailing slash from URLs", () => {
    expect(
      normalisePipedriveDealId(
        "https://brightblue.pipedrive.com/deal/12345/"
      )
    ).toBe("12345");
  });

  it("returns null when there is no numeric segment", () => {
    expect(normalisePipedriveDealId("https://brightblue.pipedrive.com/deal/abc")).toBeNull();
  });

  it("extracts the *last* numeric segment of a multi-number URL", () => {
    expect(
      normalisePipedriveDealId(
        "https://brightblue.pipedrive.com/pipeline/123/deal/9876"
      )
    ).toBe("9876");
  });
});
