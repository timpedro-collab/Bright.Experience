/**
 * Tests for the demo-safe booking gate. Demos must NOT auto-create real
 * events/accounts/invites from funnel walkthroughs, so provisioning is opt-in.
 */

import { describe, it, expect, afterEach } from "vitest";
import { shouldAutoProvisionQuote } from "./booking-flags";

const original = process.env.BOOKING_AUTO_PROVISION;

afterEach(() => {
  if (original === undefined) delete process.env.BOOKING_AUTO_PROVISION;
  else process.env.BOOKING_AUTO_PROVISION = original;
});

describe("shouldAutoProvisionQuote", () => {
  it("is off by default (unset) — demo-safe", () => {
    delete process.env.BOOKING_AUTO_PROVISION;
    expect(shouldAutoProvisionQuote()).toBe(false);
  });

  it.each(["true", "1"])("is on when set to %s", (value) => {
    process.env.BOOKING_AUTO_PROVISION = value;
    expect(shouldAutoProvisionQuote()).toBe(true);
  });

  it.each(["false", "0", "yes", ""])(
    "stays off for non-truthy value %s",
    (value) => {
      process.env.BOOKING_AUTO_PROVISION = value;
      expect(shouldAutoProvisionQuote()).toBe(false);
    }
  );
});
