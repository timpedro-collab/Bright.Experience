/**
 * How a unit got to where it is, before it has done anything.
 *
 * The activity feed on a machine page is empty until the doors open, and
 * "No activity yet" is a dead end four months out. Everything that *has*
 * happened to the unit is already timestamped across four tables — it was
 * registered, it was placed, its game was submitted, it was sold, its artwork
 * arrived — so the same panel can carry the preparation trail instead.
 *
 * Every entry is derived from a stored timestamp. Nothing is inferred, so an
 * entry appearing here means it genuinely happened on that date.
 */

/** One thing that happened to this unit, newest first in the returned list. */
export interface SetupStoryEntry {
  id: string;
  label: string;
  /** Optional second line naming who or what. */
  detail?: string;
  timestamp: string;
}

export interface SetupStoryInput {
  machine?: {
    createdAt?: string | null;
    updatedAt?: string | null;
    zone?: string | null;
    mission?: string | null;
  } | null;
  config?: {
    status: string;
    submittedAt?: string | null;
    updatedAt?: string | null;
  } | null;
  slot?: {
    sponsorName?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  } | null;
  creative?: {
    name: string;
    reviewStatus: string;
    createdAt?: string | null;
  }[];
}

function push(
  entries: SetupStoryEntry[],
  entry: { id: string; label: string; detail?: string; timestamp?: string | null }
) {
  if (!entry.timestamp) return;
  entries.push({
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    timestamp: entry.timestamp,
  });
}

/**
 * The preparation trail for one unit, newest first.
 *
 * `machine.updatedAt` is only claimed as "deployment set" once the unit has a
 * zone or a job — the column moves on any write, so calling it a placement
 * before there is one would put a lie on the page.
 */
export function buildSetupStory(input: SetupStoryInput): SetupStoryEntry[] {
  const { machine, config, slot, creative = [] } = input;
  const entries: SetupStoryEntry[] = [];

  push(entries, {
    id: "registered",
    label: "Unit added to this show",
    detail: machine?.zone ? undefined : "Waiting on a zone",
    timestamp: machine?.createdAt,
  });

  if (machine?.zone || machine?.mission) {
    push(entries, {
      id: "deployment",
      label: "Deployment last set",
      detail: machine.zone ?? undefined,
      timestamp: machine.updatedAt,
    });
  }

  if (config) {
    const settled = config.status === "configured" || config.status === "tested";
    push(entries, {
      id: "config",
      label: settled
        ? config.status === "tested"
          ? "Game built and tested"
          : "Game built"
        : "Game configuration submitted",
      timestamp: config.submittedAt ?? config.updatedAt,
    });
  }

  if (slot) {
    push(entries, {
      id: "slot-opened",
      label: "Opened as sponsor inventory",
      timestamp: slot.createdAt,
    });
    if (slot.sponsorName && slot.updatedAt && slot.updatedAt !== slot.createdAt) {
      push(entries, {
        id: "slot-sold",
        label: "Sponsor confirmed",
        detail: slot.sponsorName,
        timestamp: slot.updatedAt,
      });
    }
  }

  for (const piece of creative) {
    push(entries, {
      id: `creative-${piece.name}`,
      label:
        piece.reviewStatus === "approved"
          ? "Artwork approved"
          : "Artwork received",
      detail: piece.name,
      timestamp: piece.createdAt,
    });
  }

  return entries.sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  );
}
