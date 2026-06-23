/**
 * Post-show engagement report sections — survey & sentiment (with NPS),
 * audience demographics, and digital follow-through (social + QR). These
 * replace the old cost-per-lead / projected-revenue panels with the richer
 * data the live and post-show reports actually surface.
 */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Share2, QrCode, Star, Users } from "lucide-react";
import type { SurveyResult } from "@/lib/reports/normalise";
import { formatNumberUS } from "@/lib/currency";

const AGE_BAND_ORDER = ["18-24", "25-34", "35-44", "45-54", "55+"];

/** Survey scores plus a headline satisfaction / NPS figure. */
export function SurveySentimentCard({
  survey,
  npsScore,
}: {
  survey: SurveyResult[];
  npsScore: number | null;
}) {
  if (survey.length === 0 && npsScore == null) return null;
  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-heading text-base font-semibold text-foreground">
          Survey &amp; sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        {npsScore != null && (
          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-brand" />
              <span className="text-sm text-muted-foreground">
                Satisfaction score
              </span>
            </div>
            <span className="text-2xl font-bold text-heading tabular-nums">
              {npsScore.toFixed(1)}
              <span className="text-sm font-medium text-muted-foreground">
                {" "}
                / 5
              </span>
            </span>
          </div>
        )}
        {survey.map((s) => (
          <div key={s.question} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{s.question}</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {s.score.toFixed(1)}
              </span>
            </div>
            <ProgressBar value={s.score} max={5} size="sm" />
            <p className="text-overline text-muted-foreground">
              {formatNumberUS(s.responses)} responses
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Audience demographic split (age bands). */
export function AudienceDemographicsCard({
  demographics,
}: {
  demographics: Record<string, number>;
}) {
  const entries = Object.entries(demographics);
  if (entries.length === 0) return null;
  const ordered = entries.sort(
    (a, b) => AGE_BAND_ORDER.indexOf(a[0]) - AGE_BAND_ORDER.indexOf(b[0])
  );
  const max = Math.max(...ordered.map(([, v]) => v), 1);
  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-heading text-base font-semibold text-foreground">
          <Users size={16} className="text-brand" />
          Audience demographics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {ordered.map(([band, pct]) => (
          <div key={band} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{band}</span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {pct}%
              </span>
            </div>
            <ProgressBar value={pct} max={max} size="sm" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Social shares + QR scans — the digital follow-through after the play. */
export function DigitalFollowThroughCard({
  socialShares,
  qrScans,
  totalSamples,
}: {
  socialShares: number | null;
  qrScans: number | null;
  totalSamples: number | null;
}) {
  const items = [
    socialShares != null
      ? { icon: Share2, label: "Social shares", value: socialShares }
      : null,
    qrScans != null
      ? { icon: QrCode, label: "QR scans", value: qrScans }
      : null,
    totalSamples != null
      ? { icon: Users, label: "Samples distributed", value: totalSamples }
      : null,
  ].filter((x): x is { icon: typeof Share2; label: string; value: number } => x !== null);

  if (items.length === 0) return null;

  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-heading text-base font-semibold text-foreground">
          Digital follow-through
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl border border-border/60 bg-muted/30 p-4"
              >
                <Icon size={16} className="text-brand" />
                <p className="mt-2 text-2xl font-bold text-heading tabular-nums">
                  {formatNumberUS(item.value)}
                </p>
                <p className="text-overline text-muted-foreground">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
