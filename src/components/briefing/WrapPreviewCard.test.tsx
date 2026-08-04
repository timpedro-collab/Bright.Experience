/** Tests for the instant wrap preview. */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WrapPreviewCard, firstBrandHex } from "./WrapPreviewCard";

describe("firstBrandHex", () => {
  it("returns the first valid hex, normalised", () => {
    expect(firstBrandHex("warm reds, #E61A27, #111")).toBe("#E61A27");
    expect(firstBrandHex("e61a27")).toBe("#e61a27");
    expect(firstBrandHex("#f0a")).toBe("#ff00aa");
  });

  it("returns null when no token is a hex", () => {
    expect(firstBrandHex("warm reds and golds")).toBeNull();
    expect(firstBrandHex("")).toBeNull();
  });
});

describe("WrapPreviewCard", () => {
  it("seeds the wrap colour from the brief", () => {
    render(
      <WrapPreviewCard machineType="experience-portal" colorPreferences="#E61A27" />,
    );
    expect(screen.getByTestId("wrap-colour-panel")).toHaveStyle({
      backgroundColor: "#E61A27",
    });
    expect(
      screen.getByText("Seeded from your brand colours — try variations."),
    ).toBeInTheDocument();
  });

  it("falls back to brand blue and prompts for colours", () => {
    render(<WrapPreviewCard colorPreferences="playful and warm" />);
    expect(screen.getByTestId("wrap-colour-panel")).toHaveStyle({
      backgroundColor: "#246BFD",
    });
    expect(
      screen.getByText(
        "Add brand colours to your brief to seed this automatically.",
      ),
    ).toBeInTheDocument();
  });

  it("updates the panel when the customer picks a colour", () => {
    render(<WrapPreviewCard colorPreferences="#E61A27" />);
    fireEvent.change(screen.getByLabelText("Wrap colour"), {
      target: { value: "#00ff00" },
    });
    expect(screen.getByTestId("wrap-colour-panel")).toHaveStyle({
      backgroundColor: "#00ff00",
    });
  });

  it("composites the uploaded logo when one exists", () => {
    render(
      <WrapPreviewCard
        colorPreferences="#E61A27"
        logoUrl="https://example.com/logo.png"
      />,
    );
    expect(screen.getByAltText("Your logo on the wrap")).toHaveAttribute(
      "src",
      "https://example.com/logo.png",
    );
  });
});
