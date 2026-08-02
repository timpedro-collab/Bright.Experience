import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RegisterMachineForm, type MachineTypeOption } from "./RegisterMachineForm";

const createMachineInstance = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  createMachineInstance: (...args: unknown[]) => createMachineInstance(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";
const TYPE_ID = "dddddddd-1111-1111-1111-111111111111";

const TYPES: MachineTypeOption[] = [
  { id: TYPE_ID, name: "Bright.Vend Classic" },
  { id: "dddddddd-2222-2222-2222-222222222222", name: "Bright.Vend Slim" },
];

beforeEach(() => {
  createMachineInstance.mockReset();
  createMachineInstance.mockResolvedValue({
    success: true,
    data: { id: "m1", serialNumber: "BV-2010" },
  });
  refresh.mockReset();
});

async function openForm(types = TYPES) {
  const user = userEvent.setup();
  render(<RegisterMachineForm eventId={EVENT_ID} machineTypes={types} />);
  await user.click(screen.getByRole("button", { name: /register a new machine/i }));
  return user;
}

describe("RegisterMachineForm", () => {
  it("sends people to the catalog when there are no machine types", () => {
    render(<RegisterMachineForm eventId={EVENT_ID} machineTypes={[]} />);
    expect(screen.getByText(/Add a machine to the catalog/i)).toBeInTheDocument();
  });

  it("stays collapsed until asked for", () => {
    render(<RegisterMachineForm eventId={EVENT_ID} machineTypes={TYPES} />);
    expect(screen.queryByLabelText("Serial number")).not.toBeInTheDocument();
  });

  it("registers the unit against this show, defaulting to the first type", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Serial number"), "bv-2010");
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    await waitFor(() => {
      expect(createMachineInstance).toHaveBeenCalledWith({
        machineTypeId: TYPE_ID,
        serialNumber: "bv-2010",
        nickname: undefined,
        eventId: EVENT_ID,
      });
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("carries the chosen type and nickname", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Serial number"), "BV-2011");
    await user.selectOptions(screen.getByLabelText("Machine"), TYPES[1].id);
    await user.type(screen.getByLabelText("Nickname"), "Registration desk");
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    await waitFor(() => {
      expect(createMachineInstance).toHaveBeenCalledWith({
        machineTypeId: TYPES[1].id,
        serialNumber: "BV-2011",
        nickname: "Registration desk",
        eventId: EVENT_ID,
      });
    });
  });

  it("doesn't register anything without a serial", async () => {
    const user = await openForm();
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    expect(createMachineInstance).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Serial number")).toBeInvalid();
  });

  it("refuses a serial of nothing but spaces, which the browser accepts", async () => {
    const { toast } = await import("sonner");
    const user = await openForm();
    await user.type(screen.getByLabelText("Serial number"), "   ");
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    expect(toast.error).toHaveBeenCalledWith("Enter the serial number on the unit.");
    expect(createMachineInstance).not.toHaveBeenCalled();
  });

  it("keeps the form open when the serial is already registered", async () => {
    createMachineInstance.mockResolvedValue({
      success: false,
      error: "BV-2010 is already registered.",
    });
    const { toast } = await import("sonner");
    const user = await openForm();
    await user.type(screen.getByLabelText("Serial number"), "BV-2010");
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("BV-2010 is already registered.");
    });
    expect(screen.getByLabelText("Serial number")).toHaveValue("BV-2010");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("closes and clears after a successful registration", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Serial number"), "BV-2010");
    await user.click(screen.getByRole("button", { name: /register and deploy/i }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Serial number")).not.toBeInTheDocument();
    });
  });
});
