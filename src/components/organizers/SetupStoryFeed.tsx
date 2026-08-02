/**
 * What has happened to this unit so far.
 *
 * Takes the slot the live activity feed occupies once a show is running. Four
 * months out there is no activity, but there is history — allocated, placed,
 * game built, sold, artwork in — and showing it is the difference between a
 * page that looks broken and one that looks prepared.
 */

import { Card, CardContent } from "@/components/ui/card";
import { formatDateMedium } from "@/lib/dates";
import type { SetupStoryEntry } from "@/lib/metrics/setup-story";

interface SetupStoryFeedProps {
  entries: SetupStoryEntry[];
  /** What lands in this panel once the doors open. */
  liveHint?: string;
  title?: string;
}

export function SetupStoryFeed({
  entries,
  liveHint,
  title = "How this unit got here",
}: SetupStoryFeedProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-heading mb-4 text-sm font-semibold text-foreground">
          {title}
        </p>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing has happened to this unit yet. Setting its zone and job is
            the first step.
          </p>
        ) : (
          <ol className="relative space-y-4 border-l border-border/60 pl-4">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.3rem] top-1.5 size-1.5 rounded-full bg-muted-foreground/50"
                />
                <p className="text-sm text-foreground">{entry.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateMedium(entry.timestamp)}
                  {entry.detail ? ` · ${entry.detail}` : ""}
                </p>
              </li>
            ))}
          </ol>
        )}
        {liveHint && (
          <p className="mt-4 border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {liveHint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
