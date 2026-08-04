/** Tests for pushing an inbound lead to an organizer channel. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushLeadToOrganizer = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/deal-registrations", () => ({
  pushLeadToOrganizer: (...args: unknown[]) => pushLeadToOrganizer(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { PushLeadCard } from "./PushLeadCard";

const ORGANIZERS = [{ id: "org-1", name: "Informa Tech Shows" }];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PushLeadCard", () => {
  it("renders nothing when there are no organizers to route to", () => {
    const { container } = render(
      <PushLeadCard quoteId="q1" companyName="Duracell" organizers={[]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("requires an organizer before pushing", async () => {
    const user = userEvent.setup();
    render(
      <PushLeadCard quoteId="q1" companyName="Duracell" organizers={ORGANIZERS} />
    );

    await user.click(screen.getByRole("button", { name: /push lead/i }));

    expect(pushLeadToOrganizer).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Pick which organizer gets the lead.");
  });

  it("pushes the lead to the chosen organizer", async () => {
    pushLeadToOrganizer.mockResolvedValue({ success: true, data: { id: "d1" } });
    const user = userEvent.setup();
    render(
      <PushLeadCard quoteId="q1" companyName="Duracell" organizers={ORGANIZERS} />
    );

    await user.selectOptions(screen.getByLabelText(/organizer/i), "org-1");
    await user.click(screen.getByRole("button", { name: /push lead/i }));

    await waitFor(() =>
      expect(pushLeadToOrganizer).toHaveBeenCalledWith({
        quoteId: "q1",
        partnerId: "org-1",
      })
    );
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/pushed to Informa Tech Shows/i)
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("surfaces a competing claim without refreshing", async () => {
    pushLeadToOrganizer.mockResolvedValue({
      success: false,
      error: "Another channel already holds a claim on this sponsor.",
    });
    const user = userEvent.setup();
    render(
      <PushLeadCard quoteId="q1" companyName="Duracell" organizers={ORGANIZERS} />
    );

    await user.selectOptions(screen.getByLabelText(/organizer/i), "org-1");
    await user.click(screen.getByRole("button", { name: /push lead/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Another channel already holds a claim on this sponsor."
      )
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
