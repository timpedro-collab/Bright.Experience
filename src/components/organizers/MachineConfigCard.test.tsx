import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { MachineConfigCard } from "./MachineConfigCard";
import { defaultCaptureRules } from "@/lib/capture-rules";
import type { GameConfiguration } from "@/app/actions/game-config";

const CONFIG: GameConfiguration = {
  id: "c1",
  eventId: "e1",
  machineInstanceId: null,
  gameId: "Prize Drop",
  prizeMode: "score_based",
  prizesJson: [
    { name: "Hoodie", quantity: 20 },
    { name: "Bottle", quantity: 80 },
  ],
  formFieldsJson: [
    { label: "First name", type: "text", required: true },
    { label: "Email", type: "email", required: true },
  ],
  includeScoreInExport: false,
  leaderboardEnabled: false,
  gameParametersJson: {},
  idleScreenConfigJson: {},
  captureRulesJson: defaultCaptureRules(),
  retentionDays: 60,
  brandedLanding: false,
  captureMethod: "badge_scan",
  status: "configured",
  submittedBy: null,
  submittedAt: null,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

describe("MachineConfigCard", () => {
  it("totals the prize stock rather than listing rows", () => {
    render(<MachineConfigCard config={CONFIG} isOverride={false} />);
    expect(screen.getByText("100 across 2 lines")).toBeInTheDocument();
  });

  it("names the scope the settings came from", () => {
    render(<MachineConfigCard config={CONFIG} isOverride />);
    expect(screen.getByText("Set for this unit")).toBeInTheDocument();
  });

  it("marks an inheriting unit as running the show default", () => {
    render(<MachineConfigCard config={CONFIG} isOverride={false} />);
    expect(screen.getByText("Show default")).toBeInTheDocument();
  });

  it("translates the capture method into words a client would use", () => {
    render(<MachineConfigCard config={CONFIG} isOverride={false} />);
    expect(screen.getByText("Badge scan")).toBeInTheDocument();
    expect(screen.getByText("2 fields on the entry form")).toBeInTheDocument();
  });

  it("counts the capture guards that are on", () => {
    render(<MachineConfigCard config={CONFIG} isOverride={false} />);
    expect(screen.getByText("3 of 3 on")).toBeInTheDocument();
  });

  it("reports guards being off rather than showing an empty row", () => {
    render(
      <MachineConfigCard
        config={{
          ...CONFIG,
          captureRulesJson: {
            ...defaultCaptureRules(),
            businessEmailsOnly: false,
            blockDuplicates: false,
            consentRequired: false,
          },
        }}
        isOverride={false}
      />
    );
    expect(screen.getByText("No capture guards set")).toBeInTheDocument();
  });

  it("states the retention window, since that is a client promise", () => {
    render(<MachineConfigCard config={CONFIG} isOverride={false} />);
    expect(screen.getByText("60 days")).toBeInTheDocument();
  });

  it("explains the blank state when a show has no configuration yet", () => {
    render(<MachineConfigCard config={null} isOverride={false} />);
    expect(screen.getByText(/Nothing configured yet/)).toBeInTheDocument();
  });

  it("says when no game has been chosen instead of rendering nothing", () => {
    render(<MachineConfigCard config={{ ...CONFIG, gameId: null }} isOverride={false} />);
    expect(screen.getByText("Not chosen yet")).toBeInTheDocument();
  });

  it("names the game rather than printing its id", () => {
    render(
      <MachineConfigCard config={CONFIG} isOverride={false} gameName="Memory Match" />
    );
    expect(screen.getByText("Memory Match")).toBeInTheDocument();
    expect(screen.queryByText("Prize Drop")).not.toBeInTheDocument();
  });
});
