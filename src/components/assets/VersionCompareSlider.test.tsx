/** Tests for the version compare slider — keyboard sweep and version chips. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import userEvent from "@testing-library/user-event";

import { VersionCompareSlider } from "./VersionCompareSlider";

const PROPS = {
  before: { label: "v2", url: "/uploads/wrap-v2.png" },
  after: { label: "v3", url: "/uploads/wrap-v3.png" },
};

describe("VersionCompareSlider", () => {
  it("shows both versions with their labels, starting at the midpoint", () => {
    render(<VersionCompareSlider {...PROPS} />);
    expect(screen.getByAltText("Version v2")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("v3")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
  });

  it("sweeps the reveal line with arrow keys and snaps with Home/End", async () => {
    const user = userEvent.setup();
    render(<VersionCompareSlider {...PROPS} />);
    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "54");

    await user.keyboard("{ArrowLeft}");
    expect(slider).toHaveAttribute("aria-valuenow", "52");

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute("aria-valuenow", "0");

    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");
  });
});
