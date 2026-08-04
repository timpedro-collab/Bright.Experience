/** Tests for the public live page auto-refresh hook. */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveShareAutoRefresh } from "./LiveShareAutoRefresh";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("LiveShareAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the update cadence copy", () => {
    render(<LiveShareAutoRefresh />);
    expect(screen.getByText(/updates every minute/i)).toBeInTheDocument();
  });

  it("registers an interval and clears it on unmount", () => {
    const setIntervalSpy = vi.spyOn(global, "setInterval");
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");

    const { unmount } = render(<LiveShareAutoRefresh />);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);

    vi.advanceTimersByTime(60_000);
    expect(refresh).toHaveBeenCalledTimes(1);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
