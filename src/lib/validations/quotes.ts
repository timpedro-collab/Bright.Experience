/** Zod schemas for quoting engine validation */
import { z } from "zod";

export const bookNowSchema = z.object({
  packageId: z.string().uuid("Package selection is required"),
  machineId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  venueName: z.string().optional(),
  locationPostcode: z.string().optional(),
  datesStart: z.string().min(1, "Start date is required"),
  datesEnd: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
  specialRequirements: z.string().optional(),
});

export type BookNowInput = z.infer<typeof bookNowSchema>;

export const proposalIntakeSchema = z.object({
  eventType: z.string().min(1, "Event type is required"),
  locationPostcode: z.string().min(1, "Location postcode is required"),
  locationName: z.string().optional(),
  venueName: z.string().optional(),
  datesStart: z.string().min(1, "Start date is required"),
  datesEnd: z.string().optional(),
  durationDays: z.number().int().positive().optional(),
  footfallEstimate: z.number().int().positive().optional(),
  objective: z.string().optional(),
  machineId: z.string().uuid().optional(),
  gameId: z.string().uuid().optional(),
  creativeNeeds: z.string().optional(),
  engagementScope: z.string().optional(),
  specialRequirements: z.string().optional(),
  briefChallenge: z.string().optional(),
  briefSuccess: z.string().optional(),
  qualifyingQuestions: z.string().optional(),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
});

export type ProposalIntakeInput = z.infer<typeof proposalIntakeSchema>;
