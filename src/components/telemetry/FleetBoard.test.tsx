/** Tests for the per-machine fleet board. */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/render";
import { FleetBoard } from "./FleetBoard";
import {
  buildMachineBreakdown,
  groupBreakdownByZone,
  type FleetMachineRow,
} from "@/lib/metrics/fleet";

const NOW = Date.now();
const FRESH = new Date(NOW - 30_000).toISOString();
const STALE = new Date(NOW - 60 * 60 * 1000).toISOString();

const MACHINES: FleetMachineRow[] = [
  {
    id: "m1",
    serial_number: "BV-2001",
    zone: "Registration",
    mission: "welcome_gift",
    last_heartbeat: FRESH,
  },
  {
    id: "m2",
    serial_number: "BV-2002",
    zone: "Hall 3",
    mission: "sponsor_activation",
    last_heartbeat: STALE,
  },
];

function renderBoard(isCustomer = false) {
  const breakdown = buildMachineBreakdown(MACHINES, [
    { machine_instance_id: "m1", event_type: "play_started" },
    { machine_instance_id: "m1", event_type: "lead_captured" },
  ]);
  render(
    <FleetBoard
      zones={groupBreakdownByZone(breakdown)}
      breakdown={breakdown}
      isCustomer={isCustomer}
    />
  );
  return breakdown;
}

describe("FleetBoard", () => {
  it("groups machines into their zones", () => {
    renderBoard();
    expect(screen.getByText("Registration")).toBeInTheDocument();
    expect(screen.getByText("Hall 3")).toBeInTheDocument();
  });

  it("shows online counts per zone", () => {
    renderBoard();
    expect(screen.getByText("1/1 online")).toBeInTheDocument();
    expect(screen.getByText("0/1 online")).toBeInTheDocument();
  });

  it("leads with the machines that need attention", () => {
    renderBoard();
    expect(screen.getByText("1 machine needs attention")).toBeInTheDocument();
    expect(screen.getByText(/BV-2002 \(Hall 3\) — no signal/)).toBeInTheDocument();
  });

  it("labels each machine with its mission", () => {
    renderBoard();
    expect(screen.getByText("Welcome gift")).toBeInTheDocument();
    expect(screen.getByText("Sponsor activation")).toBeInTheDocument();
  });

  it("hides hardware serials from customer-facing viewers", () => {
    renderBoard(true);
    expect(screen.queryByText("BV-2001")).not.toBeInTheDocument();
    expect(screen.getByText("Registration unit")).toBeInTheDocument();
  });

  it("explains itself when no machines are assigned", () => {
    render(<FleetBoard zones={[]} breakdown={[]} />);
    expect(screen.getByText("No machines assigned yet.")).toBeInTheDocument();
  });

  it("leaves machines as plain rows when the viewer has no machine page", () => {
    renderBoard();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links each machine to its own page when given a href builder", () => {
    // m1 gets a play so it stays out of the attention list, leaving exactly
    // one link bearing its name.
    const breakdown = buildMachineBreakdown(MACHINES, [
      { machine_instance_id: "m1", event_type: "play_started" },
    ]);
    render(
      <FleetBoard
        zones={groupBreakdownByZone(breakdown)}
        breakdown={breakdown}
        machineHref={(id) => `/machines/${id}`}
      />
    );
    expect(screen.getByRole("link", { name: /BV-2001/ })).toHaveAttribute(
      "href",
      "/machines/m1"
    );
  });

  it("makes the attention list clickable too, so a problem is one tap away", () => {
    const breakdown = buildMachineBreakdown(MACHINES, []);
    render(
      <FleetBoard
        zones={groupBreakdownByZone(breakdown)}
        breakdown={breakdown}
        machineHref={(id) => `/machines/${id}`}
      />
    );
    expect(
      screen.getByRole("link", { name: /BV-2002 \(Hall 3\) — no signal/ })
    ).toHaveAttribute("href", "/machines/m2");
  });

  describe("prep mode, before a show opens", () => {
    const PREP_MACHINES: FleetMachineRow[] = [
      { id: "p1", serial_number: "BV-3001", zone: "Registration", mission: "welcome_gift" },
      { id: "p2", serial_number: "BV-3002", zone: "Registration" },
      { id: "p3", serial_number: "BV-3003" },
    ];

    function renderPrep() {
      const breakdown = buildMachineBreakdown(PREP_MACHINES, []);
      render(
        <FleetBoard
          zones={groupBreakdownByZone(breakdown)}
          breakdown={breakdown}
          mode="prep"
        />
      );
    }

    it("judges units on setup rather than signal", () => {
      renderPrep();
      expect(screen.getByText("2 machines need setting up")).toBeInTheDocument();
      expect(screen.queryByText(/no signal/)).not.toBeInTheDocument();
    });

    it("names exactly what each unit is missing", () => {
      renderPrep();
      expect(
        screen.getByText(/BV-3002 \(Registration\) — needs a job/)
      ).toBeInTheDocument();
      expect(screen.getByText(/BV-3003 — needs a zone and a job/)).toBeInTheDocument();
    });

    it("counts set-up units per zone instead of online ones", () => {
      renderPrep();
      expect(screen.getByText("1/2 set up")).toBeInTheDocument();
      expect(screen.queryByText(/online/)).not.toBeInTheDocument();
    });

    it("marks a fully configured unit as ready", () => {
      renderPrep();
      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("hides play and lead counters that would all read zero", () => {
      renderPrep();
      expect(screen.queryByText("Plays")).not.toBeInTheDocument();
      expect(screen.queryByText("Leads")).not.toBeInTheDocument();
    });
  });

  it("drops the attention banner when every machine is healthy", () => {
    const breakdown = buildMachineBreakdown(
      [{ id: "m1", serial_number: "BV-2001", zone: "Registration", last_heartbeat: FRESH }],
      [{ machine_instance_id: "m1", event_type: "play_started" }]
    );
    render(<FleetBoard zones={groupBreakdownByZone(breakdown)} breakdown={breakdown} />);
    expect(screen.queryByText(/needs? attention/)).not.toBeInTheDocument();
  });

  it("calls onMachineSelect when a row is clicked for feed drill-down", () => {
    const onSelect = vi.fn();
    const breakdown = buildMachineBreakdown(MACHINES, [
      { machine_instance_id: "m1", event_type: "play_started" },
    ]);
    render(
      <FleetBoard
        zones={groupBreakdownByZone(breakdown)}
        breakdown={breakdown}
        onMachineSelect={onSelect}
        selectedMachineId="m1"
      />
    );
    const row = screen.getByRole("button", { name: /BV-2001/ });
    expect(row).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ machine_instance_id: "m1" })
    );
  });
});
