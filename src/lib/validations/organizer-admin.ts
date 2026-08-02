/**
 * Zod schemas for internal organizer setup — creating the organizer, giving
 * their team access, and putting shows and hardware under them.
 */
import { z } from "zod";
import { uuidLike } from "./id";

/** Roles an organizer's own people can hold in their portal. */
const ORGANIZER_USER_ROLES = ["partner_admin", "partner_member"] as const;
export type OrganizerUserRole = (typeof ORGANIZER_USER_ROLES)[number];

/** Input for `createOrganizerPartner`. */
export const createOrganizerPartnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organizer name is required")
    .max(200, "Organizer name is too long"),
  contactName: z.string().trim().max(200, "Contact name is too long").optional(),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid contact email")
    .max(320, "Email is too long")
    .optional()
    .or(z.literal("")),
});

/** Input for `inviteOrganizerUser`. */
export const inviteOrganizerUserSchema = z.object({
  partnerId: uuidLike("Invalid organizer ID"),
  email: z.string().trim().email("Enter a valid email address").max(320),
  role: z.enum(ORGANIZER_USER_ROLES),
});

/** Input for `linkShowToOrganizer`. */
export const linkShowToOrganizerSchema = z.object({
  eventId: uuidLike("Invalid show ID"),
  partnerId: uuidLike("Invalid organizer ID"),
});

/** Input for `unlinkShowFromOrganizer`. */
export const unlinkShowFromOrganizerSchema = z.object({
  eventId: uuidLike("Invalid show ID"),
});

/**
 * Input for `createMachineInstance`. The serial is the physical label on the
 * unit, so it's normalised to upper case here and unique in the database.
 */
export const createMachineInstanceSchema = z.object({
  machineTypeId: uuidLike("Choose a machine type"),
  serialNumber: z
    .string()
    .trim()
    .min(3, "Serial number is required")
    .max(60, "Serial number is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Serials use letters, numbers, and hyphens only"),
  nickname: z.string().trim().max(120, "Nickname is too long").optional(),
  /** Optionally deploy it to a show in the same step. */
  eventId: uuidLike("Invalid show ID").optional(),
});

/** Input for `assignMachineToShow`. */
export const assignMachineToShowSchema = z.object({
  machineInstanceId: uuidLike("Invalid machine ID"),
  eventId: uuidLike("Invalid show ID"),
});

/** Input for `releaseMachineFromShow`. */
export const releaseMachineFromShowSchema = z.object({
  machineInstanceId: uuidLike("Invalid machine ID"),
});
