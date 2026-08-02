/**
 * Capture-quality proof card — shows how many junk entries the machine
 * turned away (personal-email rejections, duplicate blocks), so the lead
 * count reads as verified quality rather than raw volume (P2.1).
 */
import { ShieldCheck, MailX, CopyX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CaptureQualityCounts } from "@/lib/reports/normalise";

export function CaptureQualityCard({ counts }: { counts: CaptureQualityCounts }) {
  return (
    <Card tone="subtle">
      <CardContent className="p-5">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ShieldCheck size={15} className="text-brand" aria-hidden />
          Capture quality
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Every lead in this report passed the guardrails enforced at the
          machine — what was turned away never entered your data.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MailX size={13} aria-hidden />
              Personal emails rejected
            </p>
            <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
              {counts.rejectedDomains.toLocaleString("en-US")}
            </p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CopyX size={13} aria-hidden />
              Duplicate entries blocked
            </p>
            <p className="text-heading text-2xl font-bold tabular-nums text-foreground">
              {counts.duplicatesBlocked.toLocaleString("en-US")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
