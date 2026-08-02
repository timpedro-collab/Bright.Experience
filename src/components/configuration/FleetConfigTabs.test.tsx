/** Tests for the per-machine configuration scope switcher. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test/render";
import { FleetConfigTabs } from "./FleetConfigTabs";
import { defaultCaptureRules } from "@/lib/capture-rules";
import type { GameConfiguration } from "@/app/actions/game-config";
import type { FleetMachine } from "@/lib/configuration/resolve-config";

const saveGameConfiguration = vi.fn(async (..._args: unknown[]) => ({
  success: true as const,
  data: undefined,
}));

vi.mock("@/app/actions/game-config", () => ({
  saveGameConfiguration: (...args: unknown[]) => saveGameConfiguration(...args),
  updateGameConfigStatus: vi.fn(async () => ({ success: true, data: undefined })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const FLEET: FleetMachine[] = [
  { id: "m1", serialNumber: "BV-2001", zone: "Registration", mission: "welcome_gift" },
  { id: "m2", serialNumber: "BV-2002", nickname: "Hall 3 unit", zone: "Hall 3", mission: "sponsor_activation" },
];

function config(overrides: Partial<GameConfiguration>): GameConfiguration {
  return {
    id: "gc1",
    eventId: EVENT_ID,
    machineInstanceId: null,
    gameId: null,
    prizeMode: "random",
    prizesJson: [],
    formFieldsJson: [],
    includeScoreInExport: false,
    leaderboardEnabled: false,
    gameParametersJson: {},
    idleScreenConfigJson: {},
    captureRulesJson: defaultCaptureRules(),
    retentionDays: 60,
    brandedLanding: false,
    captureMethod: "form",
    status: "draft",
    submittedBy: null,
    submittedAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  saveGameConfiguration.mockClear();
});

describe("FleetConfigTabs", () => {
  it("lists the show default alongside every machine with its zone", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({})]}
        viewerRole="admin"
      />
    );
    expect(screen.getByText("Show default")).toBeInTheDocument();
    expect(screen.getByText("BV-2001")).toBeInTheDocument();
    expect(screen.getByText("Hall 3 unit")).toBeInTheDocument();
    expect(screen.getByText(/Registration · Welcome gift/)).toBeInTheDocument();
  });

  it("counts how many machines still follow the default", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({}), config({ id: "gc2", machineInstanceId: "m1" })]}
        viewerRole="admin"
      />
    );
    expect(screen.getByText("1 of 2 machines")).toBeInTheDocument();
  });

  it("marks machines that have their own configuration", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({}), config({ id: "gc2", machineInstanceId: "m1" })]}
        viewerRole="admin"
      />
    );
    expect(screen.getAllByText("Custom")).toHaveLength(1);
  });

  it("explains inheritance when switching to a machine with no override", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({})]}
        viewerRole="admin"
      />
    );
    fireEvent.click(screen.getByText("BV-2001"));
    expect(screen.getByText(/is running the show default/)).toBeInTheDocument();
  });

  it("does not show the inheritance notice on a machine that has an override", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({}), config({ id: "gc2", machineInstanceId: "m1" })]}
        viewerRole="admin"
      />
    );
    fireEvent.click(screen.getByText("BV-2001"));
    expect(screen.queryByText(/is running the show default/)).not.toBeInTheDocument();
  });

  it("saves the show-wide default with no machine scope", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({})]}
        viewerRole="admin"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    expect(saveGameConfiguration).toHaveBeenCalledTimes(1);
    const payload = saveGameConfiguration.mock.calls[0][1] as { machineInstanceId: string | null };
    expect(payload.machineInstanceId).toBeNull();
  });

  it("saves an override scoped to the selected machine", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({})]}
        viewerRole="admin"
      />
    );
    fireEvent.click(screen.getByText("Hall 3 unit"));
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    const payload = saveGameConfiguration.mock.calls[0][1] as { machineInstanceId: string | null };
    expect(payload.machineInstanceId).toBe("m2");
  });

  it("prefills an inheriting machine from the show default", () => {
    render(
      <FleetConfigTabs
        eventId={EVENT_ID}
        fleet={FLEET}
        configs={[config({ prizeMode: "guaranteed", captureMethod: "badge_scan" })]}
        viewerRole="admin"
      />
    );
    fireEvent.click(screen.getByText("BV-2001"));
    fireEvent.click(screen.getByRole("button", { name: /save draft/i }));
    const payload = saveGameConfiguration.mock.calls[0][1] as {
      prizeMode: string;
      captureMethod: string;
    };
    expect(payload.prizeMode).toBe("guaranteed");
    expect(payload.captureMethod).toBe("badge_scan");
  });
});
