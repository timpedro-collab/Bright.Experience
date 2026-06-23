/**
 * Per-section completion status for the customer's event navigation.
 *
 * Drives the green / amber / red dots on the customer's event tabs so it's
 * instantly clear where the ball sits:
 *
 *   - red    → an outstanding action is in the customer's court.
 *   - amber  → the customer finished their part; it's pending Bright.Blue
 *              review (e.g. uploaded creative awaiting sign-off).
 *   - green  → the customer's actions here are complete and nothing is
 *              waiting on Bright.Blue.
 *   - neutral→ a reference / results tab with nothing for the customer to do
 *              (Overview, Timeline, Deadlines, Messages, Live, Leads, Reports).
 *
 * Computed from `customer_action` tasks, customer-visible assets + their
 * review state, and briefing submission state.
 */
import { createClient } from "@/lib/supabase/server";
import { SECTION_META, type EventSection } from "@/lib/event-access";

export type SectionStatus = "green" | "amber" | "red" | "neutral";

export type SectionStatusMap = Partial<Record<EventSection, SectionStatus>>;

/** Sections the customer can actually complete work in. Everything else is reference/results. */
const ACTIONABLE_SECTIONS: EventSection[] = [
  "briefing",
  "assets",
  "configuration",
  "approvals",
  "studio",
  "actions",
  "logistics",
];

const TASK_DONE = new Set(["complete", "skipped", "done"]);

/** Resolve a task's `target_path` (or `category`) to the event section it lives in. */
function routeToSection(route?: string | null): EventSection | null {
  if (!route) return null;
  const entry = (Object.entries(SECTION_META) as [EventSection, { route: string }][]).find(
    ([, meta]) => meta.route === route,
  );
  return entry ? entry[0] : null;
}

export async function getEventSectionStatus(eventId: string): Promise<SectionStatusMap> {
  const supabase = await createClient();

  const [{ data: tasks }, { data: assets }, { data: briefings }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, status, task_type, target_path, category")
      .eq("event_id", eventId)
      .eq("task_type", "customer_action"),
    supabase
      .from("assets")
      .select("id, status, review_status, customer_visible")
      .eq("event_id", eventId),
    supabase
      .from("briefing_responses")
      .select("form_type, is_submitted")
      .eq("event_id", eventId),
  ]);

  const red = new Set<EventSection>();
  const amber = new Set<EventSection>();
  const hadWork = new Set<EventSection>();

  for (const t of tasks ?? []) {
    const outstanding = !TASK_DONE.has(String(t.status));
    // The Tasks tab is a roll-up of every customer action.
    hadWork.add("actions");
    if (outstanding) red.add("actions");

    const section =
      routeToSection(t.target_path as string | null) ??
      routeToSection(t.category as string | null);
    if (section && section !== "actions") {
      hadWork.add(section);
      if (outstanding) red.add(section);
    }
  }

  for (const a of assets ?? []) {
    if (!a.customer_visible) continue;
    hadWork.add("assets");
    const status = String(a.status ?? "");
    const review = String(a.review_status ?? "");
    if (status === "required" || review === "revision_requested") {
      // Still on the customer to upload (or re-upload after feedback).
      red.add("assets");
    } else if (review === "pending_review" || status === "under_review") {
      // Customer uploaded; awaiting Bright.Blue sign-off.
      amber.add("assets");
      amber.add("approvals");
      hadWork.add("approvals");
    }
    // accepted / approved → green contributor (counted via hadWork above).
  }

  for (const b of briefings ?? []) {
    hadWork.add("briefing");
    if (!b.is_submitted) red.add("briefing");
  }

  const result: SectionStatusMap = {};
  for (const s of ACTIONABLE_SECTIONS) {
    if (red.has(s)) result[s] = "red";
    else if (amber.has(s)) result[s] = "amber";
    else if (hadWork.has(s)) result[s] = "green";
    else result[s] = "neutral";
  }
  return result;
}
