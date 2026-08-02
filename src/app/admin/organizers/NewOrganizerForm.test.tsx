import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NewOrganizerForm } from "./NewOrganizerForm";

const createOrganizerPartner = vi.fn();
const push = vi.fn();

vi.mock("@/app/actions/organizer-admin", () => ({
  createOrganizerPartner: (...args: unknown[]) => createOrganizerPartner(...(args as [])),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const PARTNER_ID = "cccccccc-1111-1111-1111-111111111111";

beforeEach(() => {
  createOrganizerPartner.mockReset();
  createOrganizerPartner.mockResolvedValue({
    success: true,
    data: { id: PARTNER_ID, slug: "informa-tech-shows" },
  });
  push.mockReset();
});

async function openForm() {
  const user = userEvent.setup();
  render(<NewOrganizerForm />);
  await user.click(screen.getByRole("button", { name: /add an organizer/i }));
  return user;
}

describe("NewOrganizerForm", () => {
  it("stays collapsed until asked for", () => {
    render(<NewOrganizerForm />);
    expect(screen.queryByLabelText("Organizer")).not.toBeInTheDocument();
  });

  it("creates an organizer from the name alone", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Organizer"), "Informa Tech Shows");
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    await waitFor(() => {
      expect(createOrganizerPartner).toHaveBeenCalledWith({
        name: "Informa Tech Shows",
        contactName: undefined,
        contactEmail: undefined,
      });
    });
  });

  it("passes the contact through when it's known", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Organizer"), "Reed Exhibitions");
    await user.type(screen.getByLabelText("Main contact"), "Nadia Okafor");
    await user.type(screen.getByLabelText("Contact email"), "nadia@reed.example");
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    await waitFor(() => {
      expect(createOrganizerPartner).toHaveBeenCalledWith({
        name: "Reed Exhibitions",
        contactName: "Nadia Okafor",
        contactEmail: "nadia@reed.example",
      });
    });
  });

  it("doesn't create anything when the name is left blank", async () => {
    const user = await openForm();
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    expect(createOrganizerPartner).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Organizer")).toBeInvalid();
  });

  it("refuses a name of nothing but spaces, which the browser accepts", async () => {
    const { toast } = await import("sonner");
    const user = await openForm();
    await user.type(screen.getByLabelText("Organizer"), "   ");
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    expect(toast.error).toHaveBeenCalledWith("Give the organizer a name.");
    expect(createOrganizerPartner).not.toHaveBeenCalled();
  });

  it("opens the new organizer's setup page so the work continues", async () => {
    const user = await openForm();
    await user.type(screen.getByLabelText("Organizer"), "Clarion");
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(`/admin/organizers/${PARTNER_ID}`);
    });
  });

  it("keeps the form open and reports a server refusal", async () => {
    createOrganizerPartner.mockResolvedValue({ success: false, error: "Failed to create the organizer" });
    const { toast } = await import("sonner");
    const user = await openForm();
    await user.type(screen.getByLabelText("Organizer"), "Clarion");
    await user.click(screen.getByRole("button", { name: /create organizer/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to create the organizer");
    });
    expect(screen.getByLabelText("Organizer")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
