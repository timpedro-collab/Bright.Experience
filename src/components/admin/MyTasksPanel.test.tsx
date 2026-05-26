/**
 * Component tests for the dashboard MyTasksPanel.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { MyTasksPanel } from "./MyTasksPanel";
import type { AssignedTaskWithContext } from "@/lib/queries/tasks";
import { makeTask } from "@/test/fixtures";

function withContext(
  base: ReturnType<typeof makeTask>,
  ctx: Partial<AssignedTaskWithContext> = {}
): AssignedTaskWithContext {
  return {
    ...base,
    eventName: ctx.eventName ?? "Spring Activation",
    accountName: ctx.accountName ?? "Acme",
  };
}

describe("MyTasksPanel — empty state", () => {
  it("shows the inbox-zero copy when no tasks", () => {
    render(<MyTasksPanel tasks={[]} totalCount={0} />);
    expect(screen.getByText(/Inbox zero across every event/i)).toBeInTheDocument();
    expect(screen.getByText(/No tasks on your plate/i)).toBeInTheDocument();
  });

  it("hides the See all link when totalCount is 0", () => {
    render(<MyTasksPanel tasks={[]} totalCount={0} />);
    expect(screen.queryByText(/See all/i)).not.toBeInTheDocument();
  });
});

describe("MyTasksPanel — populated", () => {
  const tasks: AssignedTaskWithContext[] = [
    withContext(makeTask({ id: "t1", title: "Upload hero" })),
    withContext(makeTask({ id: "t2", title: "Approve copy" })),
  ];

  it("renders the total count summary", () => {
    render(<MyTasksPanel tasks={tasks} totalCount={2} />);
    expect(
      screen.getByText(/2 open tasks across events/i)
    ).toBeInTheDocument();
  });

  it("singularises for a single task", () => {
    render(<MyTasksPanel tasks={tasks.slice(0, 1)} totalCount={1} />);
    expect(
      screen.getByText(/1 open task across events/i)
    ).toBeInTheDocument();
  });

  it("renders each task title and event name", () => {
    render(<MyTasksPanel tasks={tasks} totalCount={2} />);
    expect(screen.getByText("Upload hero")).toBeInTheDocument();
    expect(screen.getByText("Approve copy")).toBeInTheDocument();
    expect(screen.getAllByText(/Spring Activation/i).length).toBe(2);
  });

  it("each task links to its event actions page", () => {
    render(<MyTasksPanel tasks={tasks} totalCount={2} />);
    const links = screen.getAllByRole("link");
    // First should be "See all" → /inbox; remaining are per-task
    expect(links.some((a) => a.getAttribute("href") === "/inbox")).toBe(true);
    expect(
      links.some((a) => a.getAttribute("href")?.includes("/events/"))
    ).toBe(true);
  });

  it("renders 'Critical' chip for critical-priority tasks", () => {
    const critical: AssignedTaskWithContext[] = [
      withContext(makeTask({ id: "tc", title: "Stop the bus", priority: "critical" })),
    ];
    render(<MyTasksPanel tasks={critical} totalCount={1} />);
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("renders 'Overdue' chip for overdue tasks", () => {
    const overdue: AssignedTaskWithContext[] = [
      withContext(makeTask({ id: "to", dueDate: "2020-01-01" })),
    ];
    render(<MyTasksPanel tasks={overdue} totalCount={1} />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("shows hidden-count tail when more than MAX_VISIBLE tasks", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      withContext(makeTask({ id: `t${i}`, title: `Task ${i}` }))
    );
    render(<MyTasksPanel tasks={many} totalCount={15} />);
    expect(screen.getByText(/\+ 7 more open tasks/i)).toBeInTheDocument();
  });
});
