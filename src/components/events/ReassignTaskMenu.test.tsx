/**
 * Component tests for the orchestrator task-reassignment menu.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import * as navigation from "next/navigation";

const reassignTask = vi.fn();
vi.mock("@/app/actions/tasks", () => ({
  reassignTask: (...args: unknown[]) => reassignTask(...args),
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
  reassignTask.mockReset();
  reassignTask.mockResolvedValue({ success: true, data: undefined });
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

const TASK_ID = "d6666666-6666-6666-6666-666666666666";

describe("ReassignTaskMenu", () => {
  it("opens a team list with the current lane disabled", async () => {
    const user = userEvent.setup();
    const { ReassignTaskMenu } = await import("./ReassignTaskMenu");
    render(<ReassignTaskMenu taskId={TASK_ID} currentCategory="creative" />);

    await user.click(screen.getByRole("button", { name: /Reassign/i }));

    const current = await screen.findByRole("menuitem", {
      name: /Bright\.Blue creative/i,
    });
    expect(current).toHaveAttribute("data-disabled");
    expect(
      screen.getByRole("menuitem", { name: /Operations/i }),
    ).toBeInTheDocument();
  });

  it("calls reassignTask with the chosen team lane", async () => {
    const user = userEvent.setup();
    const { ReassignTaskMenu } = await import("./ReassignTaskMenu");
    render(<ReassignTaskMenu taskId={TASK_ID} currentCategory="creative" />);

    await user.click(screen.getByRole("button", { name: /Reassign/i }));
    await user.click(await screen.findByRole("menuitem", { name: /^QA$/i }));

    await waitFor(() => {
      expect(reassignTask).toHaveBeenCalledWith({
        taskId: TASK_ID,
        category: "qa",
      });
    });
  });
});
