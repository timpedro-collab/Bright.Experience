import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  EditionBody,
  EditionChrome,
  EditionFooter,
  EditionShell,
  RidgeHero,
  ThreeColumn,
} from "./edition-shell";

describe("EditionShell", () => {
  it("applies the theme-light class when theme=light", () => {
    const { container } = render(
      <EditionShell theme="light">
        <p>hello</p>
      </EditionShell>,
    );
    expect(container.firstElementChild?.className).toContain("theme-light");
    expect(container.firstElementChild?.getAttribute("data-theme")).toBe("light");
  });

  it("omits the theme-light class when theme=dark", () => {
    const { container } = render(
      <EditionShell theme="dark">
        <p>hi</p>
      </EditionShell>,
    );
    expect(container.firstElementChild?.className).not.toContain("theme-light");
    expect(container.firstElementChild?.getAttribute("data-theme")).toBe("dark");
  });
});

describe("EditionChrome", () => {
  it("renders breadcrumbs and a right slot", () => {
    render(
      <EditionChrome
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Acme · Spring" },
        ]}
        rightSlot={<span>Sophie Turner</span>}
      />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Acme · Spring")).toBeInTheDocument();
    expect(screen.getByText("Sophie Turner")).toBeInTheDocument();
  });
});

describe("RidgeHero", () => {
  it("renders title, subtitle, eyebrow, and a deterministic ridge", () => {
    const { container } = render(
      <RidgeHero
        seed="evt-024"
        eyebrow="Welcome back"
        title="Spring is taking shape."
        subtitle="On track · 26 days to go."
        rightSlot={<span>On track · 26 days</span>}
      />,
    );
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Spring is taking shape.")).toBeInTheDocument();
    expect(screen.getByText("On track · 26 days to go.")).toBeInTheDocument();
    expect(screen.getByText("On track · 26 days")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("EditionBody", () => {
  it("wraps children", () => {
    render(<EditionBody><p>body content</p></EditionBody>);
    expect(screen.getByText("body content")).toBeInTheDocument();
  });
});

describe("ThreeColumn", () => {
  it("renders three labeled regions", () => {
    render(
      <ThreeColumn
        left={<span>left here</span>}
        center={<span>center here</span>}
        right={<span>right here</span>}
      />,
    );
    expect(screen.getByText("left here")).toBeInTheDocument();
    expect(screen.getByText("center here")).toBeInTheDocument();
    expect(screen.getByText("right here")).toBeInTheDocument();
  });
});

describe("EditionFooter", () => {
  it("renders bright.blue locations and the keyboard tail", () => {
    render(<EditionFooter />);
    expect(screen.getByText(/bright\.blue/)).toBeInTheDocument();
    expect(screen.getByText(/London · Milton Keynes/)).toBeInTheDocument();
    expect(screen.getByText(/⌘K to navigate/)).toBeInTheDocument();
  });

  it("accepts custom locations and a right slot", () => {
    render(
      <EditionFooter
        locations={["London"]}
        rightSlot={<span>Open the queue →</span>}
      />,
    );
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("Open the queue →")).toBeInTheDocument();
  });
});
