/** Tests for the focus-list snooze control. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const snoozeTask = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/tasks", () => ({
  snoozeTask: (...args: unknown[]) => snoozeTask(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  snoozeTask.mockReset();
  refresh.mockReset();
});

describe("SnoozeTaskControl", () => {
  it("opens the menu and snoozes for one day on selection", async () => {
    snoozeTask.mockResolvedValue({
      success: true,
      data: { snoozedUntil: "2026-08-02T12:00:00.000Z" },
    });
    const user = userEvent.setup();
    const { SnoozeTaskControl } = await import("./SnoozeTaskControl");

    render(<SnoozeTaskControl taskId="task-abc" />);

    await user.click(screen.getByRole("button", { name: /snooze task/i }));
    await user.click(screen.getByRole("menuitem", { name: /snooze 1 day/i }));

    expect(snoozeTask).toHaveBeenCalledWith(
      "task-abc",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces an error toast when snooze fails", async () => {
    const { toast } = await import("sonner");
    snoozeTask.mockResolvedValue({ success: false, error: "Could not snooze that task." });
    const user = userEvent.setup();
    const { SnoozeTaskControl } = await import("./SnoozeTaskControl");

    render(<SnoozeTaskControl taskId="task-abc" />);

    await user.click(screen.getByRole("button", { name: /snooze task/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /snooze until monday/i }),
    );

    expect(toast.error).toHaveBeenCalledWith("Could not snooze that task.");
    expect(refresh).not.toHaveBeenCalled();
  });
});
