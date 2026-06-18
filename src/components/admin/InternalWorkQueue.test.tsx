/**
 * Component tests for the internal work-queue widget.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { InternalWorkQueue } from "./InternalWorkQueue";

const emptyQueues = {
  newQuotes: 0,
  pendingPartnerApps: 0,
  newStudioOrders: 0,
  blockedEvents: 0,
  assetReviews: 0,
  stuckCustomerActions: 0,
};

describe("InternalWorkQueue", () => {
  it("renders all six tiles for an admin (owns every queue)", () => {
    render(<InternalWorkQueue queues={emptyQueues} viewerRole="admin" />);
    expect(screen.getByText(/New quote requests/i)).toBeInTheDocument();
    expect(screen.getByText(/Studio orders to action/i)).toBeInTheDocument();
    expect(screen.getByText(/Asset reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Stuck customers/i)).toBeInTheDocument();
    expect(screen.getByText(/Partner applications/i)).toBeInTheDocument();
    expect(screen.getByText(/Blocked events/i)).toBeInTheDocument();
  });

  it("shows '0 open' in the header when no work", () => {
    render(<InternalWorkQueue queues={emptyQueues} viewerRole="admin" />);
    expect(screen.getByText("0 open")).toBeInTheDocument();
  });

  it("sums counts in the header total for the queues the role owns", () => {
    render(
      <InternalWorkQueue
        queues={{
          newQuotes: 1,
          pendingPartnerApps: 2,
          newStudioOrders: 3,
          blockedEvents: 4,
          assetReviews: 5,
          stuckCustomerActions: 6,
        }}
        viewerRole="admin"
      />
    );
    expect(screen.getByText("21 open")).toBeInTheDocument();
  });

  it("renders each tile count", () => {
    render(
      <InternalWorkQueue
        queues={{
          ...emptyQueues,
          newQuotes: 7,
          assetReviews: 12,
        }}
        viewerRole="admin"
      />
    );
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("links each tile to its admin URL", () => {
    render(<InternalWorkQueue queues={emptyQueues} viewerRole="admin" />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/admin/quotes");
    expect(hrefs).toContain("/admin/asset-reviews");
    expect(hrefs).toContain("/admin/customer-queue");
    expect(hrefs).toContain("/admin/partners");
  });

  it("scopes creative queues to the Creative Lead (no quote/partner cards)", () => {
    render(<InternalWorkQueue queues={emptyQueues} viewerRole="creative_lead" />);
    expect(screen.getByText(/Asset reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Studio orders to action/i)).toBeInTheDocument();
    expect(screen.queryByText(/New quote requests/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Partner applications/i)).not.toBeInTheDocument();
  });

  it("renders nothing for specialist lanes that own no admin queues", () => {
    render(
      <InternalWorkQueue queues={emptyQueues} viewerRole="operations_lead" />
    );
    expect(screen.queryByText(/Work queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Asset reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/New quote requests/i)).not.toBeInTheDocument();
  });
});
