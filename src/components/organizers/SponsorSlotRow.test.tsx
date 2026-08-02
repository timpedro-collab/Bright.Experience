/**
 * Tests for the sponsor slot row.
 *
 * The pitch-link buttons are covered by `PitchLinkControls.test.tsx`; this
 * spec is about what the row says about the slot itself.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test/render";
import { SponsorSlotRow, type SponsorSlotView } from "./SponsorSlotRow";

const shareSlotPitch = vi.fn();
const revokeSlotPitch = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizers", () => ({
  shareSlotPitch: (...args: unknown[]) => shareSlotPitch(...args),
  revokeSlotPitch: (...args: unknown[]) => revokeSlotPitch(...args),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return { ...actual, useRouter: () => ({ refresh }) };
});

const BASE: SponsorSlotView = {
  id: "s1",
  eventId: "e1",
  showName: "Informa Tech Live",
  sponsorName: null,
  status: "available",
  startDate: "2026-09-15",
  endDate: "2026-09-17",
  price: 250000,
  pitchToken: null,
  zone: "Hall 3",
  mission: "sponsor_activation",
  machineLabel: "BV-2002",
};

function renderRow(overrides: Partial<SponsorSlotView> = {}) {
  return render(<SponsorSlotRow slot={{ ...BASE, ...overrides }} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SponsorSlotRow", () => {
  it("reads as an open slot until a sponsor is named", () => {
    renderRow();
    expect(screen.getByText("Open slot")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText(/Hall 3/)).toBeInTheDocument();
    expect(screen.getByText(/Sponsor activation/)).toBeInTheDocument();
  });

  it("carries the pitch-link controls for the slot", () => {
    renderRow();
    expect(
      screen.getByRole("button", { name: /create pitch link/i })
    ).toBeInTheDocument();
  });

  it("swaps to the live-link controls once a link exists", () => {
    renderRow({ pitchToken: "tok-123", sponsorName: "Sponsor Co" });
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create pitch link/i })
    ).not.toBeInTheDocument();
  });

  it("puts a clock on an unsold slot once the show is close", () => {
    render(<SponsorSlotRow slot={BASE} urgency="closing" daysToDoors={12} />);

    expect(screen.getByText("Unsold, 12 days left")).toBeInTheDocument();
  });

  it("says plainly when an unsold slot has run out of time", () => {
    render(<SponsorSlotRow slot={BASE} urgency="missed" daysToDoors={-3} />);

    expect(screen.getByText("Went unsold")).toBeInTheDocument();
  });

  it("leaves a sold slot unnagged", () => {
    render(
      <SponsorSlotRow
        slot={{ ...BASE, sponsorName: "Sponsor Co", status: "reserved" }}
        urgency="sold"
        daysToDoors={4}
      />
    );

    expect(screen.queryByText(/unsold/i)).not.toBeInTheDocument();
  });

  it("drops the show name when the heading above already carries it", () => {
    render(<SponsorSlotRow slot={BASE} hideShowName />);

    expect(screen.queryByText(/Informa Tech Live/)).not.toBeInTheDocument();
    expect(screen.getByText(/BV-2002/)).toBeInTheDocument();
  });
});
