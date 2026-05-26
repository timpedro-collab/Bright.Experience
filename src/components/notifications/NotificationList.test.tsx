/**
 * Component tests for the notification list.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { NotificationList } from "./NotificationList";
import { makeNotification } from "@/test/fixtures";

describe("NotificationList", () => {
  it("renders nothing when given an empty list", () => {
    render(<NotificationList notifications={[]} />);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("groups action_required items under 'Awaiting you'", () => {
    render(
      <NotificationList
        notifications={[
          makeNotification({
            id: "1",
            title: "Upload your assets",
            actionRequired: true,
          }),
        ]}
      />
    );
    expect(screen.getByText(/Awaiting you · 1/i)).toBeInTheDocument();
    expect(screen.getByText("Upload your assets")).toBeInTheDocument();
  });

  it("groups FYI items under 'FYI' with recency subheadings", () => {
    render(
      <NotificationList
        notifications={[
          makeNotification({
            id: "1",
            title: "An asset was approved",
            actionRequired: false,
            kind: "asset.review_approved",
            createdAt: new Date().toISOString(),
          }),
        ]}
      />
    );
    expect(screen.getByText(/FYI · 1/i)).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("renders the unread indicator dot for unread notifications", () => {
    const { container } = render(
      <NotificationList
        notifications={[
          makeNotification({ id: "1", isRead: false, actionRequired: false }),
        ]}
      />
    );
    // Unread dot has the inline shadow class
    expect(container.querySelector(".bg-primary")).toBeInTheDocument();
  });

  it("counts items separately by action_required vs fyi", () => {
    render(
      <NotificationList
        notifications={[
          makeNotification({ id: "1", actionRequired: true }),
          makeNotification({ id: "2", actionRequired: true }),
          makeNotification({ id: "3", actionRequired: false, kind: "stage.changed" }),
        ]}
      />
    );
    expect(screen.getByText(/Awaiting you · 2/i)).toBeInTheDocument();
    expect(screen.getByText(/FYI · 1/i)).toBeInTheDocument();
  });
});
