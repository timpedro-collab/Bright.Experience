/** Tests for the Cal.com/preset walkthrough scheduler switch. */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@/test/render";
import { WalkthroughScheduler } from "./WalkthroughScheduler";

// Stub the Cal.com embed — we assert on the props it receives, not its iframe.
vi.mock("@calcom/embed-react", () => ({
  default: ({
    calLink,
    config,
  }: {
    calLink: string;
    config?: Record<string, unknown>;
  }) => (
    <div
      data-testid="calcom-embed"
      data-cal-link={calLink}
      data-quote-id={config?.["metadata[quoteId]"] as string}
      data-email={config?.email as string}
    />
  ),
}));

// The preset fallback calls a server action on click — keep it inert.
vi.mock("@/app/actions/quotes", () => ({
  bookWalkthrough: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

const ORIGINAL = process.env.NEXT_PUBLIC_CALCOM_LINK;

afterEach(() => {
  if (ORIGINAL !== undefined) {
    process.env.NEXT_PUBLIC_CALCOM_LINK = ORIGINAL;
  } else {
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
  }
});

describe("WalkthroughScheduler", () => {
  it("renders the preset slot picker when Cal.com is not configured", () => {
    delete process.env.NEXT_PUBLIC_CALCOM_LINK;
    render(<WalkthroughScheduler quoteId="q1" aeFirstName="Sarah" />);
    expect(
      screen.getByText(/book your 15-minute walkthrough/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId("calcom-embed")).not.toBeInTheDocument();
  });

  it("renders the Cal.com embed with quote metadata and prefill when configured", () => {
    process.env.NEXT_PUBLIC_CALCOM_LINK = "brightblue/15min";
    render(
      <WalkthroughScheduler
        quoteId="q-42"
        aeFirstName="Sarah"
        contactName="Aisha Khan"
        contactEmail="aisha@samsung.example"
      />
    );
    const embed = screen.getByTestId("calcom-embed");
    expect(embed).toHaveAttribute("data-cal-link", "brightblue/15min");
    expect(embed).toHaveAttribute("data-quote-id", "q-42");
    expect(embed).toHaveAttribute("data-email", "aisha@samsung.example");
  });
});
