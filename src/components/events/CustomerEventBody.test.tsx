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
    expect(screen.getByText("12 days")).toBeInTheDocument();
    expect(screen.getByText("Approvals pending")).toBeInTheDocument();
  });

  it("shows Wrapped copy for past events", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1" })}
        milestones={[]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
        metrics={{
          daysToEvent: -140,
          delivered: true,
          pendingActions: 0,
          approvalsPending: 0,
          missedMilestones: 0,
        }}
      />,
    );
    expect(screen.getByText("Wrapped")).toBeInTheDocument();
    expect(screen.getByText("140 days ago")).toBeInTheDocument();
    expect(screen.queryByText("Days to event")).not.toBeInTheDocument();
  });

  it("invites a rebook once the event has wrapped", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1", currentStage: "complete" })}
        milestones={[]}
        items={[]}
        nextStep={null}
        teamMembers={[]}
      />,
    );
    expect(screen.getByText("Run this again?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rebook this activation/i }),
    ).toBeInTheDocument();
  });

  it("never shows the rebook card while the event is still in delivery", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1", currentStage: "creative_assets" })}
        milestones={[]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
      />,
    );
    expect(screen.queryByText("Run this again?")).not.toBeInTheDocument();
  });

  it("shows the delivery feed for an upcoming event in the delivery window", () => {
    const futureStart = new Date(Date.now() + 10 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({
          id: "e1",
          currentStage: "build_configuration",
          eventDateStart: futureStart,
          eventDateEnd: futureStart,
        })}
        milestones={[]}
        items={[]}
        nextStep={nextStep}
        teamMembers={[]}
      />,
    );
    expect(screen.getByText("Behind the scenes right now")).toBeInTheDocument();
    expect(
      screen.getByText("Machine wrapped in your brand"),
    ).toBeInTheDocument();
    // 10 days out: the wrap reveal is open, the game preview still gated.
    expect(screen.getByText("Your machine, in your brand")).toBeInTheDocument();
    expect(screen.getByText("Unlocks 7 days out")).toBeInTheDocument();
  });

  it("hides the delivery feed once the event has wrapped", () => {
    render(
      <CustomerEventBody
        eventId="e1"
        event={makeEvent({ id: "e1", currentStage: "complete" })}
        milestones={[]}
        items={[]}
        nextStep={null}
        teamMembers={[]}
      />,
    );
    expect(
      screen.queryByText("Behind the scenes right now"),
    ).not.toBeInTheDocument();
  });
});
