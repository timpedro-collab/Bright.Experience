/** Tests for the champion copy-paste summary card. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { ChampionSummaryCard } from "./ChampionSummaryCard";

const writeText = vi.fn();

describe("ChampionSummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
      writable: true,
    });
  });

  it("renders every summary line", () => {
    const lines = ["Line one", "Line two", "Line three"];
    render(<ChampionSummaryCard lines={lines} />);

    for (const line of lines) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });

  it("copies the summary as plain text", async () => {
    const lines = ["Activation at CES", "£45k all-in", "Live in 6 weeks"];
    render(<ChampionSummaryCard lines={lines} />);

    await userEvent.click(screen.getByRole("button", { name: /copy summary/i }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(lines.join("\n"));
    expect(screen.getByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
