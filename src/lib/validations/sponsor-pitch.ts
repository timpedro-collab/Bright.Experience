/** Zod schema for the public sponsor-pitch conversion form. */
import { z } from "zod";

/**
 * What a sponsor sends back from their private pitch link.
 *
 * The token is the credential and is validated server-side; everything else
 * here is untrusted text from an unauthenticated page, so it is length-capped
 * before it reaches the database or an email body.
 */
export const sponsorInterestSchema = z.object({
  token: z.string().min(20, "That link is no longer valid"),
  contactName: z
    .string()
    .trim()
    .min(2, "Tell us who to reply to")
    .max(120, "Keep the name under 120 characters"),
  email: z
    .string()
    .trim()
    .email("Enter an email we can reply to")
    .max(320),
  company: z
    .string()
    .trim()
    .max(160, "Keep the company name under 160 characters")
    .optional(),
  message: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1000 characters")
    .optional(),
});

export type SponsorInterestInput = z.infer<typeof sponsorInterestSchema>;

/**
 * The light identity capture that unlocks the pitch page's detailed numbers.
 * Deliberately smaller than the interest form — viewing stays nearly free.
 */
export const pitchUnlockSchema = z.object({
  token: z.string().min(20, "That link is no longer valid"),
  contactName: z
    .string()
    .trim()
    .min(2, "Tell us who's reading")
    .max(120, "Keep the name under 120 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a work email")
    .max(320),
  company: z
    .string()
    .trim()
    .max(160, "Keep the company name under 160 characters")
    .optional(),
});

export type PitchUnlockInput = z.infer<typeof pitchUnlockSchema>;
