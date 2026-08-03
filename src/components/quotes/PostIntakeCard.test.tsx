/** Tests for the post-intake confirmation screen (brief echo + call agenda). */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import { PostIntakeCard } from "./PostIntakeCard";

vi.mock("@/app/actions/quotes", () => ({
  updateQuoteCapabilities: vi.fn().mockResolvedValue({
    success: true,
    data: { addons: [] },
  }),
  bookWalkthrough: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

// The scheduler pulls in the Cal.com embed — its own spec covers it.
vi.mock("@/components/quotes/WalkthroughScheduler", () => ({
  WalkthroughScheduler: () => <div data-testid="scheduler" />,
}));

describe("PostIntakeCard", () => {
  it("plays the customer's brief back as 'what you told us'", () => {
    render(
      <PostIntakeCard
        quoteId="q1"
        contactName="Tim Cook"
        capabilitySlugs={[]}
        brief={{
          eventType: "activation",
          objective: "Lead generation and pipeline",
          venueName: "ExCeL London",
          eventDateStart: "2026-09-05",
          attendees: "2500",
        }}
      />
    );
    expect(screen.getByText("What you told us")).toBeInTheDocument();
    expect(screen.getByText("A brand activation")).toBeInTheDocument();
    expect(
      screen.getByText("Lead generation and pipeline")
    ).toBeInTheDocument();
    expect(screen.getByText("ExCeL London")).toBeInTheDocument();
    expect(screen.getByText("~2,500 attendees")).toBeInTheDocument();
  });

  it("hides the echo panel when there is no brief to play back", () => {
    render(
      <PostIntakeCard quoteId="q1" contactName="Tim" capabilitySlugs={[]} />
    );
    expect(screen.queryByText("What you told us")).not.toBeInTheDocument();
  });

  it("keeps the space between the AE's name and the verb (no 'Timwill')", () => {
    render(
      <PostIntakeCard quoteId="q1" contactName="Tim" capabilitySlugs={[]} />
    );
    expect(
      screen.getByText(/Tim will walk you through your tailored proposal/)
    ).toBeInTheDocument();
  });

  it("lists the three-point call agenda", () => {
    render(
      <PostIntakeCard quoteId="q1" contactName="Tim" capabilitySlugs={[]} />
    );
    expect(
      screen.getByText(/Your brand on the Experience Portal/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Your exact investment, live/)).toBeInTheDocument();
  });

  it("shows the response-time promise", () => {
    render(
      <PostIntakeCard quoteId="q1" contactName="Tim" capabilitySlugs={[]} />
    );
    expect(
      screen.getByText("Proposal within 1 business day")
    ).toBeInTheDocument();
  });

  it("shows the instant estimate as ranges with the honesty caveat", () => {
    render(
      <PostIntakeCard
        quoteId="q1"
        contactName="Tim"
        capabilitySlugs={["lead-capture"]}
        estimate={{
          tierSlug: "lead-engine",
          tierName: "Lead Engine",
          bandLabel: "£16,000–£24,000",
          plays: {
            metric: "plays",
            perDayLow: 200,
            perDayHigh: 280,
            totalLow: 600,
            totalHigh: 840,
            sampleSize: 20,
            basis: "event",
          },
          leads: {
            metric: "leads",
            perDayLow: 60,
            perDayHigh: 110,
            totalLow: 180,
            totalHigh: 330,
            sampleSize: 20,
            basis: "event",
          },
        }}
      />
    );
    expect(screen.getByText("Your early numbers")).toBeInTheDocument();
    expect(screen.getByText("£16,000–£24,000")).toBeInTheDocument();
    expect(screen.getByText("600–840")).toBeInTheDocument();
    expect(screen.getByText("180–330")).toBeInTheDocument();
    expect(
      screen.getByText("Based on 20 comparable activations of this type")
    ).toBeInTheDocument();
  });

  it("stays quiet when no estimate could be built", () => {
    render(
      <PostIntakeCard
        quoteId="q1"
        contactName="Tim"
        capabilitySlugs={[]}
        estimate={null}
      />
    );
    expect(screen.queryByText("Your early numbers")).not.toBeInTheDocument();
  });
});
