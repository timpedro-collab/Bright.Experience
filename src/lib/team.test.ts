/**
 * Tests for the named-team persona contract. Tiny but important — the
 * AE name appears on every confirmation screen and email signoff.
 */

import { describe, it, expect } from "vitest";
import { DEFAULT_ACCOUNT_MANAGER } from "./team";

describe("DEFAULT_ACCOUNT_MANAGER", () => {
  it("exposes a first name, full name, title, and email", () => {
    expect(DEFAULT_ACCOUNT_MANAGER.firstName).toBeTruthy();
    expect(DEFAULT_ACCOUNT_MANAGER.fullName).toBeTruthy();
    expect(DEFAULT_ACCOUNT_MANAGER.title).toBeTruthy();
    expect(DEFAULT_ACCOUNT_MANAGER.email).toMatch(/@/);
  });

  it("full name starts with the first name", () => {
    expect(DEFAULT_ACCOUNT_MANAGER.fullName.startsWith(DEFAULT_ACCOUNT_MANAGER.firstName)).toBe(true);
  });
});
