/** Tests for one-click add-ons on an accepted proposal. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render as rtlRender } from "@testing-library/react";
import { render, screen, userEvent, within } from "@/test/render";
import { CAPABILITIES } from "@/lib/capabilities";
import { AcceptedAddOns } from "./AcceptedAddOns";
import { updateQuoteCapabilities } from "@/app/actions/quotes";

vi.mock("@/app/actions/quotes", () => ({
  updateQuoteCapabilities: vi.fn(),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const mockedUpdateQuoteCapabilities = vi.mocked(updateQuoteCapabilities);

describe("AcceptedAddOns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers only the capabilities not already on the quote", () => {
    render(
      <AcceptedAddOns quoteId="quote-1" currentAddons={["lead-capture"]} />
    );

    expect(
      screen.queryByText("Capture opted-in leads on every play")
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Your team sees every lead the moment it lands")
    ).toBeInTheDocument();
  });

  it("adds a capability and reflects the server's new list", async () => {
    mockedUpdateQuoteCapabilities.mockResolvedValue({
      success: true,
      data: { id: "quote-1", addons: ["lead-capture", "live-telemetry"] },
    });

    render(
      <AcceptedAddOns quoteId="quote-1" currentAddons={["lead-capture"]} />
    );

    const row = screen
      .getByText("Your team sees every lead the moment it lands")
      .closest("li");
    expect(row).toBeTruthy();
    await userEvent.click(within(row!).getByRole("button", { name: /^add$/i }));

    expect(mockedUpdateQuoteCapabilities).toHaveBeenCalledWith("quote-1", [
      "lead-capture",
      "live-telemetry",
    ]);
    expect(
      screen.queryByText("Your team sees every lead the moment it lands")
    ).not.toBeInTheDocument();
  });

  it("surfaces a failure without changing the list", async () => {
    mockedUpdateQuoteCapabilities.mockResolvedValue({
      success: false,
      error: "nope",
    });

    render(
      <AcceptedAddOns quoteId="quote-1" currentAddons={["lead-capture"]} />
    );

    const row = screen
      .getByText("Your team sees every lead the moment it lands")
      .closest("li");
    expect(row).toBeTruthy();
    await userEvent.click(within(row!).getByRole("button", { name: /^add$/i }));

    expect(
      screen.getByText("Your team sees every lead the moment it lands")
    ).toBeInTheDocument();
  });

  it("renders nothing when every capability is already included", () => {
    const allSlugs = CAPABILITIES.map((c) => c.slug);
    const { container } = rtlRender(
      <AcceptedAddOns quoteId="quote-1" currentAddons={allSlugs} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
