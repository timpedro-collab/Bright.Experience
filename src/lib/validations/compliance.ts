/** Zod schemas for compliance document vault actions */
import { z } from "zod";
import { uuidLike } from "./id";
import { DOC_TYPE_LABELS, type ComplianceDocType } from "@/types/compliance";

/** Longest reviewer note / free-text value we accept. */
export const MAX_NOTES_LENGTH = 5000;

// Derived from DOC_TYPE_LABELS so the schema can never drift from the
// ComplianceDocType union in src/types/compliance.ts.
const DOC_TYPES = Object.keys(DOC_TYPE_LABELS) as [
  ComplianceDocType,
  ...ComplianceDocType[],
];

/** Structured input for `createComplianceRequirement`. */
export const createComplianceRequirementSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  documentType: z.enum(DOC_TYPES),
  title: z.string().min(1, "Title is required"),
  requiredMinimum: z.string().optional(),
  expiresAt: z.string().optional(),
});

/** Structured input for `uploadComplianceDocument` (ids from the form data). */
export const uploadComplianceDocumentSchema = z.object({
  docId: uuidLike("Invalid document ID"),
  eventId: uuidLike("Invalid event ID"),
  currentValue: z.string().nullable(),
});

/** Structured input for `reviewComplianceDocument`. */
export const reviewComplianceDocumentSchema = z.object({
  docId: uuidLike("Invalid document ID"),
  eventId: uuidLike("Invalid event ID"),
  decision: z.enum(["approved", "rejected"]),
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be under ${MAX_NOTES_LENGTH} characters`)
    .optional(),
});

/** Structured input for `seedComplianceFromAccount`. */
export const seedComplianceSchema = z.object({
  eventId: uuidLike("Invalid event ID"),
  accountId: uuidLike("Invalid account ID"),
});

export type CreateComplianceRequirementInput = z.infer<
  typeof createComplianceRequirementSchema
>;
export type UploadComplianceDocumentInput = z.infer<
  typeof uploadComplianceDocumentSchema
>;
export type ReviewComplianceDocumentInput = z.infer<
  typeof reviewComplianceDocumentSchema
>;
export type SeedComplianceInput = z.infer<typeof seedComplianceSchema>;
