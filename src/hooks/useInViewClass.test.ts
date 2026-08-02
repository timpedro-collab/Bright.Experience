/** Tests for useInViewClass mobile in-view class toggling. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInViewClass } from "./useInViewClass";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: matches && query === "(max-width: 767px) and (orientation: portrait)",
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInViewClass", () => {
  it("adds class via add-observer and removes via remove-observer when media matches", () => {
    mockMatchMedia(true);

    let addCallback: IntersectionObserverCallback | null = null;
    let removeCallback: IntersectionObserverCallback | null = null;
    let observerCount = 0;

    class MockIntersectionObserver {
      private callback: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        this.callback = callback;
        if (options?.threshold === 1) {
          addCallback = callback;
        } else {
          removeCallback = callback;
        }
        observerCount++;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const { result } = renderHook(() => useInViewClass());
    const element = document.createElement("div");

    act(() => {
      result.current(element);
    });

    expect(observerCount).toBe(2);

    act(() => {
      addCallback!(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: element,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    expect(element.classList.contains("is-inview")).toBe(true);

    act(() => {
      removeCallback!(
        [
          {
            isIntersecting: false,
            target: element,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });
    expect(element.classList.contains("is-inview")).toBe(false);
  });

  it("does not observe when media query does not match", () => {
    mockMatchMedia(false);

    let observerCount = 0;

    class MockIntersectionObserver {
      constructor() {
        observerCount++;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    const { result } = renderHook(() => useInViewClass());
    const element = document.createElement("div");

    act(() => {
      result.current(element);
    });

    expect(observerCount).toBe(0);
  });
});
