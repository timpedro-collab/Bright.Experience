import { describe, it, expect } from "vitest";
import { render, screen, userEvent, waitForElementToBeRemoved } from "@/test/render";
import { MediaGallery, type MediaItem } from "./MediaGallery";

const ITEMS: MediaItem[] = [
  { url: "/a.jpg", type: "image", alt: "Claw machine on a show floor" },
  { url: "/b.jpg", type: "image", alt: "Queue at the stand" },
  { url: "/c.mp4", type: "video", poster: "/c.jpg" },
];

describe("MediaGallery", () => {
  it("renders nothing when there is no media", () => {
    render(<MediaGallery items={[]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("names each thumbnail so it can be reached without sight", () => {
    render(<MediaGallery items={ITEMS} />);
    expect(
      screen.getByRole("button", { name: "Open image: Claw machine on a show floor" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open video 3 of 3" })).toBeInTheDocument();
  });

  it("opens the viewer as a labelled dialog", async () => {
    const user = userEvent.setup();
    render(<MediaGallery items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: /Open image: Queue at the stand/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Media viewer: Queue at the stand");
  });

  it("moves between items with the arrow keys and wraps around", async () => {
    const user = userEvent.setup();
    render(<MediaGallery items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: /Open image: Claw machine/ }));
    await screen.findByRole("dialog");

    await user.keyboard("{ArrowRight}");
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(
      "Media viewer: Queue at the stand"
    );

    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(
      "Media viewer: Claw machine on a show floor"
    );

    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Media viewer");
  });

  it("closes on Escape and hands focus back to the thumbnail", async () => {
    const user = userEvent.setup();
    render(<MediaGallery items={ITEMS} />);
    const thumb = screen.getByRole("button", { name: /Open image: Claw machine/ });
    await user.click(thumb);
    const dialog = await screen.findByRole("dialog");

    await user.keyboard("{Escape}");
    await waitForElementToBeRemoved(dialog);
    expect(thumb).toHaveFocus();
  });

  it("labels the viewer controls", async () => {
    const user = userEvent.setup();
    render(<MediaGallery items={ITEMS} />);
    await user.click(screen.getByRole("button", { name: /Open image: Claw machine/ }));
    await screen.findByRole("dialog");
    expect(screen.getByRole("button", { name: "Close media viewer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous item" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next item" })).toBeInTheDocument();
  });

  it("skips the arrow controls for a single item", async () => {
    const user = userEvent.setup();
    render(<MediaGallery items={[ITEMS[0]]} />);
    await user.click(screen.getByRole("button", { name: /Open image: Claw machine/ }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Next item" })).not.toBeInTheDocument();
  });
});
