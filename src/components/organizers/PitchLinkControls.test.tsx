/** Tests for the shared sponsor pitch-link controls. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { toast } from "sonner";
import { PitchLinkControls } from "./PitchLinkControls";

const shareSlotPitch = vi.fn();
const revokeSlotPitch = vi.fn();
const refresh = vi.fn();
const writeText = vi.fn(async () => {});

vi.mock("@/app/actions/organizers", () => ({
  shareSlotPitch: (...args: unknown[]) => shareSlotPitch(...args),
  revokeSlotPitch: (...args: unknown[]) => revokeSlotPitch(...args),
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

/** A month out, so the "expires in N days" copy has something real to say. */
const LIVE_EXPIRY = new Date(Date.now() + 12 * 86_400_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
  shareSlotPitch.mockResolvedValue({ success: true, data: { token: "tok-new" } });
  revokeSlotPitch.mockResolvedValue({ success: true, data: { id: "s1" } });
});

describe("PitchLinkControls", () => {
  it("offers only creation until a link exists", () => {
    render(<PitchLinkControls slotId="s1" pitchToken={null} />);

    expect(
      screen.getByRole("button", { name: /create pitch link/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /copy link/i })
    ).not.toBeInTheDocument();
  });

  it("creates a link and refreshes the surface it sits on", async () => {
    const user = userEvent.setup();
    render(<PitchLinkControls slotId="s1" pitchToken={null} />);

    await user.click(screen.getByRole("button", { name: /create pitch link/i }));

    await waitFor(() => expect(shareSlotPitch).toHaveBeenCalledWith("s1"));
    expect(toast.success).toHaveBeenCalledWith("Pitch link created");
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a failure instead of pretending the link exists", async () => {
    shareSlotPitch.mockResolvedValueOnce({
      success: false,
      error: "Failed to create the pitch link",
    });
    const user = userEvent.setup();
    render(<PitchLinkControls slotId="s1" pitchToken={null} />);

    await user.click(screen.getByRole("button", { name: /create pitch link/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to create the pitch link")
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("offers copy, rotate and revoke once a link exists", () => {
    render(
      <PitchLinkControls
        slotId="s1"
        pitchToken="tok-123"
        expiresAt={LIVE_EXPIRY}
      />
    );

    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rotate pitch link/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /revoke pitch link/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create pitch link/i })
    ).not.toBeInTheDocument();
  });

  it("copies the full pitch URL to the clipboard", async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard stub, so ours has to land after it.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(<PitchLinkControls slotId="s1" pitchToken="tok-123" />);

    await user.click(screen.getByRole("button", { name: /copy link/i }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/sponsor/tok-123`
      )
    );
    expect(toast.success).toHaveBeenCalledWith("Link copied");
  });

  it("says the link was rotated, not created", async () => {
    const user = userEvent.setup();
    render(<PitchLinkControls slotId="s1" pitchToken="tok-123" />);

    await user.click(screen.getByRole("button", { name: /rotate pitch link/i }));

    await waitFor(() => expect(shareSlotPitch).toHaveBeenCalledWith("s1"));
    expect(toast.success).toHaveBeenCalledWith("Pitch link rotated");
  });

  it("revokes the link", async () => {
    const user = userEvent.setup();
    render(<PitchLinkControls slotId="s1" pitchToken="tok-123" />);

    await user.click(screen.getByRole("button", { name: /revoke pitch link/i }));

    await waitFor(() => expect(revokeSlotPitch).toHaveBeenCalledWith("s1"));
    expect(toast.success).toHaveBeenCalledWith("Pitch link revoked");
    expect(refresh).toHaveBeenCalled();
  });

  it("puts the expiry on screen, because the link stops working", () => {
    render(
      <PitchLinkControls
        slotId="s1"
        pitchToken="tok-123"
        expiresAt={LIVE_EXPIRY}
      />
    );

    expect(screen.getByText(/expires in 12 days/i)).toBeInTheDocument();
  });

  it("tells the organizer to rotate an expired link", () => {
    render(
      <PitchLinkControls
        slotId="s1"
        pitchToken="tok-123"
        expiresAt="2020-01-01T00:00:00.000Z"
      />
    );

    expect(screen.getByText(/has expired/i)).toBeInTheDocument();
  });
});
