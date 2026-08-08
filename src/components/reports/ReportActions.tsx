/** Inline action buttons for the reports page (generate + publish). */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Receipt } from "lucide-react";
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
  invoiceIssued = true,
}: {
  reportId: string;
  suggestedPartner?: { id: string; name: string } | null;
  /** When false, nudge the publisher to invoice first (never blocks). */
  invoiceIssued?: boolean;
}) {
  const [coBrand, setCoBrand] = useState(true);
  const [note, setNote] = useState("");

  return (
    <div className="mb-6 rounded-md border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Draft report</p>
          <p className="text-xs text-muted-foreground">
            This report is not yet visible to the customer. Review the metrics
            and publish when ready.
          </p>
          {!invoiceIssued && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <Receipt size={13} className="mt-0.5 shrink-0" aria-hidden />
              No invoice issued for this event yet. Best practice: invoice
              first, so the results land after the ask.
            </p>
          )}
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
            await publishReport(reportId, {
              ...(suggestedPartner
                ? { brandPartnerId: coBrand ? suggestedPartner.id : null }
                : {}),
              personalNote: note.trim() || null,
            });
          }}
        >
          <Button type="submit" size="sm">
            Review &amp; Publish
          </Button>
        </form>
      </div>
      <div className="mt-3">
        <Label
          htmlFor={`personal-note-${reportId}`}
          className="text-xs text-muted-foreground"
        >
          Personal note (optional) — appears signed with your name at the top
          of their report
        </Label>
        <Textarea
          id={`personal-note-${reportId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={600}
          rows={2}
          placeholder="It was a pleasure running this one — day two's queue said it all. Call me when you've read it."
          className="mt-1.5 bg-background/60 text-sm"
        />
      </div>
    </div>
  );
}
