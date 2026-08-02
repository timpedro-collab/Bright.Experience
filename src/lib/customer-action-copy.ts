/**
 * Consequence copy for customer action items.
 *
 * Every item in the customer's "Over to you" block carries a short, plain
 * "why it matters" line so the customer understands the stakes of each task
 * (and why doing it now keeps their activation on track), not just its title.
 *
 * Pure module — no server imports — safe in client and server components.
 */
import type { CustomerActionItem } from "@/lib/queries/deadlines";

/**
 * A one-line reason the customer should action this item. Inferred from the
 * item's type and (for tasks) the section it targets, so it stays accurate as
 * new tasks are added without hand-authoring copy per task.
 */
export function actionWhyLine(item: CustomerActionItem): string {
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
