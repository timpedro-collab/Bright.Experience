import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewShowSlotForm, type SlotMachineOption } from "./NewShowSlotForm";

const createShowSlot = vi.fn();

vi.mock("@/app/actions/organizers", () => ({
  createShowSlot: (...args: unknown[]) => createShowSlot(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

const MACHINES: SlotMachineOption[] = [
  {
    id: MACHINE_ID,
    label: "Hall 3 Sponsor Stand",
    zone: "Hall 3",
    mission: "sponsor_activation",
    slotCount: 0,
  },
];

beforeEach(() => {
  createShowSlot.mockReset();
  createShowSlot.mockResolvedValue({ success: true, data: { id: "slot-1" } });
});

function renderForm(machines = MACHINES) {
  return render(
    <NewShowSlotForm
      eventId={EVENT_ID}
      machines={machines}
      defaultStartDate="2026-07-26"
      defaultEndDate="2026-07-28"
    />
  );
}

describe("NewShowSlotForm", () => {
  it("renders nothing when the show has no machines to sell", () => {
    const { container } = renderForm([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("stays collapsed until asked for, so it doesn't dominate the page", async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.queryByLabelText("Machine")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open a slot/i }));
    expect(screen.getByLabelText("Machine")).toBeInTheDocument();
  });

  it("pre-fills the show dates so the common case is two clicks", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));

    expect(screen.getByLabelText("Runs from")).toHaveValue("2026-07-26");
    expect(screen.getByLabelText("Runs to")).toHaveValue("2026-07-28");
  });

  it("refuses to submit without a machine chosen", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    expect(toast.error).toHaveBeenCalledWith("Pick which machine you're selling.");
    expect(createShowSlot).not.toHaveBeenCalled();
  });

  it("rejects a date range that ends before it starts", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));

    await user.selectOptions(screen.getByLabelText("Machine"), MACHINE_ID);
    await user.clear(screen.getByLabelText("Runs to"));
    await user.type(screen.getByLabelText("Runs to"), "2026-07-20");
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    expect(toast.error).toHaveBeenCalledWith(
      "The end date can't fall before the start date."
    );
    expect(createShowSlot).not.toHaveBeenCalled();
  });

  it("creates the slot with whole-pound pricing and an optional sponsor", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));

    await user.selectOptions(screen.getByLabelText("Machine"), MACHINE_ID);
    await user.type(screen.getByLabelText("Sponsor"), "Vitality");
    await user.type(screen.getByLabelText("Sponsor price (£)"), "18000");
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    await waitFor(() => {
      expect(createShowSlot).toHaveBeenCalledWith({
        eventId: EVENT_ID,
        machineInstanceId: MACHINE_ID,
        sponsorName: "Vitality",
        startDate: "2026-07-26",
        endDate: "2026-07-28",
        price: 18000,
        // Untouched wholesale falls back to the rack −25% suggestion.
        wholesalePrice: 13500,
      });
    });
  });

  it("leaves sponsor and price off when they aren't known yet", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));
    await user.selectOptions(screen.getByLabelText("Machine"), MACHINE_ID);
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    await waitFor(() => {
      expect(createShowSlot).toHaveBeenCalledWith(
        expect.objectContaining({ sponsorName: undefined, price: undefined })
      );
    });
  });

  it("prefers a typed wholesale cost over the suggested one", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));
    await user.selectOptions(screen.getByLabelText("Machine"), MACHINE_ID);
    await user.type(screen.getByLabelText("Sponsor price (£)"), "18000");
    await user.type(screen.getByLabelText("Your cost (£)"), "12000");
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    await waitFor(() => {
      expect(createShowSlot).toHaveBeenCalledWith(
        expect.objectContaining({ price: 18000, wholesalePrice: 12000 })
      );
    });
  });

  it("surfaces a server refusal instead of closing as if it worked", async () => {
    createShowSlot.mockResolvedValue({
      success: false,
      error: "That machine isn't deployed to this show.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole("button", { name: /open a slot/i }));
    await user.selectOptions(screen.getByLabelText("Machine"), MACHINE_ID);
    await user.click(screen.getByRole("button", { name: "Open slot" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "That machine isn't deployed to this show."
      );
    });
    expect(screen.getByLabelText("Machine")).toBeInTheDocument();
  });

  it("flags a unit that already carries a slot", async () => {
    const user = userEvent.setup();
    renderForm([{ ...MACHINES[0], slotCount: 1 }]);
    await user.click(screen.getByRole("button", { name: /open a slot/i }));

    expect(screen.getByText(/already has a slot/)).toBeInTheDocument();
  });
});
