/** Inline action buttons for the reports page (generate + publish). */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { generateEventReport, publishReport } from "@/app/actions/reports";

export function GenerateReportButton({ eventId }: { eventId: string }) {
  return (
    <form
      action={async () => {
        await generateEventReport(eventId);
      }}
      className="flex justify-center pt-4"
    >
      <Button type="submit">
        <FileText size={14} className="mr-2" /> Generate report
      </Button>
    </form>
  );
}

export function PublishReportBanner({
  reportId,
  suggestedPartner,
}: {
  reportId: string;
  suggestedPartner?: { id: string; name: string } | null;
}) {
  const [coBrand, setCoBrand] = useState(true);

  return (
    <div className="mb-6 rounded-md border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Draft report</p>
        <p className="text-xs text-muted-foreground">
          This report is not yet visible to the customer. Review the metrics
          and publish when ready.
        </p>
        {suggestedPartner && (
          <div className="mt-3 flex items-start gap-2">
            <Checkbox
              id={`co-brand-${reportId}`}
              checked={coBrand}
              onCheckedChange={(checked) => setCoBrand(checked === true)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor={`co-brand-${reportId}`}>
                Co-brand for {suggestedPartner.name}
              </Label>
              <p className="text-xs text-muted-foreground">
                Their logo and accent colour appear on the shared page.
              </p>
            </div>
          </div>
        )}
      </div>
      <form
        action={async () => {
          if (suggestedPartner) {
            await publishReport(reportId, {
              brandPartnerId: coBrand ? suggestedPartner.id : null,
            });
            return;
          }
          await publishReport(reportId);
        }}
      >
        <Button type="submit" size="sm">
          Review &amp; Publish
        </Button>
      </form>
    </div>
  );
}
