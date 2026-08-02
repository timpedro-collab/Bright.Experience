/** Tests for StatCountUp scroll-triggered count-up and reduced-motion behaviour. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@/test/render";
import { StatCountUp } from "./StatCountUp";

const motionMocks = vi.hoisted(() => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: motionMocks.useReducedMotion,
  };
});

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

function mockIntersectionObserver(isIntersecting = true) {
  class MockIntersectionObserver {
    private callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(element: Element) {
      this.callback(
        [
          {
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            target: element,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      );
    }

    unobserve() {}
    disconnect() {}
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

afterEach(() => {
  vi.unstubAllGlobals();
  motionMocks.useReducedMotion.mockReset();
  motionMocks.useReducedMotion.mockReturnValue(false);
});

describe("StatCountUp", () => {
  it("renders the final value immediately when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    motionMocks.useReducedMotion.mockReturnValue(true);
    mockIntersectionObserver();
    const { container } = render(<StatCountUp raw="92%" />);
    expect(container.querySelector("span")?.textContent).toBe("92%");
  });

  it("renders a no-number string as-is", () => {
    mockMatchMedia(false);
    render(<StatCountUp raw="GDPR" />);
    expect(screen.getByText("GDPR")).toBeInTheDocument();
  });

  it("renders prefix and suffix around the number", () => {
    mockMatchMedia(true);
    motionMocks.useReducedMotion.mockReturnValue(true);
    const { container } = render(<StatCountUp raw="Up to 40%" />);
    expect(container.querySelector("span")?.textContent).toBe("Up to 40%");
  });

  it("wraps the prefix and suffix in styleable spans when class names are given", () => {
    mockMatchMedia(true);
    motionMocks.useReducedMotion.mockReturnValue(true);
    const { container } = render(
      <StatCountUp
        raw="Up to 40%"
        prefixClassName="stat-prefix"
        suffixClassName="stat-suffix"
      />
    );
    expect(container.querySelector(".stat-prefix")?.textContent).toBe("Up to ");
    expect(container.querySelector(".stat-suffix")?.textContent).toBe("%");
    expect(container.querySelector("span")?.textContent).toBe("Up to 40%");
  });
});
