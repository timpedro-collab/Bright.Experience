/** Tests for annotation-pin polish — the open-count badge is the reviewer's headline number. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";

import { AnnotatablePreview } from "./AnnotatablePreview";
import type { AssetAnnotation } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/asset-annotations", () => ({
  addAssetAnnotation: vi.fn(),
  resolveAssetAnnotation: vi.fn(),
}));

function annotation(overrides: Partial<AssetAnnotation>): AssetAnnotation {
  return {
    id: "a1",
    assetId: "asset-1",
    eventId: "evt-1",
    authorId: "u1",
    authorName: "Theo",
    x: 10,
    y: 10,
    w: 0,
    h: 0,
    body: "Logo needs 4mm more clearance",
    resolved: false,
    createdAt: "2026-07-01T10:00:00Z",
    ...overrides,
  };
}

const BASE_PROPS = {
  assetId: "asset-1",
  eventId: "evt-1",
  imageUrl: "/uploads/wrap.png",
};

describe("AnnotatablePreview", () => {
  it("shows the open count loud and the resolved count quiet", () => {
    render(
      <AnnotatablePreview
        {...BASE_PROPS}
        initialAnnotations={[
          annotation({ id: "a1" }),
          annotation({ id: "a2", body: "Swap CTA colour" }),
          annotation({ id: "a3", body: "Done one", resolved: true }),
        ]}
      />
    );
    expect(screen.getByText("2 open")).toBeInTheDocument();
    expect(screen.getByText("1 resolved")).toBeInTheDocument();
  });

  it("celebrates when every note is resolved", () => {
    render(
      <AnnotatablePreview
        {...BASE_PROPS}
        initialAnnotations={[annotation({ resolved: true })]}
      />
    );
    expect(screen.getByText("All resolved")).toBeInTheDocument();
    expect(screen.queryByText(/open/)).toBeNull();
  });

  it("invites the first note when nothing is annotated yet", () => {
    render(<AnnotatablePreview {...BASE_PROPS} initialAnnotations={[]} />);
    expect(
      screen.getByText(/click anywhere on the creative/i)
    ).toBeInTheDocument();
  });
});
