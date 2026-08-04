/** Tests for live-dashboard share-link controls. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { toast } from "sonner";
import { LiveShareControls } from "./LiveShareControls";

const issueLiveShareLink = vi.fn();
const revokeLiveShareLink = vi.fn();
const refresh = vi.fn();
const writeText = vi.fn(async () => {});

vi.mock("@/app/actions/live-share", () => ({
  issueLiveShareLink: (...args: unknown[]) => issueLiveShareLink(...args),
  revokeLiveShareLink: (...args: unknown[]) => revokeLiveShareLink(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return { ...actual, useRouter: () => ({ refresh }) };
});

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { ...actual.toast, success: vi.fn(), error: vi.fn() },
  };
});

const EVENT_ID = "eeeeeeee-1111-4111-8111-111111111111";
const TOKEN = "11111111-1111-4111-8111-111111111111";
const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  issueLiveShareLink.mockResolvedValue({
    success: true,
    data: { token: TOKEN, expiresAt: FUTURE },
  });
  revokeLiveShareLink.mockResolvedValue({ success: true, data: undefined });
});

describe("LiveShareControls", () => {
  it("creates a link and refreshes the page", async () => {
    const user = userEvent.setup();
    render(<LiveShareControls eventId={EVENT_ID} token={null} expiresAt={null} />);

    await user.click(screen.getByRole("button", { name: /create share link/i }));

    await waitFor(() => expect(issueLiveShareLink).toHaveBeenCalledWith(EVENT_ID));
    expect(toast.success).toHaveBeenCalledWith("Share link created");
    expect(refresh).toHaveBeenCalled();
  });

  it("copies the full live URL to the clipboard", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(
      <LiveShareControls eventId={EVENT_ID} token={TOKEN} expiresAt={FUTURE} />,
    );

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/live/${TOKEN}`,
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Link copied");
  });

  it("revokes the link via the server action", async () => {
    const user = userEvent.setup();
    render(
      <LiveShareControls eventId={EVENT_ID} token={TOKEN} expiresAt={FUTURE} />,
    );

    await user.click(screen.getByRole("button", { name: /revoke share link/i }));

    await waitFor(() => expect(revokeLiveShareLink).toHaveBeenCalledWith(EVENT_ID));
    expect(toast.success).toHaveBeenCalledWith("Share link revoked");
    expect(refresh).toHaveBeenCalled();
  });
});
