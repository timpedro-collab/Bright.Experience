/**
 * Tests for the compliance vault schemas used by the compliance actions.
 */

import { describe, it, expect } from "vitest";
import {
  createComplianceRequirementSchema,
  uploadComplianceDocumentSchema,
  reviewComplianceDocumentSchema,
  seedComplianceSchema,
  MAX_NOTES_LENGTH,
} from "./compliance";

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const DOC_ID = "cd000000-0000-4000-8000-000000000001";
const ACCOUNT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("createComplianceRequirementSchema", () => {
  const valid = {
    eventId: EVENT_ID,
    documentType: "insurance_pl" as const,
    title: "Public Liability Insurance",
  };

  it("accepts a requirement with only the mandatory fields", () => {
    expect(() => createComplianceRequirementSchema.parse(valid)).not.toThrow();
  });

  it("accepts optional minimum and expiry", () => {
    expect(() =>
      createComplianceRequirementSchema.parse({
        ...valid,
        requiredMinimum: "£5m",
        expiresAt: "2027-01-01",
      })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      createComplianceRequirementSchema.parse({ ...valid, eventId: "evt-1" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects an unknown document type", () => {
    expect(() =>
      createComplianceRequirementSchema.parse({
        ...valid,
        documentType: "passport",
      })
    ).toThrow();
  });

  it("rejects an empty title", () => {
    expect(() =>
      createComplianceRequirementSchema.parse({ ...valid, title: "" })
    ).toThrow(/Title is required/);
  });
});

describe("uploadComplianceDocumentSchema", () => {
  it("accepts UUID-shaped ids with a null current value", () => {
    expect(() =>
      uploadComplianceDocumentSchema.parse({
        docId: DOC_ID,
        eventId: EVENT_ID,
        currentValue: null,
      })
    ).not.toThrow();
  });

  it("accepts a supplied current value", () => {
    expect(() =>
      uploadComplianceDocumentSchema.parse({
        docId: DOC_ID,
        eventId: EVENT_ID,
        currentValue: "£10m",
      })
    ).not.toThrow();
  });

  it("rejects a malformed document id", () => {
    expect(() =>
      uploadComplianceDocumentSchema.parse({
        docId: "d1",
        eventId: EVENT_ID,
        currentValue: null,
      })
    ).toThrow(/Invalid document ID/);
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      uploadComplianceDocumentSchema.parse({
        docId: DOC_ID,
        eventId: "e1",
        currentValue: null,
      })
    ).toThrow(/Invalid event ID/);
  });
});

describe("reviewComplianceDocumentSchema", () => {
  const valid = {
    docId: DOC_ID,
    eventId: EVENT_ID,
    decision: "approved" as const,
  };

  it("accepts an approval without notes", () => {
    expect(() => reviewComplianceDocumentSchema.parse(valid)).not.toThrow();
  });

  it("accepts a rejection with notes", () => {
    expect(() =>
      reviewComplianceDocumentSchema.parse({
        ...valid,
        decision: "rejected",
        notes: "Cover level is below the required minimum.",
      })
    ).not.toThrow();
  });

  it("rejects an unknown decision", () => {
    expect(() =>
      reviewComplianceDocumentSchema.parse({ ...valid, decision: "maybe" })
    ).toThrow();
  });

  it("rejects notes over the length cap", () => {
    expect(() =>
      reviewComplianceDocumentSchema.parse({
        ...valid,
        notes: "x".repeat(MAX_NOTES_LENGTH + 1),
      })
    ).toThrow(new RegExp(`under ${MAX_NOTES_LENGTH}`));
  });
});

describe("seedComplianceSchema", () => {
  it("accepts UUID-shaped event and account ids", () => {
    expect(() =>
      seedComplianceSchema.parse({ eventId: EVENT_ID, accountId: ACCOUNT_ID })
    ).not.toThrow();
  });

  it("rejects a malformed account id", () => {
    expect(() =>
      seedComplianceSchema.parse({ eventId: EVENT_ID, accountId: "acc-1" })
    ).toThrow(/Invalid account ID/);
  });
});
