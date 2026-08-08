/** Tests for the Wrapped share actions — clipboard copy and card download. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";
import { WrappedShareActions } from "./WrappedShareActions";

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
});

describe("WrappedShareActions", () => {
  it("copies the share text to the clipboard and confirms", async () => {
    const user = userEvent.setup();
    // userEvent.setup() installs its own clipboard stub, so ours must land after it.
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    render(
      <WrappedShareActions shareText="400 leads at Acme." cardUrl="/card" />
    );
    await user.click(screen.getByRole("button", { name: /copy the post text/i }));
    expect(writeText).toHaveBeenCalledWith("400 leads at Acme.");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });

  it("links the card download to the image route", () => {
    render(
      <WrappedShareActions shareText="x" cardUrl="/api/reports/t/wrapped-card" />
    );
    expect(
      screen.getByRole("link", { name: /download the card/i })
    ).toHaveAttribute("href", "/api/reports/t/wrapped-card");
  });
});
