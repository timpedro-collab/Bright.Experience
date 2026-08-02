/**
 * Component tests for the AssetReviewQueue.
 *
 * The expanded view is a complex form — we limit coverage to the
 * collapsed row shape, the toggle, and the row-level metadata
 * (uploader name, event name, timing). The full review submit path is
 * already covered at the action layer.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { makeAsset } from "@/test/fixtures";
import { AssetReviewQueue } from "./AssetReviewQueue";

vi.mock("@/app/actions/asset-review", () => ({
  submitAssetReview: vi.fn(),
}));

// Expanding a row lazy-loads version history and annotations. Without this the
// component reaches a real Supabase client and the suite depends on the network.
vi.mock("@/app/actions/asset-detail", () => ({
  loadAssetReviewDetail: vi.fn(async () => ({ versions: [], annotations: [] })),
}));

const queueAsset = (extra: Record<string, unknown> = {}) => ({
  ...makeAsset({
    name: "hero.png",
    fileUrl: "https://test.local/hero.png",
  }),
  eventName: "Spring",
  uploaderName: "Casey",
  ...extra,
});

describe("AssetReviewQueue", () => {
  it("renders one row per asset", () => {
    render(<AssetReviewQueue items={[queueAsset({ id: "a1" }), queueAsset({ id: "a2" })]} />);
    expect(screen.getAllByText("hero.png")).toHaveLength(2);
  });

  it("renders uploader name and event in each row", () => {
    render(<AssetReviewQueue items={[queueAsset()]} />);
    expect(screen.getByText(/Casey/)).toBeInTheDocument();
    expect(screen.getByText(/Spring/)).toBeInTheDocument();
  });

  it("expands the row when clicked", async () => {
    const user = userEvent.setup();
    render(<AssetReviewQueue items={[queueAsset()]} />);
    // Initially collapsed — Approve button shouldn't be visible
    expect(
      screen.queryByRole("button", { name: /Approve/i })
    ).not.toBeInTheDocument();
    await user.click(screen.getByText("hero.png"));
    expect(
      screen.getByRole("button", { name: /Approve/i })
    ).toBeInTheDocument();
  });
});
