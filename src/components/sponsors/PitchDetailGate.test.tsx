/** Tests for the pitch detail gate — unlock flow and error handling. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { PitchDetailGate } from "./PitchDetailGate";

const unlockPitchDetails = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/sponsor-pitch", () => ({
  unlockPitchDetails: (...args: unknown[]) => unlockPitchDetails(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return { ...actual, useRouter: () => ({ refresh }) };
});

beforeEach(() => {
  vi.clearAllMocks();
  unlockPitchDetails.mockResolvedValue({ success: true, data: { slotId: "s1" } });
});

describe("PitchDetailGate", () => {
  it("submits identity and refreshes to reveal the numbers", async () => {
    const user = userEvent.setup();
    render(<PitchDetailGate token="tok-12345678901234567890" />);

    await user.type(screen.getByLabelText("Your name"), "Priya Shah");
    await user.type(screen.getByLabelText("Work email"), "priya@acme.test");
    await user.click(screen.getByRole("button", { name: /unlock the numbers/i }));

    await waitFor(() =>
      expect(unlockPitchDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "tok-12345678901234567890",
          contactName: "Priya Shah",
          email: "priya@acme.test",
        })
      )
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("shows the server error and does not refresh", async () => {
    unlockPitchDetails.mockResolvedValue({
      success: false,
      error: "This link has expired.",
    });
    const user = userEvent.setup();
    render(<PitchDetailGate token="tok-12345678901234567890" />);

    await user.type(screen.getByLabelText("Your name"), "Priya Shah");
    await user.type(screen.getByLabelText("Work email"), "priya@acme.test");
    await user.click(screen.getByRole("button", { name: /unlock the numbers/i }));

    expect(await screen.findByText("This link has expired.")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("pre-fills the company from the named sponsor", () => {
    render(
      <PitchDetailGate token="tok-12345678901234567890" sponsorName="Acme" />
    );
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
  });
});
