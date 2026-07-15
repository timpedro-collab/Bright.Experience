/** Zod schemas for user profile updates */
import { z } from "zod";

/** Structured input for `updateProfileName`. */
export const profileNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
});

export type ProfileNameInput = z.infer<typeof profileNameSchema>;
