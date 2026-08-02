/**
 * Per-sponsor proof-of-performance — what each sponsored machine delivered
 * over the dates that sponsor paid for. Counter-only by construction: this
 * table is written to be forwarded to sponsors, so no lead detail appears.
 */
import { Handshake } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { SponsorProofRow } from "@/lib/reports/normalise";

export function SponsorProofTable({ sponsors }: { sponsors: SponsorProofRow[] }) {
  if (sponsors.length === 0) return null;

  return (
    <Card tone="subtle">
      <CardContent className="p-5">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Handshake size={15} className="text-brand" aria-hidden />
          Sponsor performance
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Each sponsor&apos;s own machine over their own dates — the numbers you
          can send them without waiting on a manual pull.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Sponsor</th>
                <th className="pb-2 pr-4 font-medium">Placement</th>
                <th className="pb-2 pr-4 text-right font-medium tabular-nums">Plays</th>
                <th className="pb-2 pr-4 text-right font-medium tabular-nums">Leads</th>
                <th className="pb-2 text-right font-medium tabular-nums">Opt-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sponsors.map((sponsor) => (
                <tr key={sponsor.slotId || sponsor.sponsorName}>
                  <td className="py-2 pr-4 font-medium text-foreground">
                    {sponsor.sponsorName}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground">
                    {[sponsor.zone, sponsor.machineLabel].filter(Boolean).join(" · ") ||
                      "—"}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-foreground">
                    {sponsor.plays.toLocaleString("en-US")}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-foreground">
                    {sponsor.leads.toLocaleString("en-US")}
                  </td>
                  <td className="py-2 text-right tabular-nums text-foreground">
                    {sponsor.optInRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
