/** Tests for polled status debouncing (docs/18-design-research.md R6). */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStableStatus } from "./useStableStatus";

describe("useStableStatus", () => {
  it("passes the initial value through immediately", () => {
    const { result } = renderHook(({ value }: { value: string }) => useStableStatus(value), {
      initialProps: { value: "online" },
    });
    expect(result.current).toBe("online");
  });

  it("does not change output on a single-poll flicker", () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useStableStatus(value), {
      initialProps: { value: "online" },
    });

    act(() => {
      rerender({ value: "offline" });
    });
    expect(result.current).toBe("online");

    act(() => {
      rerender({ value: "online" });
    });
    expect(result.current).toBe("online");
  });

  it("updates after the new value holds for two consecutive polls", () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useStableStatus(value), {
      initialProps: { value: "online" },
    });

    act(() => {
      rerender({ value: "offline" });
    });
    expect(result.current).toBe("online");

    act(() => {
      rerender({ value: "offline" });
    });
    expect(result.current).toBe("offline");
  });

  it("respects a custom stablePolls threshold", () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: boolean }) => useStableStatus(value, 3),
      { initialProps: { value: false } }
    );

    act(() => {
      rerender({ value: true });
    });
    expect(result.current).toBe(false);

    act(() => {
      rerender({ value: true });
    });
    expect(result.current).toBe(false);

    act(() => {
      rerender({ value: true });
    });
    expect(result.current).toBe(true);
  });
});
