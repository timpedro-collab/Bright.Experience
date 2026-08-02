import { describe, it, expect, beforeEach } from "vitest";
import { useEffect } from "react";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { TourProvider, useTour } from "./TourProvider";
import { TourSpotlight } from "./TourSpotlight";
import type { TourConfig } from "./tour-steps/types";

const CONFIG: TourConfig = {
  welcomeTitle: "Welcome",
  welcomeSubtitle: "Sub",
  celebrationTitle: "All done",
  celebrationSubtitle: "Nice",
  celebrationCta: "Go",
  celebrationHref: "/",
  steps: [
    { target: null, title: "Your work queue", description: "Everything waiting on you." },
    { target: null, title: "Your events", description: "Every event you run." },
    { target: null, title: "Reporting", description: "How it performed." },
  ],
};

function AutoStart() {
  const { start, beginSteps } = useTour();
  useEffect(() => {
    start(CONFIG, "admin");
    beginSteps();
  }, [start, beginSteps]);
  return null;
}

function Harness() {
  return (
    <TourProvider>
      <button type="button">Behind the tour</button>
      <AutoStart />
      <TourSpotlight />
    </TourProvider>
  );
}

describe("TourSpotlight", () => {
  beforeEach(() => localStorage.clear());

  it("announces itself as a dialog and takes focus", async () => {
    render(<Harness />);
    const dialog = await screen.findByRole("dialog", { name: "Product tour, step 1 of 3" });
    await waitFor(() => expect(dialog).toHaveFocus());
  });

  it("advances one step per arrow press", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole("dialog");

    await user.keyboard("{ArrowRight}");
    expect(await screen.findByText("Your events")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByText("Your work queue")).toBeInTheDocument();
  });

  it("ignores the left arrow on the first step", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole("dialog");
    await user.keyboard("{ArrowLeft}");
    expect(await screen.findByText("Your work queue")).toBeInTheDocument();
  });

  it("leaves the tour on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole("dialog");
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Product tour/ })).not.toBeInTheDocument()
    );
  });

  it("keeps Tab inside the card while a step has no action to perform", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await screen.findByRole("dialog");
    const skip = screen.getByRole("button", { name: "Skip tour" });
    const nextButton = screen.getByRole("button", { name: /Next/ });

    nextButton.focus();
    await user.tab();
    expect(skip).toHaveFocus();
  });
});
