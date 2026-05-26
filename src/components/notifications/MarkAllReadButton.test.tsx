/**
 * Component tests for the Mark-All-Read button.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";

const markAllRead = vi.fn();
vi.mock("@/app/actions/notifications", () => ({
  markAllRead: () => markAllRead(),
}));

describe("MarkAllReadButton", () => {
  it("renders the button with its label", async () => {
    const { MarkAllReadButton } = await import("./MarkAllReadButton");
    render(<MarkAllReadButton />);
    expect(
      screen.getByRole("button", { name: /Mark all read/i })
    ).toBeInTheDocument();
  });

  it("calls markAllRead when clicked", async () => {
    const user = userEvent.setup();
    const { MarkAllReadButton } = await import("./MarkAllReadButton");
    render(<MarkAllReadButton />);
    await user.click(screen.getByRole("button"));
    expect(markAllRead).toHaveBeenCalledTimes(1);
  });
});
