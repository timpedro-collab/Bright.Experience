/**
 * Component tests for the dashboard event card.
 *
 * Focus on the user-visible contract:
 *   - links to the right event URL
 *   - shows the venue, dates, and machine type when set
 *   - the "actions on you" pill appears, hides, or says "all clear"
 *     depending on the count + isInternal prop
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { EventCard } from "./EventCard";
import { makeEvent } from "@/test/fixtures";

describe("EventCard", () => {
  it("links to the event page", () => {
    const event = makeEvent({ id: "evt-1", name: "Spring" });
    render(<EventCard event={event} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/events/evt-1");
  });

  it("renders the event name and account name", () => {
    const event = makeEvent({
      name: "Spring Activation",
      account: { id: "a", name: "Acme Brands", slug: "acme" },
    });
    render(<EventCard event={event} />);
    expect(screen.getByText("Spring Activation")).toBeInTheDocument();
    expect(screen.getByText("Acme Brands")).toBeInTheDocument();
  });

  it("renders the venue name when present", () => {
    const event = makeEvent({ venueName: "ExCeL London" });
    render(<EventCard event={event} />);
    expect(screen.getByText("ExCeL London")).toBeInTheDocument();
  });

  it("renders the machine type when present", () => {
    const event = makeEvent({ machineType: "Carousel" });
    render(<EventCard event={event} />);
    expect(screen.getByText("Carousel")).toBeInTheDocument();
  });

  it("renders the date range when both dates are set", () => {
    const event = makeEvent({
      eventDateStart: "2026-06-15",
      eventDateEnd: "2026-06-17",
    });
    render(<EventCard event={event} />);
    expect(screen.getByText(/15 Jun 2026.*17 Jun 2026/)).toBeInTheDocument();
  });

  it("hides the ActionsPill when actionsForViewer is undefined", () => {
    render(<EventCard event={makeEvent()} />);
    expect(screen.queryByText(/All clear/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/on you/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/to do/i)).not.toBeInTheDocument();
  });

  it("shows 'All clear' when actionsForViewer is 0", () => {
    render(<EventCard event={makeEvent()} actionsForViewer={0} />);
    expect(screen.getByText(/All clear/i)).toBeInTheDocument();
  });

  it("shows '{n} on you' for internal viewers", () => {
    render(
      <EventCard event={makeEvent()} actionsForViewer={3} isInternal={true} />
    );
    expect(screen.getByText(/3 on you/i)).toBeInTheDocument();
  });

  it("shows '{n} to do' for customer viewers", () => {
    render(
      <EventCard event={makeEvent()} actionsForViewer={2} isInternal={false} />
    );
    expect(screen.getByText(/2 to do/i)).toBeInTheDocument();
  });
});
