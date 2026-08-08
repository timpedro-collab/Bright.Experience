/** Internal recommendation engine dashboard — grouped by category with confidence scores. */
import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { AdminPageShell, EditorialEyebrow } from "@/components/brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { RecommendationCard } from "@/components/campaigns/RecommendationCard";

import { getUser } from "@/lib/auth";
import { canViewCommercial } from "@/lib/roles";
import { getRecommendations } from "@/lib/queries/recommendations";
import { getUnreadCount } from "@/lib/queries/notifications";

const CATEGORY_ORDER = [
  "machine_game_combo",
  "package_for_objective",
  "location_performance",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  machine_game_combo: "Machine + Game Combinations",
  package_for_objective: "Packages for Objectives",
  location_performance: "Location Performance Insights",
};

export const metadata = {
  title: "Recommendations",
};

export default async function RecommendationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!canViewCommercial(user.role)) redirect("/");

  const [allRecs, unread] = await Promise.all([
    getRecommendations(),
    getUnreadCount(user.id),
  ]);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: allRecs
      .filter((r) => r.category === cat)
      .map((r) => ({
        category: r.category,
        confidence: Number(r.confidence_score ?? 0),
        summary: extractSummary(r.recommendation_json as Record<string, unknown>),
        details: {
          ...(r.recommendation_json as Record<string, unknown>),
          sampleSize: r.sample_size,
        },
      })),
  }));

  return (
    <AdminPageShell
      user={user}
      unreadCount={unread}
      section="Recommendations"
      title="The pattern engine."
      subtitle="Insights drawn from historical event data — combinations, packages, and locations that consistently land."
    >
      <div className="py-8">
        {allRecs.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No recommendations yet"
            description="Data from completed events will power insights. Come back after the next few wraps."
          />
        ) : (
          <div className="space-y-10">
            {grouped
              .filter((g) => g.items.length > 0)
              .map((group) => (
                <section key={group.category}>
                  <EditorialEyebrow>{group.label}</EditorialEyebrow>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.items.map((rec, i) => (
                      <RecommendationCard key={i} recommendation={rec} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

function extractSummary(json: Record<string, unknown>): string {
  if (typeof json.summary === "string") return json.summary;
  if (typeof json.title === "string") return json.title;
  if (typeof json.description === "string") return json.description;
  return "Recommendation";
}
