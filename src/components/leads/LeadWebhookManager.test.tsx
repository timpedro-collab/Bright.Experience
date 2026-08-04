/** Tests for the lead webhook manager UI. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createLeadWebhook = vi.fn();
const toggleLeadWebhook = vi.fn();
const deleteLeadWebhook = vi.fn();
const refresh = vi.fn();

vi.mock("@/app/actions/lead-webhooks", () => ({
  createLeadWebhook: (...args: unknown[]) => createLeadWebhook(...args),
  toggleLeadWebhook: (...args: unknown[]) => toggleLeadWebhook(...args),
  deleteLeadWebhook: (...args: unknown[]) => deleteLeadWebhook(...args),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { LeadWebhookManager } from "./LeadWebhookManager";

const EVENT_ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
});

describe("LeadWebhookManager", () => {
  it("renders existing webhook subscriptions", () => {
    render(
      <LeadWebhookManager
        eventId={EVENT_ID}
        webhooks={[
          {
            id: "wh-1",
            url: "https://crm.example.com/hooks/brightblue",
            isActive: true,
            failureCount: 2,
            lastTriggeredAt: "2026-08-04T10:00:00.000Z",
          },
        ]}
      />,
    );

    expect(screen.getByText(/crm\.example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/2 failed deliveries/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disable/i })).toBeInTheDocument();
  });

  it("shows the signing secret once after creating an endpoint", async () => {
    createLeadWebhook.mockResolvedValue({
      success: true,
      data: { id: "wh-new", secret: "abc123secret" },
    });
    const user = userEvent.setup();

    render(<LeadWebhookManager eventId={EVENT_ID} webhooks={[]} />);

    await user.click(screen.getByRole("button", { name: /add endpoint/i }));
    await user.type(
      screen.getByLabelText(/https url/i),
      "https://crm.example.com/leads",
    );
    await user.click(screen.getByRole("button", { name: /save endpoint/i }));

    await waitFor(() =>
      expect(createLeadWebhook).toHaveBeenCalledWith({
        eventId: EVENT_ID,
        url: "https://crm.example.com/leads",
      }),
    );

    expect(
      screen.getByText(/store this now — it won't be shown again/i),
    ).toBeInTheDocument();
    expect(screen.getByText("abc123secret")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("calls toggleLeadWebhook when enable/disable is clicked", async () => {
    toggleLeadWebhook.mockResolvedValue({ success: true, data: undefined });
    const user = userEvent.setup();

    render(
      <LeadWebhookManager
        eventId={EVENT_ID}
        webhooks={[
          {
            id: "wh-1",
            url: "https://crm.example.com/leads",
            isActive: false,
            failureCount: 0,
            lastTriggeredAt: null,
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^enable$/i }));

    await waitFor(() =>
      expect(toggleLeadWebhook).toHaveBeenCalledWith("wh-1", true),
    );
    expect(refresh).toHaveBeenCalled();
  });
});
