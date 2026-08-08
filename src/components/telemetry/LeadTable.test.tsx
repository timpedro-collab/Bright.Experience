/** Tests for the leads table — export must not render when there is nothing to export. */
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { LeadTable } from "./LeadTable";

const LEAD = {
  id: "11111111-1111-4111-8111-111111111111",
  contactName: "Ada Lovelace",
  contactEmail: "ada@example.com",
  source: "quiz",
  capturedAt: "2026-08-01T10:00:00.000Z",
};

describe("LeadTable", () => {
  it("hides the export button when there are no leads", () => {
    render(<LeadTable leads={[]} />);

    expect(
      screen.queryByRole("button", { name: /export csv/i }),
    ).not.toBeInTheDocument();
  });

  it("shows an empty-state message when there are no leads", () => {
    render(<LeadTable leads={[]} />);

    expect(screen.getByText(/no leads found/i)).toBeInTheDocument();
  });

  it("shows the export button when leads exist", () => {
    render(<LeadTable leads={[LEAD]} />);

    expect(
      screen.getByRole("button", { name: /export csv/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
  });
});
