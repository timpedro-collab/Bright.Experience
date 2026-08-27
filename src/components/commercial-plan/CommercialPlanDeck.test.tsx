/**
 * Confidential commercial deck coverage: every requested section appears,
 * forecast numbers reconcile to the model, and slide navigation deep-links.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommercialPlanDeck } from "./CommercialPlanDeck";

const replace = vi.fn();
let slideParam: string | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({ get: () => slideParam }),
}));

describe("CommercialPlanDeck", () => {
  it("opens on the confidential title slide", () => {
    slideParam = null;
    render(<CommercialPlanDeck />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Bright\.Blue 2027–2029/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/confidential/i)).toBeInTheDocument();
  });

  it("advances from the title CTA", () => {
    slideParam = null;
    render(<CommercialPlanDeck />);
    fireEvent.click(screen.getByRole("button", { name: /open the plan/i }));
    expect(replace).toHaveBeenCalledWith("?slide=2", { scroll: false });
  });

  it.each([
    ["2", /turn event footfall into measurable attention/i],
    ["3", /four jobs\. one activation/i],
    ["4", /the product explains itself in the room/i],
    ["5", /a ladder buyers can enter and grow through/i],
    ["6", /four routes\. one protected rate card/i],
    ["7", /what each route earns on the same \$50k sale/i],
    ["8", /channel scale becomes the growth engine/i],
    ["9", /prove\. scale\. compound/i],
  ])("renders requested section on slide %s", (slide, heading) => {
    slideParam = slide;
    render(<CommercialPlanDeck />);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("shows channel versus Bright.Blue proceeds", () => {
    slideParam = "7";
    render(<CommercialPlanDeck />);
    expect(screen.getAllByText("Organizer").length).toBeGreaterThan(0);
    expect(screen.getByText("$15,000")).toBeInTheDocument();
    expect(screen.getByText("$35,000")).toBeInTheDocument();
    expect(screen.getByText("$6,250")).toBeInTheDocument();
    expect(screen.getByText("$43,750")).toBeInTheDocument();
    expect(screen.getByText(/agency and venue use documented midpoint/i)).toBeInTheDocument();
  });

  it("shows the base forecast and scenario ranges", () => {
    slideParam = "8";
    render(<CommercialPlanDeck />);
    expect(screen.getByText("$2.2m")).toBeInTheDocument();
    expect(screen.getByText("$5.2m")).toBeInTheDocument();
    expect(screen.getByText("$9.9m")).toBeInTheDocument();
    expect(screen.getAllByText("Conservative")).toHaveLength(3);
    expect(screen.getAllByText("Upside")).toHaveLength(3);
  });
});
