/**
 * Tests for the team member action schemas — invites, requests, and the
 * approve/reject/remove lifecycle.
 */

import { describe, it, expect } from "vitest";
import {
  approveTeamMemberSchema,
  inviteTeammateSchema,
  rejectTeamMemberSchema,
  removeTeamMemberSchema,
  requestTeamMemberSchema,
} from "./team";

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MEMBER_ID = "ab111111-1111-1111-1111-111111111111";

describe("inviteTeammateSchema", () => {
  it("accepts a standard-member invite", () => {
    expect(() =>
      inviteTeammateSchema.parse({ email: "colleague@cocacola.com", asAdmin: false })
    ).not.toThrow();
  });

  it("accepts an admin-level invite", () => {
    expect(() =>
      inviteTeammateSchema.parse({ email: "colleague@cocacola.com", asAdmin: true })
    ).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      inviteTeammateSchema.parse({ email: "not-an-email", asAdmin: false })
    ).toThrow(/valid email/i);
  });
});

describe("requestTeamMemberSchema", () => {
  const valid = {
    eventId: EVENT_ID,
    email: "newperson@cocacola.com",
    roleLabel: "Marketing Lead",
  };

  it("accepts a valid team member request", () => {
    expect(() => requestTeamMemberSchema.parse(valid)).not.toThrow();
  });

  it("accepts an empty role label (action falls back to Team Member)", () => {
    expect(() =>
      requestTeamMemberSchema.parse({ ...valid, roleLabel: "" })
    ).not.toThrow();
  });

  it("rejects a malformed event id", () => {
    expect(() =>
      requestTeamMemberSchema.parse({ ...valid, eventId: "evt-1" })
    ).toThrow(/Invalid event ID/);
  });

  it("rejects an invalid email", () => {
    expect(() =>
      requestTeamMemberSchema.parse({ ...valid, email: "not-an-email" })
    ).toThrow(/valid email/i);
  });
});

describe("team member lifecycle schemas", () => {
  it("accepts a uuid-shaped member id", () => {
    expect(() => approveTeamMemberSchema.parse({ memberId: MEMBER_ID })).not.toThrow();
    expect(() => rejectTeamMemberSchema.parse({ memberId: MEMBER_ID })).not.toThrow();
    expect(() => removeTeamMemberSchema.parse({ memberId: MEMBER_ID })).not.toThrow();
  });

  it("rejects a malformed member id", () => {
    expect(() => approveTeamMemberSchema.parse({ memberId: "tm1" })).toThrow(
      /Invalid member ID/
    );
    expect(() => rejectTeamMemberSchema.parse({ memberId: "tm1" })).toThrow(
      /Invalid member ID/
    );
    expect(() => removeTeamMemberSchema.parse({ memberId: "tm1" })).toThrow(
      /Invalid member ID/
    );
  });
});
