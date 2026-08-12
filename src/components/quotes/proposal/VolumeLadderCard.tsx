/**
 * Customer-facing multi-event volume ladder table for revealed proposals.
 * Static server component — rendered only when the feature flag is enabled.
 */
import { Card } from "@/components/ui/card";
import {
  VOLUME_LADDER,
  formatDiscount,
  ladderedFeePence,
} from "@/lib/pricing/volume-ladder";
import { formatGBP } from "@/lib/roi";

interface VolumeLadderCardProps {
  baseFeePence: number;
}

/** Post-reveal volume ladder reference for multi-event program pricing. */
export function VolumeLadderCard({ baseFeePence }: VolumeLadderCardProps) {
  if (baseFeePence <= 0) return null;

  return (
    <Card tone="subtle" className="mt-10 p-8">
      <h3 className="text-heading text-lg font-bold text-foreground">
        Planning more than one activation?
      </h3>
      <p className="mt-2 max-w-[64ch] text-sm text-muted-foreground">
        Brands that commit to a program year earn a written-down rate. The
        discount is agreed before you book a second event, so scaling never
        reopens the negotiation.
      </p>
      <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Commitment</th>
              <th className="px-4 py-2 font-medium">Per-event fee</th>
              <th className="px-4 py-2 font-medium">Saving</th>
            </tr>
          </thead>
          <tbody>
            {VOLUME_LADDER.map((rung) => (
              <tr
                key={rung.label}
                className="border-b border-border/40 last:border-0"
              >
                <td className="px-4 py-2 text-foreground">{rung.label}</td>
                <td className="px-4 py-2 tabular-nums text-foreground">
                  {formatGBP(
                    ladderedFeePence(baseFeePence, rung.minEvents) / 100,
                  )}
                </td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">
                  {rung.discount === 0 ? (
                    <span aria-label="No saving">&mdash;</span>
                  ) : (
                    formatDiscount(rung.discount)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-[64ch] text-xs text-muted-foreground leading-relaxed">
        Your event lead confirms the rung with you when you plan the year.
        Figures shown are per activation, all-in.
      </p>
    </Card>
  );
}
