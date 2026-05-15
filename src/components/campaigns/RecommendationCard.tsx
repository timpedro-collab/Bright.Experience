/** Recommendation card showing category, confidence, and actionable summary. */
import { Lightbulb, Zap, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  recommendation: {
    category: string;
    confidence: number;
    summary: string;
    details: Record<string, unknown>;
  };
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  machine_game_combo: {
    label: "Machine + Game",
    icon: Zap,
    color: "text-brand",
  },
  package_for_objective: {
    label: "Package Suggestion",
    icon: Package,
    color: "text-success",
  },
  location_performance: {
    label: "Location Insight",
    icon: MapPin,
    color: "text-warning",
  },
};

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const config = CATEGORY_CONFIG[recommendation.category] ?? {
    label: recommendation.category,
    icon: Lightbulb,
    color: "text-brand",
  };
  const Icon = config.icon;
  const confidencePct = Math.round(recommendation.confidence * 100);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl bg-muted/40"
          )}
        >
          <Icon size={18} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <Badge className="border-0 bg-muted text-muted-foreground text-xs mb-1">
            {config.label}
          </Badge>
          <CardTitle className="text-sm font-semibold text-text-primary leading-snug">
            {recommendation.summary}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">Confidence</span>
            <span className="text-xs font-medium text-text-secondary tabular-nums">
              {confidencePct}%
            </span>
          </div>
          <Progress value={confidencePct} className="h-2" />
        </div>

        {recommendation.details.sampleSize !== undefined && (
          <p className="text-xs text-text-muted">
            Based on {String(recommendation.details.sampleSize)} events
          </p>
        )}
      </CardContent>
    </Card>
  );
}
