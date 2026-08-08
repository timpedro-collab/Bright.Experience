/**
 * Consequence copy for customer action items.
 *
 * Every item in the customer's "Over to you" block carries a short, plain
 * "why it matters" line so the customer understands the stakes of each task
 * (and why doing it now keeps their activation on track), not just its title.
 *
 * Pure module — no server imports — safe in client and server components.
 */
import type {
  CustomerActionItem,
  DeadlineUrgency,
} from "@/lib/queries/deadlines";

/** Synthetic id for the single row that replaces a pile of asset uploads. */
export const GROUPED_ASSETS_ID = "grouped-assets";

/** Worst-first ranking so the grouped row inherits its scariest member. */
const URGENCY_RANK: Record<DeadlineUrgency, number> = {
  on_track: 0,
  due_soon: 1,
  overdue: 2,
};

/**
 * Collapse 2+ asset-upload actions into one synthetic row — "N brand assets ·
 * one upload flow" — in the position of the first asset item. Ten near-identical
 * "Upload X" rows all pointing at the same assets page read as nagging; one row
 * with one CTA reads as clarity. The synthetic row inherits the earliest due
 * date and the worst urgency of its members so nothing gets calmer than it is.
 * Lists with 0 or 1 asset items are returned unchanged.
 */
export function groupAssetActions(
  items: CustomerActionItem[],
): CustomerActionItem[] {
  const assets = items.filter((i) => i.entityType === "asset");
  if (assets.length < 2) return items;

  const earliestDueDate = assets.reduce<string | undefined>((acc, a) => {
    if (!a.dueDate) return acc;
    if (!acc) return a.dueDate;
    return new Date(a.dueDate).getTime() < new Date(acc).getTime()
      ? a.dueDate
      : acc;
  }, undefined);

  const worstUrgency = assets.reduce<DeadlineUrgency | undefined>((acc, a) => {
    if (!a.urgency) return acc;
    if (!acc) return a.urgency;
    return URGENCY_RANK[a.urgency] > URGENCY_RANK[acc] ? a.urgency : acc;
  }, undefined);

  const groupedItem: CustomerActionItem = {
    id: GROUPED_ASSETS_ID,
    eventId: assets[0].eventId,
    entityType: "asset",
    title: `${assets.length} brand assets · one upload flow`,
    dueDate: earliestDueDate,
    urgency: worstUrgency,
  };

  const grouped: CustomerActionItem[] = [];
  let placed = false;
  for (const item of items) {
    if (item.entityType !== "asset") {
      grouped.push(item);
    } else if (!placed) {
      grouped.push(groupedItem);
      placed = true;
    }
  }
  return grouped;
}

/**
 * A one-line reason the customer should action this item. Inferred from the
 * item's type and (for tasks) the section it targets, so it stays accurate as
 * new tasks are added without hand-authoring copy per task.
 */
export function actionWhyLine(item: CustomerActionItem): string {
  if (item.id === GROUPED_ASSETS_ID) {
    return "Everything uploads in one flow — drag them all in at once.";
  }

  if (item.entityType === "asset") {
    return "So the studio can build your creative.";
  }

  if (item.entityType === "briefing") {
    return item.id === "briefing-ops"
      ? "So we can plan delivery and setup for the day."
      : "So the studio can start designing your activation.";
  }

  // Tasks: infer from the section the task sends the customer to.
  switch (item.targetPath) {
    case "assets":
      return "So the studio can build your creative.";
    case "approvals":
      return "So we can lock the build and stay on schedule.";
    case "briefing":
      return "So the team can start designing your activation.";
    case "logistics":
      return "So we can schedule delivery to your venue.";
    default:
      return "Keeps your activation on track.";
  }
}
