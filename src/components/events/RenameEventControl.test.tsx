/** The inline rename affordance — pencil, inline input, one action call. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";

import { RenameEventControl } from "./RenameEventControl";

const renameEvent = vi.fn();
vi.mock("@/app/actions/events", () => ({
  renameEvent: (...args: unknown[]) => renameEvent(...args),
}));

beforeEach(() => {
  renameEvent.mockReset();
});

describe("RenameEventControl", () => {
  it("enters edit mode with the current name pre-filled", async () => {
    const user = userEvent.setup();
    render(<RenameEventControl eventId="e1" name="Spring Launch" />);

    await user.click(screen.getByRole("button", { name: /rename event/i }));

    expect(screen.getByRole("textbox", { name: /event name/i })).toHaveValue(
      "Spring Launch",
    );
  });

  it("submits the new name and calls the rename action", async () => {
    renameEvent.mockResolvedValue({
      success: true,
      data: { name: "Autumn Roadshow" },
    });
    const user = userEvent.setup();
    render(<RenameEventControl eventId="e1" name="Spring Launch" />);

    await user.click(screen.getByRole("button", { name: /rename event/i }));
    const input = screen.getByRole("textbox", { name: /event name/i });
    await user.clear(input);
    await user.type(input, "Autumn Roadshow");
    await user.click(screen.getByRole("button", { name: /save name/i }));

    expect(renameEvent).toHaveBeenCalledWith("e1", "Autumn Roadshow");
    // Back to display mode — the pencil returns, the input goes.
    expect(
      await screen.findByRole("button", { name: /rename event/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /event name/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the action's error and stays in edit mode when it fails", async () => {
    renameEvent.mockResolvedValue({ success: false, error: "Not authorised" });
    const user = userEvent.setup();
    render(<RenameEventControl eventId="e1" name="Spring Launch" />);

    await user.click(screen.getByRole("button", { name: /rename event/i }));
    await user.click(screen.getByRole("button", { name: /save name/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /not authorised/i,
    );
    expect(
      screen.getByRole("textbox", { name: /event name/i }),
    ).toBeInTheDocument();
  });

  it("cancels back to the pencil without calling the action", async () => {
    const user = userEvent.setup();
    render(<RenameEventControl eventId="e1" name="Spring Launch" />);

    await user.click(screen.getByRole("button", { name: /rename event/i }));
    await user.click(screen.getByRole("button", { name: /cancel rename/i }));

    expect(renameEvent).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /rename event/i }),
    ).toBeInTheDocument();
  });
});
