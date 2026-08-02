/**
 * Component tests for the shared customer event body.
 *
 * The contract: it stacks the action block, the journey steps, the team, and
 * a quiet lower zone of disclosures — and only shows "The numbers" disclosure
 * when metrics are supplied (overview), never on home.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/render";
import { CustomerEventBody } from "./CustomerEventBody";
import { makeEvent, makeMilestone } from "@/test/fixtures";
import type { NextStep } from "@/lib/event-next-step";

vi.mock("@/app/actions/team", () => ({
  requestTeamMember: vi.fn(),
}));

const nextStep: NextStep = {
  eyebrow: "Assets due",
  title: "Upload your creative",
  description: "Logos, hero artwork, copy.",
  primaryAction: { label: "Upload assets", href: "/events/e1/assets" },
  tone: "brand",
};

describe("CustomerEventBody", () => {
  it("renders the action block, journey and event details", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1", venueName: "ExCeL London" })}
        milestones={[makeMilestone()]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
      />,
    );
    expect(screen.getByText("Over to you")).toBeInTheDocument();
    expect(screen.getByText("Your journey")).toBeInTheDocument();
    expect(screen.getByText("Event details")).toBeInTheDocument();
    expect(screen.getByText(/ExCeL London/)).toBeInTheDocument();
  });

  it("omits 'The numbers' when no metrics are supplied", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1" })}
        milestones={[]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
      />,
    );
    expect(screen.queryByText("The numbers")).not.toBeInTheDocument();
  });

  it("shows 'The numbers' with metrics on the overview", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1" })}
        milestones={[]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
        metrics={{
          daysToEvent: 12,
          delivered: false,
          pendingActions: 2,
          approvalsPending: 1,
          missedMilestones: 0,
        }}
      />,
    );
    expect(screen.getByText("The numbers")).toBeInTheDocument();
    expect(screen.getByText("Days to event")).toBeInTheDocument();
    expect(screen.getByText("Approvals pending")).toBeInTheDocument();
  });
});
