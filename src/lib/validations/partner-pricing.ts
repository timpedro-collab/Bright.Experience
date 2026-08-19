/** Zod schemas for partner-pricing page actions. */
import { z } from "zod";

// Zero-retail bands are allowed: a hosting lever (e.g. a show-placed media
// unit) earns through the slot inventory it carries, not a line price.
const retailBandSchema = z
  .object({
    min: z.number().nonnegative("Retail min cannot be negative"),
    max: z.number().nonnegative("Retail max cannot be negative"),
    suggested: z.number().nonnegative("Retail suggested cannot be negative"),
    step: z.number().positive("Retail step must be positive"),
  })
  .refine(
    (retail) => retail.min <= retail.suggested && retail.suggested <= retail.max,
    { message: "Retail suggested must sit between min and max" },
  );

const dealLeverSchema = z.object({
  key: z.string().min(1, "Lever key is required"),
  label: z.string().min(1, "Lever label is required"),
  // Zero is legal for slot-inventory levers, which deploy no machines.
  unitsPerItem: z
    .number()
    .int()
    .nonnegative("Units per item cannot be negative"),
  maxItems: z
    .number()
    .int()
    .positive("Max items must be a positive integer")
    .optional(),
  note: z.string().max(400, "Lever note is too long").optional(),
  slotSource: z
    .object({
      slotsPerUnit: z
        .number()
        .int()
        .positive("Slots per unit must be a positive integer"),
      sourceLevers: z
        .array(z.string().min(1))
        .min(1, "Slot source needs at least one source lever"),
    })
    .optional(),
  retail: retailBandSchema,
});

const dealFloorTierSchema = z.object({
  label: z.string().min(1, "Floor tier label is required"),
  minUnits: z
    .number()
    .int()
    .positive("Floor tier min units must be a positive integer"),
  maxUnits: z
    .number()
    .int()
    .positive("Floor tier max units must be a positive integer"),
  floor: z.number().positive("Floor must be positive"),
});

/** Mirrors `DealConfig` in `@/lib/deal-config`. */
export const dealConfigSchema = z.object({
  currency: z.enum(["USD", "GBP"]),
  split: z.object({
    brightBlue: z.number().min(0).max(1),
    partner: z.number().min(0).max(1),
  }),
  commitment: z.object({
    pilotMinUnits: z
      .number()
      .int()
      .positive("Pilot min units must be a positive integer"),
    pilotMaxUnits: z
      .number()
      .int()
      .positive("Pilot max units must be a positive integer"),
    maxUnits: z
      .number()
      .int()
      .positive("Max units must be a positive integer"),
    cutoffWeeks: z
      .number()
      .int()
      .positive("Cutoff weeks must be a positive integer"),
  }),
  levers: z.array(dealLeverSchema).min(1, "At least one lever is required"),
  floorTiers: z
    .array(dealFloorTierSchema)
    .min(1, "At least one floor tier is required"),
});

/** Input for `createPartnerPricingPage`. */
export const createPartnerPricingPageSchema = z.object({
  partnerName: z
    .string()
    .min(1, "Partner name is required")
    .max(120, "Partner name is too long"),
  showLabel: z
    .string()
    .min(1, "Show label is required")
    .max(160, "Show label is too long"),
  config: dealConfigSchema,
});

export type CreatePartnerPricingPageInput = z.infer<
  typeof createPartnerPricingPageSchema
>;
