import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AssignMachineForm } from "./AssignMachineForm";
import type { AssignableMachine } from "@/lib/queries/organizer-admin";

const assignMachineToShow = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  assignMachineToShow: (...args: unknown[]) => assignMachineToShow(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

const FREE: AssignableMachine[] = [
  {
    id: MACHINE_ID,
    serialNumber: "BV-2010",
    nickname: "Foyer unit",
    machineTypeName: "Bright.Vend Classic",
  },
];

beforeEach(() => {
  assignMachineToShow.mockReset();
  assignMachineToShow.mockResolvedValue({ success: true, data: { id: MACHINE_ID } });
  refresh.mockReset();
});

describe("AssignMachineForm", () => {
  it("points at registering a machine when nothing is free", () => {
    render(<AssignMachineForm eventId={EVENT_ID} machines={[]} />);
    expect(screen.getByText(/No free machines in the register/i)).toBeInTheDocument();
  });

  it("shows the serial, nickname, and hardware type of a free unit", () => {
    render(<AssignMachineForm eventId={EVENT_ID} machines={FREE} />);
    const option = screen.getByRole("option", { name: /BV-2010/ });
    expect(option).toHaveTextContent("Foyer unit");
    expect(option).toHaveTextContent("Bright.Vend Classic");
  });

  it("deploys the chosen unit to this show", async () => {
    const user = userEvent.setup();
    render(<AssignMachineForm eventId={EVENT_ID} machines={FREE} />);

    await user.selectOptions(screen.getByLabelText("Free machines"), MACHINE_ID);
    await user.click(screen.getByRole("button", { name: /deploy here/i }));

    await waitFor(() => {
      expect(assignMachineToShow).toHaveBeenCalledWith(MACHINE_ID, EVENT_ID);
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("refuses to submit with no unit chosen", async () => {
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<AssignMachineForm eventId={EVENT_ID} machines={FREE} />);

    await user.click(screen.getByRole("button", { name: /deploy here/i }));

    expect(toast.error).toHaveBeenCalledWith("Pick a machine to deploy.");
    expect(assignMachineToShow).not.toHaveBeenCalled();
  });

  it("surfaces the server's reason for refusing", async () => {
    assignMachineToShow.mockResolvedValue({
      success: false,
      error: "BV-2010 is already at another show. Release it there first.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<AssignMachineForm eventId={EVENT_ID} machines={FREE} />);

    await user.selectOptions(screen.getByLabelText("Free machines"), MACHINE_ID);
    await user.click(screen.getByRole("button", { name: /deploy here/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "BV-2010 is already at another show. Release it there first."
      );
    });
    expect(refresh).not.toHaveBeenCalled();
  });
});
