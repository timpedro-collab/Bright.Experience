import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RidgeArtwork } from "./ridge-artwork";

describe("RidgeArtwork", () => {
  it("renders an SVG with the requested number of ridge paths", () => {
    const { container } = render(<RidgeArtwork seed="acme-spring" lines={20} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // 20 ridge paths + 1 hero thread = 21 total paths
    expect(container.querySelectorAll("path")).toHaveLength(21);
  });

  it("omits the hero thread when showHeroThread is false", () => {
    const { container } = render(
      <RidgeArtwork seed="acme-spring" lines={20} showHeroThread={false} />,
    );
    expect(container.querySelectorAll("path")).toHaveLength(20);
  });

  it("is deterministic: same seed -> identical markup", () => {
    const { container: a } = render(<RidgeArtwork seed="edition-024" />);
    const { container: b } = render(<RidgeArtwork seed="edition-024" />);
    expect(a.innerHTML).toBe(b.innerHTML);
  });

  it("produces different art for different seeds", () => {
    const { container: a } = render(<RidgeArtwork seed="edition-024" />);
    const { container: b } = render(<RidgeArtwork seed="edition-025" />);
    expect(a.innerHTML).not.toBe(b.innerHTML);
  });

  it("decorates itself as presentational (hidden from screen readers)", () => {
    const { container } = render(<RidgeArtwork seed="foo" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("presentation");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });
});
