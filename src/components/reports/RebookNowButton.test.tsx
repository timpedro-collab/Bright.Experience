/** The one-click rebook button — fires the action and settles into a calm confirmation. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";

import { RebookNowButton } from "./RebookNowButton";

const createRebookQuote = vi.fn();
vi.mock("@/app/actions/quotes/rebook", () => ({
  createRebookQuote: (...args: unknown[]) => createRebookQuote(...args),
}));

beforeEach(() => {
  createRebookQuote.mockReset();
});

describe("RebookNowButton", () => {
  it("starts a rebook and confirms without navigating away", async () => {
    createRebookQuote.mockResolvedValue({ success: true, data: { id: "q1" } });
    const user = userEvent.setup();
    render(<RebookNowButton eventId="e1" />);

    await user.click(
      screen.getByRole("button", { name: /rebook this activation/i }),
    );

    expect(createRebookQuote).toHaveBeenCalledWith("e1");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /rebook started/i,
    );
  });

  it("keeps the button and shows an error message when the action fails", async () => {
    createRebookQuote.mockResolvedValue({ success: false, error: "nope" });
    const user = userEvent.setup();
    render(<RebookNowButton eventId="e1" />);

    await user.click(
      screen.getByRole("button", { name: /rebook this activation/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
    expect(
      screen.getByRole("button", { name: /rebook this activation/i }),
    ).toBeInTheDocument();
  });
});
