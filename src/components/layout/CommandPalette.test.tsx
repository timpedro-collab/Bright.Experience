/**
 * Tests for the command palette's global keyboard shortcuts — the G-then-X
 * navigation sequences and the "?" shortcuts overlay.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/render";
import { CommandPalette } from "./CommandPalette";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("CommandPalette global shortcuts", () => {
  it("G then E navigates to the workspace home", () => {
    render(<CommandPalette isInternal role="admin" />);
    fireEvent.keyDown(document, { key: "g" });
    fireEvent.keyDown(document, { key: "e" });
    expect(push).toHaveBeenCalledWith("/");
  });

  it("G then N navigates to notifications", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "g" });
    fireEvent.keyDown(document, { key: "n" });
    expect(push).toHaveBeenCalledWith("/notifications");
  });

  it("G then I opens the inbox for internal users only", () => {
    const { unmount } = render(<CommandPalette isInternal role="events_lead" />);
    fireEvent.keyDown(document, { key: "g" });
    fireEvent.keyDown(document, { key: "i" });
    expect(push).toHaveBeenCalledWith("/inbox");

    unmount();
    push.mockReset();
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "g" });
    fireEvent.keyDown(document, { key: "i" });
    expect(push).not.toHaveBeenCalled();
  });

  it("a lone destination key does nothing without the G prefix", () => {
    render(<CommandPalette isInternal role="admin" />);
    fireEvent.keyDown(document, { key: "e" });
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores sequences typed inside a text input", () => {
    render(
      <div>
        <input aria-label="Search" />
        <CommandPalette isInternal role="admin" />
      </div>
    );
    const input = screen.getByLabelText("Search");
    fireEvent.keyDown(input, { key: "g" });
    fireEvent.keyDown(input, { key: "e" });
    expect(push).not.toHaveBeenCalled();
  });

  it("? opens the keyboard shortcuts overlay", async () => {
    render(<CommandPalette isInternal role="admin" />);
    fireEvent.keyDown(document, { key: "?" });
    expect(await screen.findByText("Keyboard shortcuts")).toBeInTheDocument();
    expect(screen.getByText(/go to inbox/i)).toBeInTheDocument();
  });
});
