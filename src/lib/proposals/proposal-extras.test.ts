import { describe, expect, it } from "vitest";

import {
  buildDeRiskItems,
  buildProposalJourney,
  ROLE_ANCHORS,
} from "./proposal-extras";

describe("buildProposalJourney", () => {
  it("arrives at step 2 with the first step already done for a fresh proposal", () => {
    const journey = buildProposalJourney({
      status: "proposal_sent",
      walkthrough_completed_at: null,
    });
    expect(journey.steps.map((s) => s.state)).toEqual([
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(journey.caption).toContain("Step 2 of 4");
  });

  it("moves to the decision step once the walkthrough is complete", () => {
    const journey = buildProposalJourney({
      status: "proposal_sent",
      walkthrough_completed_at: "2026-08-01T10:00:00Z",
    });
    expect(journey.steps.map((s) => s.state)).toEqual([
      "done",
      "done",
      "done",
      "current",
    ]);
    expect(journey.caption).toContain("price is unlocked");
  });

  it("marks every step done once the proposal is accepted", () => {
    const journey = buildProposalJourney({ status: "accepted" });
    expect(journey.steps.every((s) => s.state === "done")).toBe(true);
  });

  it("treats accepted as terminal even if walkthrough timestamp is missing", () => {
    const journey = buildProposalJourney({
      status: "accepted",
      walkthrough_completed_at: null,
    });
    expect(journey.steps.every((s) => s.state === "done")).toBe(true);
  });

  it("always exposes four labelled steps", () => {
    const journey = buildProposalJourney({ status: "proposal_sent" });
    expect(journey.steps.map((s) => s.label)).toEqual([
      "Your brief",
      "Your proposal",
      "Walkthrough",
      "Booked",
    ]);
  });
});

describe("ROLE_ANCHORS", () => {
  it("routes finance, brand and ops to real in-page anchors", () => {
    expect(ROLE_ANCHORS).toHaveLength(3);
    expect(ROLE_ANCHORS.map((a) => a.href)).toEqual([
      "#investment",
      "#creative",
      "#timeline",
    ]);
    for (const anchor of ROLE_ANCHORS) {
      expect(anchor.role.length).toBeGreaterThan(0);
      expect(anchor.body.length).toBeGreaterThan(0);
    }
  });
});

describe("buildDeRiskItems", () => {
  it("names the delivery lead and their direct email", () => {
    const items = buildDeRiskItems({
      firstName: "Ava",
      fullName: "Ava Stone",
      title: "Event Lead",
      email: "ava@brightblue.co.uk",
    });
    expect(items[0].title).toContain("Ava Stone");
    expect(items[0].body).toContain("ava@brightblue.co.uk");
  });

  it("includes an SLA and a bounded worst case", () => {
    const items = buildDeRiskItems();
    expect(items).toHaveLength(3);
    expect(items[1].body).toMatch(/one business day/i);
    expect(items[2].body).toMatch(/free/i);
  });
});
