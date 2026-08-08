/**
 * Tests for the staged "working" transition between the final quiz answer
 * and the result reveal. Fake timers drive the sequence deterministically.
 */
import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QuizWorkingTransition } from "./QuizWorkingTransition";

const LINE_1 = "Matching machines to your brief…";
const LINE_2 = "Checking fleet availability…";
const LINE_3 = "Sizing your projected reach…";

function mockMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe("QuizWorkingTransition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the status lines one after another, not all at once", () => {
    render(<QuizWorkingTransition onDone={vi.fn()} />);

    expect(screen.getByText(LINE_1)).toBeInTheDocument();
    expect(screen.queryByText(LINE_2)).not.toBeInTheDocument();
    expect(screen.queryByText(LINE_3)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText(LINE_2)).toBeInTheDocument();
    expect(screen.queryByText(LINE_3)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByText(LINE_3)).toBeInTheDocument();
  });

  it("ticks each line off as the next one begins", () => {
    const { container } = render(<QuizWorkingTransition onDone={vi.fn()} />);
    const ticks = () => container.querySelectorAll("svg").length;

    expect(ticks()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(ticks()).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(ticks()).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(ticks()).toBe(3);
  });

  it("reveals the result only after the working sequence completes", () => {
    const onDone = vi.fn();
    render(<QuizWorkingTransition onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(4499);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDone).toHaveBeenCalledTimes(1);

    // Never fires again, even if time keeps passing.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("never fires once unmounted mid-sequence", () => {
    const onDone = vi.fn();
    const { unmount } = render(<QuizWorkingTransition onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(1400);
    });
    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
    }).not.toThrow();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("skips straight to the result when the visitor prefers reduced motion", () => {
    mockMatchMedia(true);
    const onDone = vi.fn();
    render(<QuizWorkingTransition onDone={onDone} />);

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(LINE_1)).not.toBeInTheDocument();
  });

  it("skips straight to the result when told to via the skip prop", () => {
    const onDone = vi.fn();
    render(<QuizWorkingTransition onDone={onDone} skip />);

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(LINE_1)).not.toBeInTheDocument();
  });
});
