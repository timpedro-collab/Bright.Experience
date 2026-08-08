/** Tests for LiveCounter count-up behaviour and reduced-motion accessibility. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@/test/render";
import { LiveCounter } from "./LiveCounter";

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

const icon = <span data-testid="icon">icon</span>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LiveCounter", () => {
  it("renders the final value immediately when prefers-reduced-motion is set", () => {
    mockMatchMedia(true);
    render(<LiveCounter label="Plays" value={1247} icon={icon} />);
    expect(screen.getByText("1,247")).toBeInTheDocument();
  });

  it("never renders 0 as a resting state — first paint shows the real value", () => {
    mockMatchMedia(false);
    render(<LiveCounter label="Plays" value={1247} icon={icon} />);
    expect(screen.getByText("1,247")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
