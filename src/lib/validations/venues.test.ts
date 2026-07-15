/**
 * Tests for the venue and runway management schemas used by the venues actions.
 */

import { describe, it, expect } from "vitest";
import {
  createVenueSchema,
  updateVenueSchema,
  createVenuePackageSchema,
  createPlacementSchema,
  updatePlacementStatusSchema,
  createSponsorshipSlotSchema,
  reserveSlotSchema,
  confirmSlotSchema,
  updateSlotSchema,
  deleteSlotSchema,
  requestVenueSlotSchema,
} from "./venues";

const VENUE_ID = "f0f0f0f0-f0f0-4f0f-8f0f-f0f0f0f0f0f0";
const PARTNER_ID = "e0e0e0e0-e0e0-4e0e-8e0e-e0e0e0e0e0e0";
const PLACEMENT_ID = "b1000000-0000-4000-8000-000000000001";
const SLOT_ID = "b2000000-0000-4000-8000-000000000001";
const SPONSOR_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MACHINE_ID = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";

describe("createVenueSchema", () => {
  it("accepts a venue with just a name", () => {
    expect(() => createVenueSchema.parse({ name: "ExCeL London" })).not.toThrow();
  });

  it("accepts a fully populated venue", () => {
    expect(() =>
      createVenueSchema.parse({
        name: "ExCeL London",
        partnerId: PARTNER_ID,
        address: "One Western Gateway",
        postcode: "E16 1XL",
        venueType: "convention_centre",
        capacity: 90000,
      })
    ).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() => createVenueSchema.parse({ name: "" })).toThrow(/Venue name is required/);
  });

  it("rejects a malformed partner id", () => {
    expect(() =>
      createVenueSchema.parse({ name: "ExCeL", partnerId: "partner-1" })
    ).toThrow(/Invalid partner ID/);
  });

  it("rejects a fractional capacity", () => {
    expect(() =>
      createVenueSchema.parse({ name: "ExCeL", capacity: 1.5 })
    ).toThrow(/whole number/);
  });
});

describe("updateVenueSchema", () => {
  it("accepts a partial update", () => {
    expect(() =>
      updateVenueSchema.parse({ id: VENUE_ID, isActive: false })
    ).not.toThrow();
  });

  it("rejects a malformed venue id", () => {
    expect(() => updateVenueSchema.parse({ id: "venue-1" })).toThrow(/Invalid venue ID/);
  });
});

describe("createVenuePackageSchema", () => {
  it("accepts a package with a price in whole dollars", () => {
    expect(() =>
      createVenuePackageSchema.parse({
        venueId: VENUE_ID,
        name: "Weekend Takeover",
        description: "Fri–Sun atrium placement.",
        price: 3400.5,
        includesBrightBlue: true,
      })
    ).not.toThrow();
  });

  it("rejects a malformed venue id", () => {
    expect(() =>
      createVenuePackageSchema.parse({ venueId: "v1", name: "Pkg" })
    ).toThrow(/Invalid venue ID/);
  });

  it("rejects a negative price", () => {
    expect(() =>
      createVenuePackageSchema.parse({ venueId: VENUE_ID, name: "Pkg", price: -1 })
    ).toThrow(/cannot be negative/);
  });
});

describe("createPlacementSchema", () => {
  it("accepts a placement without a machine or end date", () => {
    expect(() =>
      createPlacementSchema.parse({ venueId: VENUE_ID, startDate: "2026-07-01" })
    ).not.toThrow();
  });

  it("accepts a placement with a machine instance", () => {
    expect(() =>
      createPlacementSchema.parse({
        venueId: VENUE_ID,
        machineInstanceId: MACHINE_ID,
        startDate: "2026-07-01",
        endDate: "2026-07-31",
      })
    ).not.toThrow();
  });

  it("rejects a missing start date", () => {
    expect(() =>
      createPlacementSchema.parse({ venueId: VENUE_ID, startDate: "" })
    ).toThrow(/Start date is required/);
  });

  it("rejects a malformed machine instance id", () => {
    expect(() =>
      createPlacementSchema.parse({
        venueId: VENUE_ID,
        machineInstanceId: "machine-1",
        startDate: "2026-07-01",
      })
    ).toThrow(/Invalid machine instance ID/);
  });
});

describe("updatePlacementStatusSchema", () => {
  it.each(["planned", "active", "completed", "cancelled"] as const)(
    "accepts the %s status",
    (status) => {
      expect(() =>
        updatePlacementStatusSchema.parse({ id: PLACEMENT_ID, status })
      ).not.toThrow();
    }
  );

  it("rejects an unknown status", () => {
    expect(() =>
      updatePlacementStatusSchema.parse({ id: PLACEMENT_ID, status: "paused" })
    ).toThrow();
  });

  it("rejects a malformed placement id", () => {
    expect(() =>
      updatePlacementStatusSchema.parse({ id: "pl-1", status: "active" })
    ).toThrow(/Invalid placement ID/);
  });
});

describe("createSponsorshipSlotSchema", () => {
  it("accepts a slot with dates and no price", () => {
    expect(() =>
      createSponsorshipSlotSchema.parse({
        placementId: PLACEMENT_ID,
        startDate: "2026-07-05",
        endDate: "2026-07-12",
      })
    ).not.toThrow();
  });

  it("rejects a missing end date", () => {
    expect(() =>
      createSponsorshipSlotSchema.parse({
        placementId: PLACEMENT_ID,
        startDate: "2026-07-05",
        endDate: "",
      })
    ).toThrow(/End date is required/);
  });

  it("rejects a negative price", () => {
    expect(() =>
      createSponsorshipSlotSchema.parse({
        placementId: PLACEMENT_ID,
        startDate: "2026-07-05",
        endDate: "2026-07-12",
        price: -100,
      })
    ).toThrow(/cannot be negative/);
  });
});

describe("reserveSlotSchema", () => {
  it("accepts a reservation with an optional campaign tag", () => {
    expect(() =>
      reserveSlotSchema.parse({
        slotId: SLOT_ID,
        sponsorAccountId: SPONSOR_ID,
        campaign: "Summer Tech Week",
      })
    ).not.toThrow();
  });

  it("rejects a malformed sponsor account id", () => {
    expect(() =>
      reserveSlotSchema.parse({ slotId: SLOT_ID, sponsorAccountId: "acc-1" })
    ).toThrow(/Invalid sponsor account ID/);
  });
});

describe("slot lifecycle schemas", () => {
  it("accepts a valid slot id", () => {
    expect(() => confirmSlotSchema.parse({ slotId: SLOT_ID })).not.toThrow();
    expect(() => deleteSlotSchema.parse({ slotId: SLOT_ID })).not.toThrow();
  });

  it("rejects a malformed slot id", () => {
    expect(() => confirmSlotSchema.parse({ slotId: "slot-1" })).toThrow(/Invalid slot ID/);
  });
});

describe("updateSlotSchema", () => {
  it("accepts a price-only edit", () => {
    expect(() => updateSlotSchema.parse({ slotId: SLOT_ID, price: 26000 })).not.toThrow();
  });

  it("rejects a negative price", () => {
    expect(() =>
      updateSlotSchema.parse({ slotId: SLOT_ID, price: -5 })
    ).toThrow(/cannot be negative/);
  });
});

describe("requestVenueSlotSchema", () => {
  const validRequest = {
    slotId: SLOT_ID,
    company: "Acme Drinks",
    contactName: "Jo Bloggs",
    email: "jo@acme.example",
    message: "We'd love the June window.",
  };

  it("accepts a valid advertiser enquiry", () => {
    expect(() => requestVenueSlotSchema.parse(validRequest)).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      requestVenueSlotSchema.parse({ ...validRequest, email: "not-an-email" })
    ).toThrow(/Valid email is required/);
  });

  it("rejects a missing company", () => {
    expect(() =>
      requestVenueSlotSchema.parse({ ...validRequest, company: "" })
    ).toThrow(/Company is required/);
  });

  it("rejects a message over the length cap", () => {
    expect(() =>
      requestVenueSlotSchema.parse({ ...validRequest, message: "x".repeat(5001) })
    ).toThrow(/under 5000/);
  });
});
