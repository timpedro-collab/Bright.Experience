/**
 * Component tests for the InboxFilters control.
 *
 * Uses the global `useRouter` / `useSearchParams` mocks from
 * `vitest.setup.ts` — we override them per-test to capture the router
 * push and assert on the URL it produced.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import * as navigation from "next/navigation";
import { InboxFilters } from "./InboxFilters";

const push = vi.fn();
beforeEach(() => {
  push.mockClear();
  vi.spyOn(navigation, "useRouter").mockReturnValue({
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof navigation.useRouter>);
  vi.spyOn(navigation, "useSearchParams").mockReturnValue(
    new URLSearchParams() as unknown as ReturnType<typeof navigation.useSearchParams>
  );
});

const eventOptions = [
  { id: "evt-1", name: "Spring", accountName: "Acme" },
  { id: "evt-2", name: "Summer", accountName: null },
];

describe("InboxFilters", () => {
  it("renders all three filter selects with their canonical defaults", () => {
    render(<InboxFilters events={eventOptions} categories={["creative", "qa"]} />);
    expect(screen.getByText("Event")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("All events")).toBeInTheDocument();
    expect(screen.getByText("All categories")).toBeInTheDocument();
  });

  it("renders an option per event, with the account name prepended when present", () => {
    render(<InboxFilters events={eventOptions} categories={[]} />);
    expect(screen.getByText("Acme · Spring")).toBeInTheDocument();
    expect(screen.getByText("Summer")).toBeInTheDocument();
  });

  it("renders only the supplied category options", () => {
    render(<InboxFilters events={[]} categories={["creative", "qa"]} />);
    expect(screen.getByText("Creative")).toBeInTheDocument();
    expect(screen.getByText("QA")).toBeInTheDocument();
    expect(screen.queryByText("Operations")).not.toBeInTheDocument();
  });

  it("pushes a new URL when the event filter changes", async () => {
    const user = userEvent.setup();
    render(<InboxFilters events={eventOptions} categories={[]} />);
    const eventSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventSelect, "evt-2");
    expect(push).toHaveBeenCalledWith(expect.stringContaining("event=evt-2"));
  });

  it("clears the event param when 'all' is selected", async () => {
    vi.spyOn(navigation, "useSearchParams").mockReturnValue(
      new URLSearchParams("event=evt-1") as unknown as ReturnType<
        typeof navigation.useSearchParams
      >
    );
    const user = userEvent.setup();
    render(<InboxFilters events={eventOptions} categories={[]} />);
    const eventSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(eventSelect, "all");
    // Push should not include `event=`
    const calls = push.mock.calls.map((c) => c[0]);
    expect(calls.some((url) => /event=/.test(String(url)))).toBe(false);
  });

  it("clears the status param when 'open' (default) is selected", async () => {
    vi.spyOn(navigation, "useSearchParams").mockReturnValue(
      new URLSearchParams("status=recent") as unknown as ReturnType<
        typeof navigation.useSearchParams
      >
    );
    const user = userEvent.setup();
    render(<InboxFilters events={[]} categories={[]} />);
    const statusSelect = screen.getAllByRole("combobox")[2];
    await user.selectOptions(statusSelect, "open");
    const calls = push.mock.calls.map((c) => c[0]);
    expect(calls.some((url) => /status=/.test(String(url)))).toBe(false);
  });
});
