/** Tests for the internal quote → event workspace control. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { ConvertToEventCard } from "./ConvertToEventCard";

const convertQuoteToEvent = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/quotes", () => ({
  convertQuoteToEvent: (...args: unknown[]) =>
    convertQuoteToEvent(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const QUOTE_ID = "00000000-0000-4000-8000-0000000000q1";
const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

beforeEach(() => {
  convertQuoteToEvent.mockReset();
  convertQuoteToEvent.mockResolvedValue({
    success: true,
    data: { eventId: EVENT_ID, alreadyConverted: false },
  });
  refresh.mockReset();
  vi.mocked(toast.error).mockReset();
  vi.mocked(toast.success).mockReset();
});

describe("ConvertToEventCard", () => {
  it("creates the workspace and links straight to it", async () => {
    const user = userEvent.setup();
    render(
      <ConvertToEventCard
        quoteId={QUOTE_ID}
        status="accepted"
        eventId={null}
        contactName="Dana"
      />
    );

    await user.click(
      screen.getByRole("button", { name: /create the event workspace/i })
    );

    await waitFor(() =>
      expect(convertQuoteToEvent).toHaveBeenCalledWith(QUOTE_ID)
    );
    expect(refresh).toHaveBeenCalled();
    expect(
      await screen.findByRole("link", { name: /open the event/i })
    ).toHaveAttribute("href", `/events/${EVENT_ID}`);
  });

  it("links to the existing event instead of offering to create another", () => {
    render(
      <ConvertToEventCard
        quoteId={QUOTE_ID}
        status="accepted"
        eventId={EVENT_ID}
        contactName="Dana"
      />
    );

    expect(
      screen.getByRole("link", { name: /open the event/i })
    ).toHaveAttribute("href", `/events/${EVENT_ID}`);
    expect(
      screen.queryByRole("button", { name: /create the event workspace/i })
    ).not.toBeInTheDocument();
  });

  it("explains why a declined quote has no button", () => {
    render(
      <ConvertToEventCard
        quoteId={QUOTE_ID}
        status="declined"
        eventId={null}
        contactName="Dana"
      />
    );

    expect(screen.getByText(/no agreed booking/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create the event workspace/i })
    ).not.toBeInTheDocument();
  });

  it("surfaces the reason the server refused", async () => {
    convertQuoteToEvent.mockResolvedValue({
      success: false,
      error: "Failed to create customer account",
    });
    const user = userEvent.setup();
    render(
      <ConvertToEventCard
        quoteId={QUOTE_ID}
        status="submitted"
        eventId={null}
        contactName="Dana"
      />
    );

    await user.click(
      screen.getByRole("button", { name: /create the event workspace/i })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to create customer account"
      )
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("link", { name: /open the event/i })
    ).not.toBeInTheDocument();
  });

  it("says so when the quote already had an event behind it", async () => {
    convertQuoteToEvent.mockResolvedValue({
      success: true,
      data: { eventId: EVENT_ID, alreadyConverted: true },
    });
    const user = userEvent.setup();
    render(
      <ConvertToEventCard
        quoteId={QUOTE_ID}
        status="booked"
        eventId={null}
        contactName="Dana"
      />
    );

    await user.click(
      screen.getByRole("button", { name: /create the event workspace/i })
    );

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "This quote already had an event."
      )
    );
  });
});
