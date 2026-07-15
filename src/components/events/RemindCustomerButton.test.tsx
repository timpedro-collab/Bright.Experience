/**
 * Component tests for the internal "Send reminder" button.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import * as navigation from "next/navigation";

const remindCustomerTask = vi.fn();
vi.mock("@/app/actions/tasks", () => ({
  remindCustomerTask: (...args: unknown[]) => remindCustomerTask(...args),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { ...actual.toast, success: vi.fn(), error: vi.fn() },
  };
});

const refresh = vi.fn();

beforeEach(() => {
  remindCustomerTask.mockReset();
  remindCustomerTask.mockResolvedValue({ success: true, data: undefined });
  refresh.mockReset();
  vi.spyOn(navigation, "useRouter").mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    refresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof navigation.useRouter>);
});

describe("RemindCustomerButton", () => {
  it("renders the Send reminder label", async () => {
    const { RemindCustomerButton } = await import("./RemindCustomerButton");
    render(<RemindCustomerButton taskId="task-1" />);
    expect(
      screen.getByRole("button", { name: /Send reminder/i }),
    ).toBeInTheDocument();
  });

  it("calls remindCustomerTask with the task id on click", async () => {
    const user = userEvent.setup();
    const { RemindCustomerButton } = await import("./RemindCustomerButton");
    render(<RemindCustomerButton taskId="task-42" />);
    await user.click(screen.getByRole("button", { name: /Send reminder/i }));
    await waitFor(() => {
      expect(remindCustomerTask).toHaveBeenCalledWith("task-42");
    });
  });
});
