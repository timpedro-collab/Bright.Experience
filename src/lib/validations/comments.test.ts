/**
 * Tests for the comment schemas used by `addComment` / `deleteComment`.
 */

import { describe, it, expect } from "vitest";
import {
  addCommentSchema,
  deleteCommentSchema,
  MAX_COMMENT_LENGTH,
} from "./comments";

const validComment = {
  eventId: "e1111111-1111-1111-1111-111111111111",
  assetId: "a1111111-1111-1111-1111-111111111111",
  body: "Love the energy here.",
};

describe("addCommentSchema", () => {
  it("accepts a top-level comment without a parent", () => {
    expect(() => addCommentSchema.parse(validComment)).not.toThrow();
  });

  it("accepts a threaded reply with a parent comment id", () => {
    expect(() =>
      addCommentSchema.parse({
        ...validComment,
        parentId: "cc000000-0000-4000-8000-000000000001",
      })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      addCommentSchema.parse({ ...validComment, eventId: "e1" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects a malformed asset id", () => {
    expect(() =>
      addCommentSchema.parse({ ...validComment, assetId: "a1" })
    ).toThrow(/Invalid asset ID/);
  });

  it("rejects a malformed parent comment id", () => {
    expect(() =>
      addCommentSchema.parse({ ...validComment, parentId: "c1" })
    ).toThrow(/Invalid parent comment ID/);
  });

  it("rejects an empty body", () => {
    expect(() => addCommentSchema.parse({ ...validComment, body: "" })).toThrow(
      /required/
    );
  });

  it("rejects a body over the length cap", () => {
    expect(() =>
      addCommentSchema.parse({
        ...validComment,
        body: "x".repeat(MAX_COMMENT_LENGTH + 1),
      })
    ).toThrow(new RegExp(`under ${MAX_COMMENT_LENGTH}`));
  });
});

describe("deleteCommentSchema", () => {
  it("accepts a UUID-shaped comment id", () => {
    expect(() =>
      deleteCommentSchema.parse({
        commentId: "cc000000-0000-4000-8000-000000000001",
      })
    ).not.toThrow();
  });

  it("rejects a malformed comment id", () => {
    expect(() => deleteCommentSchema.parse({ commentId: "c1" })).toThrow(
      /Invalid comment ID/
    );
  });
});
