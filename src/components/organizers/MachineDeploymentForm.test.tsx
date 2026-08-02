import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MachineDeploymentForm } from "./MachineDeploymentForm";

const updateMachineDeployment = vi.fn();

vi.mock("@/app/actions/organizers", () => ({
  updateMachineDeployment: (...args: unknown[]) =>
    updateMachineDeployment(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

const MACHINE_ID = "aaaaaaaa-1111-1111-1111-111111111111";

beforeEach(() => {
  updateMachineDeployment.mockReset();
  updateMachineDeployment.mockResolvedValue({ success: true, data: { id: MACHINE_ID } });
});

function renderForm(overrides: Partial<Parameters<typeof MachineDeploymentForm>[0]> = {}) {
  return render(
    <MachineDeploymentForm
      machineInstanceId={MACHINE_ID}
      zone="Hall 3"
      mission="sponsor_activation"
      knownZones={["Hall 3", "Registration North"]}
      {...overrides}
    />
  );
}

describe("MachineDeploymentForm", () => {
  it("cannot be saved until something actually changes", () => {
    renderForm();
    expect(screen.getByRole("button", { name: /saved/i })).toBeDisabled();
  });

  it("explains what the current mission means rather than showing a bare code", () => {
    renderForm();
    expect(
      screen.getByText("Runs a sponsor's branded game on their bought slot.")
    ).toBeInTheDocument();
  });

  it("saves an edited zone against the machine", async () => {
    const user = userEvent.setup();
    renderForm();

    const zone = screen.getByLabelText("Zone");
    await user.clear(zone);
    await user.type(zone, "Hall 5");
    await user.click(screen.getByRole("button", { name: /save deployment/i }));

    await waitFor(() => {
      expect(updateMachineDeployment).toHaveBeenCalledWith(MACHINE_ID, {
        zone: "Hall 5",
        mission: "sponsor_activation",
      });
    });
  });

  it("offers the show's other zones as one-click fills", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Registration North" }));
    expect(screen.getByLabelText("Zone")).toHaveValue("Registration North");
  });

  it("does not offer the zone the unit is already in", () => {
    renderForm();
    expect(screen.queryByRole("button", { name: "Hall 3" })).not.toBeInTheDocument();
  });

  it("surfaces a rejected save instead of pretending it worked", async () => {
    updateMachineDeployment.mockResolvedValue({
      success: false,
      error: "That machine isn't deployed to a show.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    renderForm();

    const zone = screen.getByLabelText("Zone");
    await user.type(zone, " North");
    await user.click(screen.getByRole("button", { name: /save deployment/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("That machine isn't deployed to a show.");
    });
  });

  it("tells an unassigned unit what happens until a mission is set", () => {
    renderForm({ mission: null });
    expect(
      screen.getByText("Until this is set the unit runs the show-wide default.")
    ).toBeInTheDocument();
  });
});
