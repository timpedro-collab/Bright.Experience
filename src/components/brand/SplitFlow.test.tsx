import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SplitFlow } from "./SplitFlow";

describe("SplitFlow", () => {
  it("renders segment labels and optional title", () => {
    render(
      <SplitFlow
        title="One pound of placement revenue"
        segments={[
          { label: "Your venue 18%", fraction: 0.18, emphasis: true },
          { label: "Bright.Blue 82%", fraction: 0.82 },
        ]}
      />,
    );

    expect(
      screen.getByText("One pound of placement revenue"),
    ).toBeInTheDocument();
    expect(screen.getByText("Your venue 18%")).toBeInTheDocument();
    expect(screen.getByText("Bright.Blue 82%")).toBeInTheDocument();
  });

  it("applies widths from fractions", () => {
    const { container } = render(
      <SplitFlow
        segments={[
          { label: "70% Bright.Blue", fraction: 0.7, emphasis: true },
          { label: "30% Informa", fraction: 0.3 },
        ]}
      />,
    );

    const segments = container.querySelectorAll(
      ".flex.h-14.w-full.overflow-hidden.rounded-xl.border > div",
    );
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveStyle({ width: "70%" });
    expect(segments[1]).toHaveStyle({ width: "30%" });
  });

  it("renders captions when provided", () => {
    render(
      <SplitFlow
        segments={[
          {
            label: "70% Bright.Blue",
            fraction: 0.7,
            caption: "machines · creative · crew · platform · reporting",
            emphasis: true,
          },
          {
            label: "30% Informa",
            fraction: 0.3,
            caption: "the sale, nothing else to carry",
          },
        ]}
      />,
    );

    expect(
      screen.getByText("machines · creative · crew · platform · reporting"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("the sale, nothing else to carry"),
    ).toBeInTheDocument();
  });
});
