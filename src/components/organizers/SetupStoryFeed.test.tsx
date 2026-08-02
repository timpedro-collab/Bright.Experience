import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SetupStoryFeed } from "./SetupStoryFeed";
import { buildSetupStory } from "@/lib/metrics/setup-story";

describe("SetupStoryFeed", () => {
  it("tells the preparation story newest first", () => {
    render(
      <SetupStoryFeed
        entries={buildSetupStory({
          machine: {
            createdAt: "2026-06-01T09:00:00Z",
            updatedAt: "2026-06-20T09:00:00Z",
            zone: "Hall A",
          },
          slot: {
            sponsorName: "Salesforce",
            createdAt: "2026-06-10T09:00:00Z",
            updatedAt: "2026-06-25T09:00:00Z",
          },
        })}
      />
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Sponsor confirmed");
    expect(items[0]).toHaveTextContent("Salesforce");
    expect(items[items.length - 1]).toHaveTextContent("Unit added to this show");
  });

  it("says what happens next instead of showing an empty panel", () => {
    render(<SetupStoryFeed entries={[]} />);

    expect(screen.getByText(/Nothing has happened to this unit yet/)).toBeInTheDocument();
  });

  it("explains what replaces the panel once the show opens", () => {
    render(
      <SetupStoryFeed entries={[]} liveHint="Plays and leads land here on the day." />
    );

    expect(
      screen.getByText("Plays and leads land here on the day.")
    ).toBeInTheDocument();
  });
});
