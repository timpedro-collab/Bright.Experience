/** Tests for the internal journey configuration form. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JourneyConfigCard } from "./JourneyConfigCard";
import type { PostPlayJourney } from "@/lib/queries/journeys";

const saveJourney = vi.fn(async () => ({ success: true as const, data: null }));
vi.mock("@/app/actions/journeys", () => ({
  saveJourney: (...args: unknown[]) =>
    (saveJourney as unknown as (...a: unknown[]) => unknown)(...args),
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const EVENT_ID = "cccccccc-3333-3333-3333-333333333333";

const EXISTING: PostPlayJourney = {
  id: "j-1",
  eventId: EVENT_ID,
  kind: "discount",
  headline: "Your 10% code",
  body: "Thanks for playing.",
  ctaLabel: "Shop now",
  ctaUrl: "https://brand.example/shop",
  discountCode: "PLAY10",
  isActive: true,
};

beforeEach(() => {
  saveJourney.mockClear();
  refresh.mockClear();
});

describe("JourneyConfigCard", () => {
  it("prefills from an existing journey", () => {
    render(<JourneyConfigCard eventId={EVENT_ID} journey={EXISTING} />);

    expect(screen.getByLabelText("Headline / subject")).toHaveValue(
      "Your 10% code",
    );
    expect(screen.getByLabelText("Discount code")).toHaveValue("PLAY10");
    expect(screen.getByText("Live — sends on capture")).toBeInTheDocument();
  });

  it("only shows the discount code field for discount journeys", () => {
    render(<JourneyConfigCard eventId={EVENT_ID} journey={null} />);
    expect(screen.queryByLabelText("Discount code")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Journey type"), {
      target: { value: "discount" },
    });
    expect(screen.getByLabelText("Discount code")).toBeInTheDocument();
  });

  it("submits the form values and refreshes", async () => {
    render(<JourneyConfigCard eventId={EVENT_ID} journey={EXISTING} />);

    fireEvent.change(screen.getByLabelText("Headline / subject"), {
      target: { value: "New headline" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save journey" }));

    await waitFor(() => expect(saveJourney).toHaveBeenCalledTimes(1));
    expect(saveJourney).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: EVENT_ID,
        headline: "New headline",
        ctaUrl: "https://brand.example/shop",
        isActive: true,
      }),
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("surfaces action errors as a toast without refreshing", async () => {
    saveJourney.mockResolvedValueOnce({
      success: false,
      error: "URL must use https",
    } as never);
    render(<JourneyConfigCard eventId={EVENT_ID} journey={EXISTING} />);

    fireEvent.click(screen.getByRole("button", { name: "Save journey" }));

    await waitFor(() => expect(saveJourney).toHaveBeenCalled());
    const { toast } = await import("sonner");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("URL must use https"),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
