/**
 * Component tests for the fused "Over to you" block.
 *
 * The contract that matters to the customer:
 *   - when they owe things, the most important one is the loud primary CTA
 *     and every item shows a why-line
 *   - the CTA always belongs to the promoted item: the next-step label is
 *     borrowed only when it targets the same destination, so the button never
 *     advertises a different action than the row it sits under
 *   - when they owe nothing, it reassures and previews what's coming next
 *     rather than reading as "finished forever"
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/render";
import { OverToYou } from "./OverToYou";
import type { CustomerActionItem } from "@/lib/queries/deadlines";
import type { NextStep } from "@/lib/event-next-step";

const nextStep: NextStep = {
  eyebrow: "Assets due",
  title: "Upload your creative",
  description: "Logos, hero artwork, copy.",
  primaryAction: { label: "Upload assets", href: "/events/e1/assets" },
  tone: "brand",
};

function assetItem(overrides: Partial<CustomerActionItem> = {}): CustomerActionItem {
  return {
    id: "asset-1",
    eventId: "e1",
    entityType: "asset",
    title: "Upload: Hero artwork",
    ...overrides,
  };
}

describe("OverToYou", () => {
  it("promotes the first item with the resolved next-step CTA + a why-line", () => {
    render(
      <OverToYou eventId="e1" items={[assetItem()]} nextStep={nextStep} />,
    );
    expect(screen.getByText("Over to you")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Upload assets/i });
    expect(cta).toHaveAttribute("href", "/events/e1/assets");
    expect(
      screen.getByText("So the studio can build your creative."),
    ).toBeInTheDocument();
  });

  it("does not borrow the next-step CTA when the promoted item targets a different page", () => {
    // The event-level next step says "Upload assets", but the most urgent
    // item is an onsite-contacts task on the logistics page. The button must
    // follow the task, not the unrelated next step.
    render(
      <OverToYou
        eventId="e1"
        items={[
          {
            id: "t-contacts",
            eventId: "e1",
            entityType: "task",
            title: "Provide onsite contact details",
            targetPath: "logistics",
          },
        ]}
        nextStep={nextStep}
      />,
    );
    expect(
      screen.queryByRole("link", { name: /Upload assets/i }),
    ).not.toBeInTheDocument();
    const cta = screen.getByRole("link", { name: /Start now/i });
    expect(cta).toHaveAttribute("href", "/events/e1/logistics");
  });

  it("shows a supporting row for each additional item and a see-all teaser", () => {
    render(
      <OverToYou
        eventId="e1"
        items={[
          assetItem(),
          { id: "briefing-ops", eventId: "e1", entityType: "briefing", title: "Complete the ops brief" },
        ]}
        nextStep={nextStep}
      />,
    );
    expect(screen.getByText("Complete the ops brief")).toBeInTheDocument();
    expect(
      screen.getByText("So we can plan delivery and setup for the day."),
    ).toBeInTheDocument();
    const seeAll = screen.getByRole("link", { name: /See all 2 tasks/i });
    expect(seeAll).toHaveAttribute("href", "/events/e1/actions");
  });

  it("collapses many asset uploads into one grouped row with an honest count", () => {
    render(
      <OverToYou
        eventId="e1"
        items={[
          ...[1, 2, 3, 4, 5].map((n) =>
            assetItem({ id: `asset-${n}`, title: `Upload: Asset ${n}` }),
          ),
          { id: "t1", eventId: "e1", entityType: "task", title: "Approve the proof", targetPath: "approvals" },
        ]}
        nextStep={nextStep}
      />,
    );
    // One grouped row replaces the five per-file rows…
    expect(
      screen.getByText("5 brand assets · one upload flow"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Upload: Asset 1")).not.toBeInTheDocument();
    expect(
      screen.getByText("Everything uploads in one flow — drag them all in at once."),
    ).toBeInTheDocument();
    // …and the counts reflect the grouped list, not the raw one.
    expect(screen.getByText("2 things")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See all 2 tasks/i }),
    ).toBeInTheDocument();
  });

  it("reassures and previews the next milestone when nothing is outstanding", () => {
    render(
      <OverToYou
        eventId="e1"
        items={[]}
        nextStep={nextStep}
        nextUp={{ label: "Approve the proof", targetDate: "2026-08-01" }}
      />,
    );
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
    expect(screen.getByText(/Next up: Approve the proof/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /See all/i }),
    ).not.toBeInTheDocument();
  });
});
