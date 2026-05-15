/** Internal recommendation engine dashboard — grouped by category with confidence scores. */
import { redirect } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { RecommendationCard } from "@/components/campaigns/RecommendationCard";
import { getUser } from "@/lib/auth";
import { isInternalRole } from "@/lib/roles";
import { getRecommendations } from "@/lib/queries/recommendations";

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

export default async function RecommendationsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const isInternal = isInternalRole(user.role);
  if (!isInternal) redirect("/");

  const allRecs = await getRecommendations();

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
    <AppShell user={user} isInternal={isInternal}>
      <PageHeader
        title="Recommendations"
        subtitle="AI-powered insights from historical event data"
      />

      {allRecs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <Lightbulb size={40} className="text-text-muted mb-3" />
          <p className="text-sm text-text-muted">
            No recommendations generated yet. Data from completed events will power insights.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <section key={group.category}>
                <h2 className="text-heading text-base font-semibold text-text-primary mb-4">
                  {group.label}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((rec, i) => (
                    <RecommendationCard key={i} recommendation={rec} />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </AppShell>
  );
}

/** Extract a human-readable summary from recommendation JSON. */
function extractSummary(json: Record<string, unknown>): string {
  if (typeof json.summary === "string") return json.summary;
  if (typeof json.title === "string") return json.title;
  if (typeof json.description === "string") return json.description;
  return "Recommendation";
}
