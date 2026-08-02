import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CaseStudyStrip } from "./CaseStudyStrip";
import { toCaseStudyProof } from "@/lib/marketing/case-study-stats";

const STUDIES = toCaseStudyProof([
  {
    id: "1",
    title: "Costa Coffee — Catch-A-Matcha",
    slug: "costa",
    client_name: "Costa Coffee",
    hero_image_url: "/catalog/hero.png",
    stats_json: { gamePlays: 3270, brandImpressions: 200000 },
  },
]);

describe("CaseStudyStrip", () => {
  it("leads with the client, not the campaign title", () => {
    render(<CaseStudyStrip studies={STUDIES} />);

    expect(screen.getByText("Costa Coffee")).toBeInTheDocument();
    expect(
      screen.queryByText("Costa Coffee — Catch-A-Matcha")
    ).not.toBeInTheDocument();
  });

  it("shows the numbers behind the study", () => {
    render(<CaseStudyStrip studies={STUDIES} />);

    expect(screen.getByText("3,270")).toBeInTheDocument();
    expect(screen.getByText("200k")).toBeInTheDocument();
  });

  it("renders nothing when there is no proof to show", () => {
    const { container } = render(<CaseStudyStrip studies={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
