/**
 * Minimal TourProvider behaviour — finish persists completion in localStorage.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/render";
import { TourProvider, useTour } from "./TourProvider";
import type { TourConfig } from "./tour-steps/types";

const MINI_CONFIG: TourConfig = {
  welcomeTitle: "Welcome",
  welcomeSubtitle: "A short tour",
  celebrationTitle: "Done",
  celebrationSubtitle: "You're set",
  celebrationCta: "Go",
  celebrationHref: "/",
  steps: [
    {
      target: null,
      title: "First",
      description: "One",
    },
  ],
};

function Harness() {
  const { start, finish, phase, role } = useTour();
  return (
    <div>
      <span data-testid="phase">{phase}</span>
      <span data-testid="role">{role ?? ""}</span>
      <button type="button" onClick={() => start(MINI_CONFIG, "events_lead")}>
        Start
      </button>
      <button type="button" onClick={() => finish()}>
        Finish
      </button>
    </div>
  );
}

describe("TourProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("writes bright_tour_completed_<role> when finish is called", async () => {
    const user = userEvent.setup();
    render(
      <TourProvider>
        <Harness />
      </TourProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Start/i }));
    expect(screen.getByTestId("phase")).toHaveTextContent("welcome");
    expect(screen.getByTestId("role")).toHaveTextContent("events_lead");

    await user.click(screen.getByRole("button", { name: /Finish/i }));
    expect(localStorage.getItem("bright_tour_completed_events_lead")).toBe(
      "true",
    );
    expect(screen.getByTestId("phase")).toHaveTextContent("idle");
  });
});
