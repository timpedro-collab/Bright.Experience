/** Tests for the internal delivery-health flag control. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { EventHealthControl } from "./EventHealthControl";

const setEventHealth = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/events", () => ({
  setEventHealth: (...args: unknown[]) => setEventHealth(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

beforeEach(() => {
  setEventHealth.mockReset();
  setEventHealth.mockResolvedValue({ success: true, data: { status: "red" } });
  refresh.mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("EventHealthControl", () => {
  it("flags an event with the reason the user typed", async () => {
    const user = userEvent.setup();
    render(<EventHealthControl eventId={EVENT_ID} status="green" />);

    await user.type(
      screen.getByLabelText(/what's wrong/i),
      "Artwork still not signed off"
    );
    await user.click(screen.getByRole("button", { name: "Blocked" }));

    await waitFor(() =>
      expect(setEventHealth).toHaveBeenCalledWith({
        eventId: EVENT_ID,
        status: "red",
        reason: "Artwork still not signed off",
      })
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("offers no way to clear an event that is already on track", () => {
    render(<EventHealthControl eventId={EVENT_ID} status="green" />);
    expect(
      screen.queryByRole("button", { name: /clear flag/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/reads as on track/i)).toBeInTheDocument();
  });

  it("shows the standing flag and clears it without a reason", async () => {
    const user = userEvent.setup();
    render(
      <EventHealthControl
        eventId={EVENT_ID}
        status="amber"
        reason="Venue access unconfirmed"
      />
    );

    expect(screen.getByText(/Venue access unconfirmed/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear flag/i }));

    await waitFor(() =>
      expect(setEventHealth).toHaveBeenCalledWith({
        eventId: EVENT_ID,
        status: "green",
        reason: undefined,
      })
    );
  });

  it("surfaces the reason the server refused", async () => {
    setEventHealth.mockResolvedValue({
      success: false,
      error: "Say what's wrong so the team can pick it up",
    });
    const user = userEvent.setup();
    render(<EventHealthControl eventId={EVENT_ID} status="green" />);

    await user.click(screen.getByRole("button", { name: "At risk" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Say what's wrong so the team can pick it up"
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
