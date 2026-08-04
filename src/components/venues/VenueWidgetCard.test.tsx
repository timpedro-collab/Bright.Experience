/** Tests for the embeddable venue widget card. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VenueWidgetCard } from "./VenueWidgetCard";

const BASE_PROPS = {
  venueName: "Wembley Arena",
  openSlotCount: 3,
  fromPricePence: 25000,
  nextWindow: null as { start: string; end: string | null } | null,
  advertiseHref: "/venues/wembley/advertise?utm_source=embed&utm_medium=widget",
};

describe("VenueWidgetCard", () => {
  it("renders the open slot count and from-price", () => {
    render(<VenueWidgetCard {...BASE_PROPS} />);

    expect(screen.getByText(/3 slots open/)).toBeInTheDocument();
    expect(screen.getByText(/from £250\/wk/)).toBeInTheDocument();
  });

  it("renders the fully-booked line when count is 0", () => {
    render(
      <VenueWidgetCard
        {...BASE_PROPS}
        openSlotCount={0}
        fromPricePence={null}
      />,
    );

    expect(
      screen.getByText(
        /Fully booked right now — join the waitlist for the next window\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/slots open/)).not.toBeInTheDocument();
  });

  it("links the CTA to advertiseHref", () => {
    render(<VenueWidgetCard {...BASE_PROPS} />);

    const cta = screen.getByRole("link", { name: /see open slots/i });
    expect(cta).toHaveAttribute("href", BASE_PROPS.advertiseHref);
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders next window with an end date", () => {
    render(
      <VenueWidgetCard
        {...BASE_PROPS}
        nextWindow={{ start: "2026-08-10", end: "2026-08-20" }}
      />,
    );

    expect(screen.getByText(/Next window: 10 Aug – 20 Aug/)).toBeInTheDocument();
  });

  it("renders next window without an end date", () => {
    render(
      <VenueWidgetCard
        {...BASE_PROPS}
        nextWindow={{ start: "2026-09-01", end: null }}
      />,
    );

    expect(screen.getByText(/Next window: 1 Sep/)).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });
});
