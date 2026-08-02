/** Tests for the native details-based disclosure. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { CollapsibleSection } from "./CollapsibleSection";

describe("CollapsibleSection", () => {
  it("renders the title and its content", () => {
    render(
      <CollapsibleSection title="Event details">
        <p>15 August 2026</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("Event details")).toBeInTheDocument();
    expect(screen.getByText("15 August 2026")).toBeInTheDocument();
  });

  it("is closed by default and open when defaultOpen is set", () => {
    const { container, rerender } = render(
      <CollapsibleSection title="The numbers">
        <p>content</p>
      </CollapsibleSection>,
    );
    expect(container.querySelector("details")?.open).toBe(false);

    rerender(
      <CollapsibleSection title="The numbers" defaultOpen>
        <p>content</p>
      </CollapsibleSection>,
    );
    expect(container.querySelector("details")?.open).toBe(true);
  });
});
