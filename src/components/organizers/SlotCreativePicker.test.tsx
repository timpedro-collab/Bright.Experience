import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SlotCreativePicker } from "./SlotCreativePicker";
import type { ShowCreativeOption } from "@/lib/queries/organizers";

const attachSlotCreatives = vi.fn();

vi.mock("@/app/actions/organizers", () => ({
  attachSlotCreatives: (...args: unknown[]) => attachSlotCreatives(...(args as [])),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return { ...actual, toast: { success: vi.fn(), error: vi.fn() } };
});

const SLOT_ID = "bbbbbbbb-1111-1111-1111-111111111111";
const WRAP = "cccccccc-1111-1111-1111-111111111111";
const SCREEN = "cccccccc-2222-2222-2222-222222222222";

const OPTIONS: ShowCreativeOption[] = [
  { id: WRAP, name: "Vitality machine wrap", assetType: "wrap", reviewStatus: "approved" },
  {
    id: SCREEN,
    name: "Vitality screen loop",
    assetType: "screen",
    reviewStatus: "pending_review",
  },
];

beforeEach(() => {
  attachSlotCreatives.mockReset();
  attachSlotCreatives.mockResolvedValue({ success: true, data: { id: SLOT_ID } });
});

describe("SlotCreativePicker", () => {
  it("says so when the show has no uploaded artwork to attach", () => {
    render(<SlotCreativePicker slotId={SLOT_ID} attachedIds={[]} options={[]} />);
    expect(
      screen.getByText("No uploaded creative on this show yet.")
    ).toBeInTheDocument();
  });

  it("keeps the list closed until asked", async () => {
    const user = userEvent.setup();
    render(<SlotCreativePicker slotId={SLOT_ID} attachedIds={[]} options={OPTIONS} />);

    expect(screen.queryByText("Vitality machine wrap")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Attach creative/ }));
    expect(screen.getByText("Vitality machine wrap")).toBeInTheDocument();
  });

  it("attaches a chosen asset alongside anything already on the slot", async () => {
    const user = userEvent.setup();
    render(
      <SlotCreativePicker slotId={SLOT_ID} attachedIds={[WRAP]} options={OPTIONS} />
    );

    await user.click(screen.getByRole("button", { name: /Creative \(1\)/ }));
    await user.click(screen.getByText("Vitality screen loop"));

    await waitFor(() => {
      expect(attachSlotCreatives).toHaveBeenCalledWith(SLOT_ID, [WRAP, SCREEN]);
    });
  });

  it("detaches an asset that is already attached", async () => {
    const user = userEvent.setup();
    render(
      <SlotCreativePicker
        slotId={SLOT_ID}
        attachedIds={[WRAP, SCREEN]}
        options={OPTIONS}
      />
    );

    await user.click(screen.getByRole("button", { name: /Creative \(2\)/ }));
    await user.click(screen.getByText("Vitality machine wrap"));

    await waitFor(() => {
      expect(attachSlotCreatives).toHaveBeenCalledWith(SLOT_ID, [SCREEN]);
    });
  });

  it("warns that an asset hasn't been through review yet", async () => {
    const user = userEvent.setup();
    render(<SlotCreativePicker slotId={SLOT_ID} attachedIds={[]} options={OPTIONS} />);

    await user.click(screen.getByRole("button", { name: /Attach creative/ }));
    expect(screen.getByText("Unapproved")).toBeInTheDocument();
  });

  it("reports a refusal from the server", async () => {
    attachSlotCreatives.mockResolvedValue({
      success: false,
      error: "That asset isn't on this show.",
    });
    const { toast } = await import("sonner");
    const user = userEvent.setup();
    render(<SlotCreativePicker slotId={SLOT_ID} attachedIds={[]} options={OPTIONS} />);

    await user.click(screen.getByRole("button", { name: /Attach creative/ }));
    await user.click(screen.getByText("Vitality machine wrap"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("That asset isn't on this show.");
    });
  });
});
