/**
 * Tests for the customer invite schema shared by the admin-gated and
 * system-level invite actions.
 */

import { describe, it, expect } from "vitest";
import {
  inviteCustomerUserSchema,
  inviteCustomerUserSystemSchema,
} from "./invites";

const ACCOUNT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const validInvite = {
  email: "james.chen@cocacola.com",
  accountId: ACCOUNT_ID,
  role: "customer_user" as const,
};

describe("inviteCustomerUserSchema", () => {
  it("accepts a standard customer user invite", () => {
    expect(() => inviteCustomerUserSchema.parse(validInvite)).not.toThrow();
  });

  it("accepts a customer admin invite", () => {
    expect(() =>
      inviteCustomerUserSchema.parse({ ...validInvite, role: "customer_admin" })
    ).not.toThrow();
  });

  it("rejects an invalid email", () => {
    expect(() =>
      inviteCustomerUserSchema.parse({ ...validInvite, email: "not-an-email" })
    ).toThrow(/Valid email/);
  });

  it("rejects a malformed account id", () => {
    expect(() =>
      inviteCustomerUserSchema.parse({ ...validInvite, accountId: "acc1" })
    ).toThrow(/Invalid account ID/);
  });

  it("rejects an internal role", () => {
    expect(() =>
      inviteCustomerUserSchema.parse({ ...validInvite, role: "events_lead" })
    ).toThrow();
  });
});

describe("inviteCustomerUserSystemSchema", () => {
  it("shares the gated invite shape", () => {
    expect(() => inviteCustomerUserSystemSchema.parse(validInvite)).not.toThrow();
    expect(() =>
      inviteCustomerUserSystemSchema.parse({ ...validInvite, accountId: "acc1" })
    ).toThrow(/Invalid account ID/);
  });
});
