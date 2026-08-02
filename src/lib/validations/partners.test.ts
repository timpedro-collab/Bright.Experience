/**
 * Tests for the partner action schemas — application, lifecycle,
 * attribution, and commission inputs.
 */

import { describe, it, expect } from "vitest";
import {
  MAX_NOTES_LENGTH,
  addPartnerUserSchema,
  approveCommissionSchema,
  approvePartnerSchema,
  createPartnerQuoteSchema,
  markCommissionPaidSchema,
  partnerApplicationSchema,
  recordAttributionSchema,
  suspendPartnerSchema,
} from "./partners";

const PARTNER_ID = "e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0";
const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const QUOTE_ID = "22222222-2222-4222-8222-222222222220";
const ATTRIBUTION_ID = "c0000000-0000-4000-8000-000000000001";

describe("partnerApplicationSchema", () => {
  const validApplication = {
    name: "Smith Events Ltd",
    contactName: "Jane Smith",
    contactEmail: "jane@smithevents.com",
    type: "reseller",
  };

  it("accepts a minimal valid application", () => {
    expect(() => partnerApplicationSchema.parse(validApplication)).not.toThrow();
  });

  it("accepts the wizard's optional company and contact detail", () => {
    expect(() =>
      partnerApplicationSchema.parse({
        ...validApplication,
        type: "referral",
        companyName: "Smith Events Ltd",
        website: "https://smithevents.com",
        industry: "Events",
        companySize: "10-50",
        contactPhone: "+44 20 7946 0000",
        contactRole: "Partnerships Manager",
        referralSource: "LinkedIn",
        notes: "Looking forward to working together.",
      })
    ).not.toThrow();
  });

  it("rejects a missing name", () => {
    expect(() =>
      partnerApplicationSchema.parse({ ...validApplication, name: "" })
    ).toThrow(/Name is required/);
  });

  it("rejects a missing contact name", () => {
    expect(() =>
      partnerApplicationSchema.parse({ ...validApplication, contactName: "" })
    ).toThrow(/Contact name is required/);
  });

  it("rejects an invalid contact email", () => {
    expect(() =>
      partnerApplicationSchema.parse({
        ...validApplication,
        contactEmail: "not-an-email",
      })
    ).toThrow(/Valid email/);
  });

  it("rejects an empty partnership type", () => {
    expect(() =>
      partnerApplicationSchema.parse({ ...validApplication, type: "" })
    ).toThrow(/Choose referral, reseller, or agency/);
  });

  it("rejects a privileged partner type from the public form", () => {
    for (const type of ["venue", "organizer"]) {
      expect(() =>
        partnerApplicationSchema.parse({ ...validApplication, type })
      ).toThrow(/Choose referral, reseller, or agency/);
    }
  });

  it("rejects notes over the length cap", () => {
    expect(() =>
      partnerApplicationSchema.parse({
        ...validApplication,
        notes: "x".repeat(MAX_NOTES_LENGTH + 1),
      })
    ).toThrow(new RegExp(`under ${MAX_NOTES_LENGTH}`));
  });
});

describe("approvePartnerSchema / suspendPartnerSchema", () => {
  it("accepts a uuid-shaped partner id", () => {
    expect(() => approvePartnerSchema.parse({ partnerId: PARTNER_ID })).not.toThrow();
    expect(() => suspendPartnerSchema.parse({ partnerId: PARTNER_ID })).not.toThrow();
  });

  it("rejects a malformed partner id", () => {
    expect(() => approvePartnerSchema.parse({ partnerId: "p1" })).toThrow(
      /Invalid partner ID/
    );
    expect(() => suspendPartnerSchema.parse({ partnerId: "p1" })).toThrow(
      /Invalid partner ID/
    );
  });
});

describe("addPartnerUserSchema", () => {
  const valid = { partnerId: PARTNER_ID, profileId: PROFILE_ID, role: "member" };

  it("accepts both membership roles", () => {
    expect(() => addPartnerUserSchema.parse(valid)).not.toThrow();
    expect(() => addPartnerUserSchema.parse({ ...valid, role: "admin" })).not.toThrow();
  });

  it("rejects a malformed profile id", () => {
    expect(() =>
      addPartnerUserSchema.parse({ ...valid, profileId: "u1" })
    ).toThrow(/Invalid profile ID/);
  });

  it("rejects an unknown role", () => {
    expect(() => addPartnerUserSchema.parse({ ...valid, role: "owner" })).toThrow();
  });
});

describe("recordAttributionSchema", () => {
  it("accepts an attribution by partner id", () => {
    expect(() =>
      recordAttributionSchema.parse({ partnerId: PARTNER_ID, quoteId: QUOTE_ID })
    ).not.toThrow();
  });

  it("accepts an attribution by partner code", () => {
    expect(() =>
      recordAttributionSchema.parse({ partnerCode: "BB-NORTH001", quoteId: QUOTE_ID })
    ).not.toThrow();
  });

  it("rejects a malformed quote id", () => {
    expect(() =>
      recordAttributionSchema.parse({ partnerId: PARTNER_ID, quoteId: "q1" })
    ).toThrow(/Invalid quote ID/);
  });

  it("rejects an empty partner code", () => {
    expect(() =>
      recordAttributionSchema.parse({ partnerCode: "", quoteId: QUOTE_ID })
    ).toThrow(/Invalid partner code/);
  });
});

describe("createPartnerQuoteSchema", () => {
  const valid = {
    slug: "northern-events",
    contactName: "Jordan Blake",
    contactEmail: "jordan@brand.com",
  };

  it("accepts a minimal quote request", () => {
    expect(() => createPartnerQuoteSchema.parse(valid)).not.toThrow();
  });

  it("accepts the optional event detail fields", () => {
    expect(() =>
      createPartnerQuoteSchema.parse({
        ...valid,
        companyName: "Brand Co.",
        eventType: "activation",
        eventDateStart: "2026-09-01",
        estimatedValue: 12500,
      })
    ).not.toThrow();
  });

  it("rejects an empty partner slug", () => {
    expect(() => createPartnerQuoteSchema.parse({ ...valid, slug: "" })).toThrow(
      /Invalid partner slug/
    );
  });

  it("rejects an invalid contact email", () => {
    expect(() =>
      createPartnerQuoteSchema.parse({ ...valid, contactEmail: "not-an-email" })
    ).toThrow(/Valid email/);
  });

  it("rejects a negative estimated value", () => {
    expect(() =>
      createPartnerQuoteSchema.parse({ ...valid, estimatedValue: -50 })
    ).toThrow(/can't be negative/);
  });
});

describe("approveCommissionSchema", () => {
  it("accepts a positive dollar amount", () => {
    expect(() =>
      approveCommissionSchema.parse({ attributionId: ATTRIBUTION_ID, amountDollars: 1800 })
    ).not.toThrow();
  });

  it("rejects a malformed attribution id", () => {
    expect(() =>
      approveCommissionSchema.parse({ attributionId: "attr-1", amountDollars: 1800 })
    ).toThrow(/Invalid attribution ID/);
  });

  it("rejects a zero or negative amount", () => {
    expect(() =>
      approveCommissionSchema.parse({ attributionId: ATTRIBUTION_ID, amountDollars: 0 })
    ).toThrow(/greater than zero/);
  });
});

describe("markCommissionPaidSchema", () => {
  it("accepts a uuid-shaped attribution id", () => {
    expect(() =>
      markCommissionPaidSchema.parse({ attributionId: ATTRIBUTION_ID })
    ).not.toThrow();
  });

  it("rejects a malformed attribution id", () => {
    expect(() => markCommissionPaidSchema.parse({ attributionId: "attr-1" })).toThrow(
      /Invalid attribution ID/
    );
  });
});
