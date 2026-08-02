/**
 * Component tests for the internal "send a proof for sign-off" form.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { toast } from "sonner";

const requestApproval = vi.fn();
vi.mock("@/app/actions/approvals", () => ({
  requestApproval: (...args: unknown[]) => requestApproval(...args),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { ...actual.toast, success: vi.fn(), error: vi.fn() },
  };
});

const EVENT_ID = "e1111111-1111-1111-1111-111111111111";

const toastError = vi.mocked(toast.error);

beforeEach(() => {
  requestApproval.mockReset();
  toastError.mockReset();
  requestApproval.mockResolvedValue({
    success: true,
    data: { approvalId: "ab1" },
  });
});

describe("RequestApprovalForm", () => {
  it("submits the title, deliverable and note", async () => {
    const user = userEvent.setup();
    const { RequestApprovalForm } = await import("./RequestApprovalForm");
    render(<RequestApprovalForm eventId={EVENT_ID} />);

    await user.type(
      screen.getByLabelText(/What are they signing off/i),
      "Machine wrap — final artwork"
    );
    await user.selectOptions(
      screen.getByLabelText(/Deliverable/i),
      "game_flow"
    );
    await user.type(
      screen.getByLabelText(/Note for the customer/i),
      "Galaxy Blue corrected"
    );
    await user.click(screen.getByRole("button", { name: /Send for sign-off/i }));

    await waitFor(() =>
      expect(requestApproval).toHaveBeenCalledWith({
        eventId: EVENT_ID,
        title: "Machine wrap — final artwork",
        approvalType: "game_flow",
        description: "Galaxy Blue corrected",
        previewUrl: undefined,
      })
    );
  });

  it("sends the storage path of a chosen uploaded asset as the proof", async () => {
    const user = userEvent.setup();
    const { RequestApprovalForm } = await import("./RequestApprovalForm");
    render(
      <RequestApprovalForm
        eventId={EVENT_ID}
        proofOptions={[
          { id: "a1", name: "Wrap artwork", path: `${EVENT_ID}/asset/a1/wrap.png` },
        ]}
      />
    );

    await user.type(
      screen.getByLabelText(/What are they signing off/i),
      "Wrap proof"
    );
    await user.selectOptions(screen.getByLabelText(/^Proof$/i), "a1");
    await user.click(screen.getByRole("button", { name: /Send for sign-off/i }));

    await waitFor(() =>
      expect(requestApproval).toHaveBeenCalledWith(
        expect.objectContaining({ previewUrl: `${EVENT_ID}/asset/a1/wrap.png` })
      )
    );
  });

  it("hides the external link field once an uploaded asset is chosen", async () => {
    const user = userEvent.setup();
    const { RequestApprovalForm } = await import("./RequestApprovalForm");
    render(
      <RequestApprovalForm
        eventId={EVENT_ID}
        proofOptions={[
          { id: "a1", name: "Wrap artwork", path: `${EVENT_ID}/asset/a1/wrap.png` },
        ]}
      />
    );

    expect(screen.getByLabelText(/Proof link/i)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/^Proof$/i), "a1");
    expect(screen.queryByLabelText(/Proof link/i)).not.toBeInTheDocument();
  });

  it("surfaces the server error and keeps what was typed", async () => {
    requestApproval.mockResolvedValue({
      success: false,
      error: "Your role can't request customer sign-off.",
    });
    const user = userEvent.setup();
    const { RequestApprovalForm } = await import("./RequestApprovalForm");
    render(<RequestApprovalForm eventId={EVENT_ID} />);

    const title = screen.getByLabelText(/What are they signing off/i);
    await user.type(title, "Wrap proof");
    await user.click(screen.getByRole("button", { name: /Send for sign-off/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Couldn't post the proof",
        expect.objectContaining({
          description: "Your role can't request customer sign-off.",
        })
      )
    );
    expect(title).toHaveValue("Wrap proof");
  });

  it("clears the form after a successful send", async () => {
    const user = userEvent.setup();
    const { RequestApprovalForm } = await import("./RequestApprovalForm");
    render(<RequestApprovalForm eventId={EVENT_ID} />);

    const title = screen.getByLabelText(/What are they signing off/i);
    await user.type(title, "Wrap proof");
    await user.click(screen.getByRole("button", { name: /Send for sign-off/i }));

    await waitFor(() => expect(title).toHaveValue(""));
  });
});
