/**
 * The ops command center has been consolidated into the internal home
 * ("Command center") — same portfolio KPIs, work queues, by-stage chart, and
 * the "Needs attention" list now live on `/`. This route redirects so old
 * links and bookmarks keep working.
 */
import { redirect } from "next/navigation";

export default function OpsCommandCenterPage() {
  redirect("/");
}
