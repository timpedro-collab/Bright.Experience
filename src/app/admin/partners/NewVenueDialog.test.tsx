import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewVenueDialog } from "./NewVenueDialog";

const createVenue = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/venues", () => ({
  createVenue: (...args: unknown[]) => createVenue(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

beforeEach(() => {
  createVenue.mockReset();
  createVenue.mockResolvedValue({
    success: true,
    data: { id: "v1", slug: "riverside-arena" },
  });
  refresh.mockReset();
});

/** Open the dialog from its trigger button. */
async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /new venue/i }));
  await screen.findByRole("dialog");
}

describe("NewVenueDialog", () => {
  it("creates a venue with the typed details", async () => {
    const user = userEvent.setup();
    render(<NewVenueDialog />);
    await openDialog(user);

    await user.type(screen.getByLabelText("Venue name"), "Riverside Arena");
    await user.type(screen.getByLabelText("Address"), "1 Riverside Way");
    await user.type(screen.getByLabelText("Postcode"), "SE1 9PX");
    await user.selectOptions(screen.getByLabelText("Venue type"), "arena");
    await user.type(screen.getByLabelText("Capacity"), "12000");
    await user.click(screen.getByRole("button", { name: /create venue/i }));

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalledWith({
        name: "Riverside Arena",
        address: "1 Riverside Way",
        postcode: "SE1 9PX",
        venueType: "arena",
        capacity: 12000,
      });
    });
  });

  it("omits the optional fields left blank", async () => {
    const user = userEvent.setup();
    render(<NewVenueDialog />);
    await openDialog(user);

    await user.type(screen.getByLabelText("Venue name"), "Riverside Arena");
    await user.click(screen.getByRole("button", { name: /create venue/i }));

    await waitFor(() => {
      expect(createVenue).toHaveBeenCalledWith({
        name: "Riverside Arena",
        address: undefined,
        postcode: undefined,
        venueType: "convention_centre",
        capacity: undefined,
      });
    });
  });

  it("sends nothing without a venue name", async () => {
    const user = userEvent.setup();
    render(<NewVenueDialog />);
    await openDialog(user);

    await user.click(screen.getByRole("button", { name: /create venue/i }));

    expect(createVenue).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Venue name")).toBeInvalid();
  });

  it("closes the dialog and refreshes the list on success", async () => {
    const user = userEvent.setup();
    render(<NewVenueDialog />);
    await openDialog(user);

    await user.type(screen.getByLabelText("Venue name"), "Riverside Arena");
    await user.click(screen.getByRole("button", { name: /create venue/i }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open and shows the error when the server refuses", async () => {
    createVenue.mockResolvedValue({ success: false, error: "Failed to create the venue" });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<NewVenueDialog />);
    await openDialog(user);

    await user.type(screen.getByLabelText("Venue name"), "Riverside Arena");
    await user.click(screen.getByRole("button", { name: /create venue/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create the venue");
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
