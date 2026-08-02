/**
 * Component tests for the briefing change-request panel (shown once a brief is
 * locked for build).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";

const requestBriefingChange = vi.fn();
vi.mock("@/app/actions/briefing", () => ({
  requestBriefingChange: (...args: unknown[]) => requestBriefingChange(...args),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { ...actual.toast, success: vi.fn(), error: vi.fn() },
  };
});

beforeEach(() => {
  requestBriefingChange.mockReset();
  requestBriefingChange.mockResolvedValue({ success: true, data: { id: "m1" } });
});

describe("RequestChangePanel", () => {
  it("shows the locked explanation and a request button before expanding", async () => {
    const { RequestChangePanel } = await import("./RequestChangePanel");
    render(<RequestChangePanel eventId="e1" formType="ops" />);
    expect(screen.getByText(/Locked for build/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Request a change/i }),
    ).toBeInTheDocument();
    // The note field is hidden until the customer opts in.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("sends the typed note to the change-request action and confirms success", async () => {
    const user = userEvent.setup();
    const { RequestChangePanel } = await import("./RequestChangePanel");
    render(<RequestChangePanel eventId="e-42" formType="ops" />);

    await user.click(screen.getByRole("button", { name: /Request a change/i }));
    await user.type(
      screen.getByRole("textbox"),
      "Onsite contact is now Priya, 07700 900999",
    );
    await user.click(screen.getByRole("button", { name: /Send request/i }));

    await waitFor(() => {
      expect(requestBriefingChange).toHaveBeenCalledWith(
        "e-42",
        "ops",
        "Onsite contact is now Priya, 07700 900999",
      );
    });
    expect(await screen.findByText(/Change request sent/i)).toBeInTheDocument();
  });

  it("does not call the action when the note is empty", async () => {
    const user = userEvent.setup();
    const { RequestChangePanel } = await import("./RequestChangePanel");
    render(<RequestChangePanel eventId="e1" formType="creative" />);

    await user.click(screen.getByRole("button", { name: /Request a change/i }));
    await user.click(screen.getByRole("button", { name: /Send request/i }));

    expect(requestBriefingChange).not.toHaveBeenCalled();
  });
});
