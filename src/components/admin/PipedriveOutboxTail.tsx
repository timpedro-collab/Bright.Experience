/**
 * Compact tail of the last N pipedrive_outbox rows.
 *
 * Server component — receives already-shaped rows from the page.
 * Each row shows status (sent / pending / failed), kind, the note
 * title where applicable, and the most recent error string. Used by
 * the AE to debug "why didn't this note show up in Pipedrive."
 */

import { Card, CardContent } from "@/components/ui/card";
import { timeSince } from "@/lib/dates";
import { cn } from "@/lib/utils";

import type { OutboxEntry } from "@/app/admin/integrations/pipedrive/page";

const MAX_ATTEMPTS = 3;

export function PipedriveOutboxTail({ rows }: { rows: OutboxEntry[] }) {
  return (
    <Card tone="subtle">
      <CardContent className="p-0">
        <div className="border-b border-border/60 px-5 py-3">
          <p className="text-overline text-muted-foreground">Outbox tail</p>
          <p className="text-sm font-medium text-foreground">
            Last 20 Pipedrive writes
          </p>
        </div>
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            The outbox is empty. Notes will appear here as they fire.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const status: "sent" | "failed" | "pending" = row.sentAt
                ? "sent"
                : row.attempts >= MAX_ATTEMPTS
                  ? "failed"
                  : "pending";
              return (
                <li key={row.id} className="flex items-center gap-4 px-5 py-3">
                  <StatusChip status={status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {row.title ?? prettifyKind(row.kind)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {row.kind} · deal {row.dealId ?? "—"} · attempts {row.attempts}
                      {row.lastError ? ` · ${row.lastError}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-xs text-muted-foreground">
                    {timeSince(row.sentAt ?? row.createdAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StatusChip({ status }: { status: "sent" | "failed" | "pending" }) {
  const classes = {
    sent: "border-success/30 bg-success/10 text-success",
    failed: "border-destructive/30 bg-destructive/10 text-destructive",
    pending: "border-warning/30 bg-warning/10 text-warning",
  }[status];
  const label = {
    sent: "Sent",
    failed: "Failed",
    pending: "Pending",
  }[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap min-w-[70px] justify-center",
        classes
      )}
    >
      {label}
    </span>
  );
}

function prettifyKind(kind: string): string {
  if (kind === "note") return "Pipedrive note";
  if (kind === "custom_field_update") return "Custom field update";
  return kind;
}
