import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SlotMachineSelect, type SlotMachineChoice } from "./SlotMachineSelect";

const assignSlotMachine = vi.fn();

vi.mock("@/app/actions/organizers", () => ({
  assignSlotMachine: (...args: unknown[]) => assignSlotMachine(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const SLOT_ID = "bbbbbbbb-1111-1111-1111-111111111111";
const A = "aaaaaaaa-1111-1111-1111-111111111111";
const B = "aaaaaaaa-2222-2222-2222-222222222222";

const MACHINES: SlotMachineChoice[] = [
  { id: A, label: "Hall 3 Sponsor Stand", zone: "Hall 3", mission: "sponsor_activation" },
  { id: B, label: "Hall 5 Sponsor Stand", zone: "Hall 5", mission: "sponsor_activation" },
];

beforeEach(() => {
  assignSlotMachine.mockReset();
  assignSlotMachine.mockResolvedValue({ success: true, data: { id: SLOT_ID } });
});

describe("SlotMachineSelect", () => {
  it("hides itself when there is nowhere else to move the slot", () => {
    const { container } = render(
      <SlotMachineSelect slotId={SLOT_ID} currentMachineId={A} machines={[MACHINES[0]]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("moves the slot to the chosen machine", async () => {
    const user = userEvent.setup();
    render(
      <SlotMachineSelect slotId={SLOT_ID} currentMachineId={A} machines={MACHINES} />
    );

    await user.selectOptions(
      screen.getByLabelText("Machine running this slot"),
      B
    );

    await waitFor(() => {
      expect(assignSlotMachine).toHaveBeenCalledWith(SLOT_ID, B);
    });
  });

  it("does nothing when the same machine is re-picked", async () => {
    const user = userEvent.setup();
    render(
      <SlotMachineSelect slotId={SLOT_ID} currentMachineId={A} machines={MACHINES} />
    );

    await user.selectOptions(
      screen.getByLabelText("Machine running this slot"),
      A
    );
    expect(assignSlotMachine).not.toHaveBeenCalled();
  });

  it("reports a refusal from the server", async () => {
    assignSlotMachine.mockResolvedValue({
      success: false,
      error: "That machine isn't deployed to this show.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(
      <SlotMachineSelect slotId={SLOT_ID} currentMachineId={A} machines={MACHINES} />
    );

    await user.selectOptions(
      screen.getByLabelText("Machine running this slot"),
      B
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "That machine isn't deployed to this show."
      );
    });
  });

  it("shows an unassigned slot as such rather than defaulting to a unit", () => {
    render(
      <SlotMachineSelect slotId={SLOT_ID} currentMachineId={null} machines={MACHINES} />
    );
    expect(screen.getByLabelText("Machine running this slot")).toHaveValue("");
  });
});
