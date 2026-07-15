/** Zod schemas for threaded asset comment actions */
import { z } from "zod";
import { uuidLike } from "./id";

/** Longest comment body we accept. */
export const MAX_COMMENT_LENGTH = 5000;

/** Structured input for `addComment`. */
export const addCommentSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  assetId: uuidLike("Invalid asset ID"),
  body: z
    .string()
    .min(1, "Comment body is required")
    .max(MAX_COMMENT_LENGTH, `Comments must be under ${MAX_COMMENT_LENGTH} characters`),
  parentId: uuidLike("Invalid parent comment ID").optional(),
});

/** Structured input for `deleteComment`. */
export const deleteCommentSchema = z.object({
  commentId: uuidLike("Invalid comment ID"),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
