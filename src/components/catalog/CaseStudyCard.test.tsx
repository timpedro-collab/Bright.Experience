/** Tests for the case-study tile — staged overlay, per-client brand wash, safe fallbacks. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@/test/render";

import { CaseStudyCard } from "./CaseStudyCard";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const BASE_STUDY = {
  title: "Catch-A-Matcha at BIBA",
  slug: "catch-a-matcha",
  location: "Manchester Central",
  statsJson: { plays: 2300 },
};

describe("CaseStudyCard", () => {
  it("shows the headline stat in both the resting card and the reveal overlay", () => {
    mockMatchMedia(false);
    render(<CaseStudyCard caseStudy={BASE_STUDY} />);
    // Once in the quiet resting layer, once huge on the brand wash.
    expect(screen.getAllByText("2,300")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /catch-a-matcha at biba/i })
    ).toHaveAttribute("href", "/catalog/case-studies/catch-a-matcha");
  });

  it("washes the overlay in the client's own brand colour when we hold one", () => {
    mockMatchMedia(false);
    const { container } = render(
      <CaseStudyCard caseStudy={{ ...BASE_STUDY, clientName: "Red Bull" }} />
    );
    const overlay = container.querySelector(".cs-overlay") as HTMLElement;
    expect(overlay.style.backgroundColor).toBe("#db0a40");
  });

  it("falls back to cobalt for clients without a stored brand colour (incl. anonymised labels)", () => {
    mockMatchMedia(false);
    const { container } = render(
      <CaseStudyCard
        caseStudy={{ ...BASE_STUDY, clientName: "A global coffee chain" }}
      />
    );
    const overlay = container.querySelector(".cs-overlay") as HTMLElement;
    expect(overlay.style.backgroundColor).toBe("hsl(230, 93%, 43%)");
    // The anonymised label renders wherever a client name would.
    expect(screen.getAllByText("A global coffee chain").length).toBeGreaterThan(
      0
    );
  });

  it("rests photo-less logo tiles on the client's own brand colour", () => {
    mockMatchMedia(false);
    const { container } = render(
      <CaseStudyCard caseStudy={{ ...BASE_STUDY, clientName: "Pelion" }} />
    );
    const tile = container.querySelector(".cs-brand-tile") as HTMLElement;
    expect(tile).not.toBeNull();
    expect(tile.style.backgroundColor).toBe("#d2247c");
  });

  it("keeps photography untinted when a hero image exists", () => {
    mockMatchMedia(false);
    const { container } = render(
      <CaseStudyCard
        caseStudy={{
          ...BASE_STUDY,
          clientName: "Pelion",
          heroImageUrl: "/x.jpg",
        }}
      />
    );
    expect(container.querySelector(".cs-brand-tile")).toBeNull();
  });

  it("renders no client chip or giant name when no client is attributed", () => {
    mockMatchMedia(false);
    const { container } = render(<CaseStudyCard caseStudy={BASE_STUDY} />);
    expect(container.querySelector(".cs-overlay-name")).toBeNull();
  });
});
