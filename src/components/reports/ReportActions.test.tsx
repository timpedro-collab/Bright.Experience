/** Tests for report generate/publish action controls. */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, userEvent, waitFor } from "@/test/render";
import { PublishReportBanner } from "./ReportActions";

const publishReport = vi.fn();

vi.mock("@/app/actions/reports", () => ({
  generateEventReport: vi.fn(),
  publishReport: (...args: unknown[]) => publishReport(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  publishReport.mockResolvedValue({ success: true, data: { shareToken: "tok" } });
});

describe("PublishReportBanner", () => {
  it("renders without a partner co-brand option", () => {
    render(<PublishReportBanner reportId="rep-1" />);

    expect(screen.getByText("Draft report")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders a checked co-brand checkbox when a partner is suggested", () => {
    render(
      <PublishReportBanner
        reportId="rep-1"
        suggestedPartner={{ id: "partner-1", name: "Agency X" }}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /co-brand for agency x/i }),
    ).toBeChecked();
  });

  it("passes null brandPartnerId when the checkbox is unchecked", async () => {
    const user = userEvent.setup();
    render(
      <PublishReportBanner
        reportId="rep-1"
        suggestedPartner={{ id: "partner-1", name: "Agency X" }}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", { name: /co-brand for agency x/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /review & publish/i }),
    );

    await waitFor(() =>
      expect(publishReport).toHaveBeenCalledWith("rep-1", {
        brandPartnerId: null,
        personalNote: null,
      }),
    );
  });

  it("sends the personal note along with the publish", async () => {
    const user = userEvent.setup();
    render(<PublishReportBanner reportId="rep-1" />);

    await user.type(
      screen.getByLabelText(/personal note/i),
      "Day two's queue said it all.",
    );
    await user.click(
      screen.getByRole("button", { name: /review & publish/i }),
    );

    await waitFor(() =>
      expect(publishReport).toHaveBeenCalledWith("rep-1", {
        personalNote: "Day two's queue said it all.",
      }),
    );
  });

  it("nudges the publisher to invoice first when none has been issued", () => {
    render(<PublishReportBanner reportId="rep-1" invoiceIssued={false} />);
    expect(screen.getByText(/no invoice issued/i)).toBeInTheDocument();
  });

  it("shows no invoice nudge by default", () => {
    render(<PublishReportBanner reportId="rep-1" />);
    expect(screen.queryByText(/no invoice issued/i)).not.toBeInTheDocument();
  });
});
