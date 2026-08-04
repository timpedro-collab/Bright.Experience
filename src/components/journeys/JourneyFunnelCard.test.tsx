/** Tests for the journey funnel report card. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyFunnelCard } from "./JourneyFunnelCard";
import type { JourneyFunnel, PostPlayJourney } from "@/lib/queries/journeys";

const JOURNEY: PostPlayJourney = {
  id: "j-1",
  eventId: "e-1",
  kind: "discount",
  headline: "Your 10% code",
  body: null,
  ctaLabel: "Shop",
  ctaUrl: "https://brand.example/shop",
  discountCode: "PLAY10",
  isActive: true,
};

const FUNNEL: JourneyFunnel = {
  sent: 200,
  opened: 90,
  clicked: 40,
  redeemed: 0,
  within24h: { opened: 70, clicked: 30 },
};

describe("JourneyFunnelCard", () => {
  it("shows the funnel with percentages of sends", () => {
    render(<JourneyFunnelCard journey={JOURNEY} funnel={FUNNEL} />);

    expect(screen.getByText("After the play")).toBeInTheDocument();
    expect(screen.getByText(/Discount offer/)).toBeInTheDocument();
    expect(screen.getByText("200 · 100%")).toBeInTheDocument();
    expect(screen.getByText("90 · 45%")).toBeInTheDocument();
    expect(screen.getByText("40 · 20%")).toBeInTheDocument();
  });

  it("hides the redeemed step until a redemption exists", () => {
    render(<JourneyFunnelCard journey={JOURNEY} funnel={FUNNEL} />);
    expect(screen.queryByText("Redeemed")).not.toBeInTheDocument();

    render(
      <JourneyFunnelCard
        journey={JOURNEY}
        funnel={{ ...FUNNEL, redeemed: 5 }}
      />,
    );
    expect(screen.getByText("Redeemed")).toBeInTheDocument();
  });

  it("summarises the first 24 hours", () => {
    render(<JourneyFunnelCard journey={JOURNEY} funnel={FUNNEL} />);
    expect(
      screen.getByText("First 24 hours: 70 opened, 30 clicked."),
    ).toBeInTheDocument();
  });

  it("renders nothing before anything was sent", () => {
    const { container } = render(
      <JourneyFunnelCard
        journey={JOURNEY}
        funnel={{
          sent: 0,
          opened: 0,
          clicked: 0,
          redeemed: 0,
          within24h: { opened: 0, clicked: 0 },
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
