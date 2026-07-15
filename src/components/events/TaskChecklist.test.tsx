/**
 * Component tests for the optimistic task checklist — status flips are
 * visible before the server action resolves, revert on failure, and the
 * skip toast carries a working Undo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { TaskChecklist } from "./TaskChecklist";
import { makeTask } from "@/test/fixtures";

const completeTask = vi.fn();
const skipTask = vi.fn();
const startTask = vi.fn();
const reopenTask = vi.fn();

vi.mock("@/app/actions/tasks", () => ({
  completeTask: (...args: unknown[]) => completeTask(...args),
  skipTask: (...args: unknown[]) => skipTask(...args),
  startTask: (...args: unknown[]) => startTask(...args),
  reopenTask: (...args: unknown[]) => reopenTask(...args),
}));

vi.mock("@/lib/celebrate", () => ({
  celebrateFromElement: vi.fn(),
  celebrateBig: vi.fn(),
}));

beforeEach(() => {
  completeTask.mockReset();
  skipTask.mockReset();
  startTask.mockReset();
  reopenTask.mockReset();
});

describe("TaskChecklist — optimistic completion", () => {
  it("moves a task into Completed before the server action resolves", async () => {
    // Deferred action: whatever renders while it's in flight is purely
    // optimistic. Resolved at the end so no transition leaks into other tests.
    let settle: (v: { success: boolean; data: undefined }) => void = () => {};
    completeTask.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      })
    );
    const task = makeTask({ status: "in_progress", title: "Upload hero asset" });

    render(<TaskChecklist tasks={[task]} />);
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /done/i }));

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    settle({ success: true, data: undefined });
  });

  it("reverts the flip and shows an error toast when the action fails", async () => {
    completeTask.mockResolvedValue({
      success: false,
      error: "This task is locked",
    });
    const task = makeTask({ status: "in_progress", title: "Upload hero asset" });

    render(<TaskChecklist tasks={[task]} />);
    await userEvent.click(screen.getByRole("button", { name: /done/i }));

    expect(await screen.findByText("This task is locked")).toBeInTheDocument();
    // Optimistic state rolled back — the task is open again.
    await waitFor(
      () => expect(screen.queryByText("Completed")).not.toBeInTheDocument(),
      { timeout: 4000 }
    );
  });
});

describe("TaskChecklist — undo", () => {
  it("skip toast offers Undo, which reopens the task", async () => {
    skipTask.mockResolvedValue({ success: true, data: undefined });
    reopenTask.mockResolvedValue({ success: true, data: undefined });
    const task = makeTask({
      status: "pending",
      taskType: "internal_action",
      title: "Configure game logic",
    });

    render(
      <TaskChecklist tasks={[task]} showInternalTasks isInternal viewerRole="events_lead" />
    );
    await userEvent.click(screen.getByRole("button", { name: /skip/i }));

    const undo = await screen.findByRole("button", { name: /undo/i });
    await userEvent.click(undo);

    await waitFor(() =>
      expect(reopenTask).toHaveBeenCalledWith(task.id, "pending")
    );
  });
});
