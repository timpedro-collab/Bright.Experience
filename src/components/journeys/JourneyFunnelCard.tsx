/** Post-play journey funnel for the report: sent → opened → clicked (→ redeemed). */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JourneyFunnel, PostPlayJourney } from "@/lib/queries/journeys";

const KIND_LABELS: Record<PostPlayJourney["kind"], string> = {
  where_to_buy: "Where to buy",
  review: "Review request",
  discount: "Discount offer",
};

export function JourneyFunnelCard({
  journey,
  funnel,
}: {
  journey: PostPlayJourney;
  funnel: JourneyFunnel;
}) {
  if (funnel.sent === 0) return null;

  const pct = (part: number) =>
    funnel.sent > 0 ? Math.round((part / funnel.sent) * 100) : 0;

  const steps = [
    { label: "Sent", count: funnel.sent, share: 100 },
    { label: "Opened", count: funnel.opened, share: pct(funnel.opened) },
    { label: "Clicked", count: funnel.clicked, share: pct(funnel.clicked) },
    ...(funnel.redeemed > 0
      ? [{ label: "Redeemed", count: funnel.redeemed, share: pct(funnel.redeemed) }]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">After the play</CardTitle>
        <p className="text-sm text-muted-foreground">
          {KIND_LABELS[journey.kind]} — “{journey.headline}”
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-foreground">{step.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {step.count.toLocaleString("en-GB")} · {step.share}%
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.max(step.share, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          First 24 hours: {funnel.within24h.opened.toLocaleString("en-GB")}{" "}
          opened, {funnel.within24h.clicked.toLocaleString("en-GB")} clicked.
        </p>
      </CardContent>
    </Card>
  );
}
