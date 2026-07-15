/**
 * Tests for the campaign schemas used by the campaigns actions.
 */

import { describe, it, expect } from "vitest";
import {
  createCampaignSchema,
  addEventToCampaignSchema,
  removeEventFromCampaignSchema,
  updateCampaignStatusSchema,
  duplicateEventForCampaignSchema,
} from "./campaigns";

const CAMPAIGN_ID = "ca000000-0000-4000-8000-000000000001";
const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const ACCOUNT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("createCampaignSchema", () => {
  it("accepts a campaign with just a name", () => {
    expect(() => createCampaignSchema.parse({ name: "Summer Tour" })).not.toThrow();
  });

  it("accepts a fully populated campaign", () => {
    expect(() =>
      createCampaignSchema.parse({
        name: "Summer Tour",
        description: "Year-long sampling programme.",
        accountId: ACCOUNT_ID,
        startDate: "2026-03-01",
        endDate: "2026-12-31",
        status: "active",
      })
    ).not.toThrow();
  });

  it("accepts an unknown status (action coerces it to draft)", () => {
    expect(() =>
      createCampaignSchema.parse({ name: "Summer Tour", status: "bogus" })
    ).not.toThrow();
  });

  it("rejects an empty name", () => {
    expect(() => createCampaignSchema.parse({ name: "" })).toThrow(/Campaign name is required/);
  });

  it("rejects a malformed account id", () => {
    expect(() =>
      createCampaignSchema.parse({ name: "Summer Tour", accountId: "acc-1" })
    ).toThrow(/Invalid account ID/);
  });
});

describe("campaign event link schemas", () => {
  it("accepts a valid campaign and event pair", () => {
    expect(() =>
      addEventToCampaignSchema.parse({ campaignId: CAMPAIGN_ID, eventId: EVENT_ID })
    ).not.toThrow();
    expect(() =>
      removeEventFromCampaignSchema.parse({ campaignId: CAMPAIGN_ID, eventId: EVENT_ID })
    ).not.toThrow();
  });

  it("rejects a malformed campaign id", () => {
    expect(() =>
      addEventToCampaignSchema.parse({ campaignId: "cmp-1", eventId: EVENT_ID })
    ).toThrow(/Invalid campaign ID/);
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      removeEventFromCampaignSchema.parse({ campaignId: CAMPAIGN_ID, eventId: "evt-1" })
    ).toThrow(/Invalid event ID/);
  });
});

describe("updateCampaignStatusSchema", () => {
  it.each(["draft", "active", "completed", "archived"] as const)(
    "accepts the %s status",
    (status) => {
      expect(() =>
        updateCampaignStatusSchema.parse({ id: CAMPAIGN_ID, status })
      ).not.toThrow();
    }
  );

  it("rejects an unknown status", () => {
    expect(() =>
      updateCampaignStatusSchema.parse({ id: CAMPAIGN_ID, status: "paused" })
    ).toThrow();
  });

  it("rejects a malformed campaign id", () => {
    expect(() =>
      updateCampaignStatusSchema.parse({ id: "cmp-1", status: "active" })
    ).toThrow(/Invalid campaign ID/);
  });
});

describe("duplicateEventForCampaignSchema", () => {
  it("accepts new dates with an optional location", () => {
    expect(() =>
      duplicateEventForCampaignSchema.parse({
        eventId: EVENT_ID,
        newDates: { start: "2026-08-01", end: "2026-08-03" },
        newLocation: "Birmingham NEC",
      })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      duplicateEventForCampaignSchema.parse({
        eventId: "evt-1",
        newDates: { start: "2026-08-01", end: "2026-08-03" },
      })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects a missing start date", () => {
    expect(() =>
      duplicateEventForCampaignSchema.parse({
        eventId: EVENT_ID,
        newDates: { start: "", end: "2026-08-03" },
      })
    ).toThrow(/Start date is required/);
  });

  it("rejects a missing end date", () => {
    expect(() =>
      duplicateEventForCampaignSchema.parse({
        eventId: EVENT_ID,
        newDates: { start: "2026-08-01", end: "" },
      })
    ).toThrow(/End date is required/);
  });
});
