/**
 * Tests for logQueryError — the contract is that a swallowed query failure
 * always reaches Sentry, and that an absent error is never reported.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const captureException = vi.fn();
const setTag = vi.fn();
const setContext = vi.fn();
const setFingerprint = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  withScope: (fn: (scope: unknown) => void) =>
    fn({ setTag, setContext, setFingerprint }),
}));

import { logQueryError } from "./log-query-error";

beforeEach(() => {
  captureException.mockReset();
  setTag.mockReset();
  setContext.mockReset();
  setFingerprint.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("logQueryError", () => {
  it("reports a Supabase error object to Sentry", () => {
    logQueryError("getEventById", { message: "permission denied", code: "42501" });

    expect(captureException).toHaveBeenCalledTimes(1);
    expect((captureException.mock.calls[0][0] as Error).message).toContain(
      "permission denied"
    );
  });

  it("ignores an absent error so callers can pass the error position straight through", () => {
    logQueryError("getEventById", null);
    logQueryError("getEventById", undefined);

    expect(captureException).not.toHaveBeenCalled();
  });

  it("tags the operation and Postgres code so issues stay groupable", () => {
    logQueryError("getTasks", { message: "boom", code: "PGRST116" }, { eventId: "e1" });

    expect(setTag).toHaveBeenCalledWith("query.operation", "getTasks");
    expect(setTag).toHaveBeenCalledWith("query.code", "PGRST116");
    expect(setFingerprint).toHaveBeenCalledWith([
      "query-error",
      "getTasks",
      "PGRST116",
    ]);
  });

  it("attaches the caller's context to the Sentry event", () => {
    logQueryError("getAssets", { message: "boom" }, { eventId: "e1", limit: 20 });

    expect(setContext).toHaveBeenCalledWith("query", {
      operation: "getAssets",
      code: undefined,
      eventId: "e1",
      limit: 20,
    });
  });

  it("passes a thrown Error through unwrapped so the stack survives", () => {
    const thrown = new Error("socket hang up");

    logQueryError("getLeads", thrown);

    expect(captureException).toHaveBeenCalledWith(thrown);
  });

  it("accepts a bare string error", () => {
    logQueryError("getVenues", "connection refused");

    expect((captureException.mock.calls[0][0] as Error).message).toBe(
      "getVenues: connection refused"
    );
  });

  it("still logs to the server console when Sentry is not configured", () => {
    logQueryError("getQuotes", { message: "boom", code: "500" }, { quoteId: "q1" });

    expect(console.error).toHaveBeenCalledWith("[query:getQuotes] boom", {
      code: "500",
      quoteId: "q1",
    });
  });
});
