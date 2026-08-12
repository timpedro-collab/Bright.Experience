/**
 * Tests for the demo-safe booking gate. Demos must NOT auto-create real
 * events/accounts/invites from funnel walkthroughs, so provisioning is opt-in.
 */

import { describe, it, expect, afterEach } from "vitest";
import {
  isVolumeLadderCustomerVisible,
  shouldAutoProvisionQuote,
} from "./booking-flags";

const originalProvision = process.env.BOOKING_AUTO_PROVISION;
const originalVolumeLadder = process.env.VOLUME_LADDER_CUSTOMER_VISIBLE;

afterEach(() => {
  if (originalProvision === undefined) delete process.env.BOOKING_AUTO_PROVISION;
  else process.env.BOOKING_AUTO_PROVISION = originalProvision;
  if (originalVolumeLadder === undefined) {
    delete process.env.VOLUME_LADDER_CUSTOMER_VISIBLE;
  } else {
    process.env.VOLUME_LADDER_CUSTOMER_VISIBLE = originalVolumeLadder;
  }
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

describe("isVolumeLadderCustomerVisible", () => {
  it("is off by default (unset)", () => {
    delete process.env.VOLUME_LADDER_CUSTOMER_VISIBLE;
    expect(isVolumeLadderCustomerVisible()).toBe(false);
  });

  it("is on when set to true", () => {
    process.env.VOLUME_LADDER_CUSTOMER_VISIBLE = "true";
    expect(isVolumeLadderCustomerVisible()).toBe(true);
  });

  it.each(["false", "1", "yes", ""])(
    "stays off for non-exact value %s",
    (value) => {
      process.env.VOLUME_LADDER_CUSTOMER_VISIBLE = value;
      expect(isVolumeLadderCustomerVisible()).toBe(false);
    },
  );
});
