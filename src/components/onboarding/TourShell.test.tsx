/**
 * TourAutoStarter behaviour — the auto-start tour is deferred to the second
 * login (UX subtraction audit), while the explicit "take the tour" request
 * always starts immediately.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@/test/render";
import { TourShell } from "./TourShell";
import { useTour } from "./TourProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/app/actions/onboarding", () => ({
  completeOnboarding: vi.fn().mockResolvedValue({ success: true }),
}));

/** Exposes the tour phase so tests assert behaviour, not overlay markup. */
function PhaseProbe() {
  const { phase } = useTour();
  return <span data-testid="phase">{phase}</span>;
}

function renderShell() {
  return render(
    <TourShell role="events_lead" autoStart>
      <PhaseProbe />
    </TourShell>,
  );
}

describe("TourShell auto-start", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not start the tour on the first visit and records the visit marker", () => {
    renderShell();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
    expect(localStorage.getItem("bright_first_visit_done")).toBe("true");
  });

  it("starts the tour after the delay on the second visit", () => {
    localStorage.setItem("bright_first_visit_done", "true");
    renderShell();

    expect(screen.getByTestId("phase")).toHaveTextContent("idle");

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("welcome");
  });

  it("never starts when the tour was already completed for the role", () => {
    localStorage.setItem("bright_first_visit_done", "true");
    localStorage.setItem("bright_tour_completed_events_lead", "true");
    renderShell();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
  });

  it("starts immediately when the tour was explicitly requested, even on a first visit", () => {
    localStorage.setItem("bright_tour_pending", "true");
    renderShell();

    expect(screen.getByTestId("phase")).toHaveTextContent("welcome");
    expect(localStorage.getItem("bright_tour_pending")).toBeNull();
  });
});
