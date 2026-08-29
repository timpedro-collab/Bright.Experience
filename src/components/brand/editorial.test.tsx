import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialEyebrow, Hairline } from "./editorial";

describe("EditorialEyebrow", () => {
  it("renders its label with the overline text utility", () => {
    render(<EditorialEyebrow>Waiting on you</EditorialEyebrow>);
    const label = screen.getByText("Waiting on you");
    expect(label.className).toContain("text-overline");
  });

  it("applies the brand accent when `accent` is set", () => {
    render(<EditorialEyebrow accent>Live</EditorialEyebrow>);
    const label = screen.getByText("Live");
    expect(label.className).toContain("text-brand-cyan");
  });
});

describe("Hairline", () => {
  it("renders a horizontal hairline by default", () => {
    const { container } = render(<Hairline />);
    const node = container.firstElementChild as HTMLElement;
    expect(node.className).toContain("hairline");
    expect(node.className).not.toContain("hairline-vertical");
    expect(node.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders a vertical hairline when requested", () => {
    const { container } = render(<Hairline orientation="vertical" />);
    expect((container.firstElementChild as HTMLElement).className).toContain(
      "hairline-vertical",
    );
  });
});
