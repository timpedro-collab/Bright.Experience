/** Zod schemas for deal-registration actions (channel protection). */
import { z } from "zod";
import { uuidLike } from "./id";

/** Input for `registerDeal` — an organizer claims a sponsor conversation. */
export const registerDealSchema = z.object({
  partnerSlug: z.string().min(1, "Missing partner"),
  eventId: uuidLike("Invalid show ID").optional(),
  sponsorCompany: z
    .string()
    .min(2, "Who is the sponsor?")
    .max(200, "Company name is too long"),
  sponsorContactName: z.string().max(200, "Contact name is too long").optional(),
  sponsorContactEmail: z
    .string()
    .email("That doesn't look like an email")
    .optional()
    .or(z.literal("")),
  /** Whole currency units from the form; stored as integer minor units. */
  estimatedValue: z.number().min(0, "Value can't be negative").optional(),
  notes: z.string().max(2000, "Keep notes under 2000 characters").optional(),
});

export type RegisterDealInput = z.infer<typeof registerDealSchema>;

/** Input for `approveDealRegistration` / `rejectDealRegistration`. */
export const reviewDealSchema = z.object({
  registrationId: uuidLike("Invalid registration ID"),
  reason: z.string().max(500, "Keep the reason under 500 characters").optional(),
});

/** Input for `pushLeadToOrganizer` — reverse registration of an inbound lead. */
export const pushLeadSchema = z.object({
  quoteId: uuidLike("Invalid quote ID"),
  partnerId: uuidLike("Invalid partner ID"),
  eventId: uuidLike("Invalid show ID").optional(),
});
