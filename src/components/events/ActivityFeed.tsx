/** Timeline-style activity feed — maps audit entries to human-readable labels with icons. */
import {
  ArrowRight,
  Upload,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Truck,
  ShieldCheck,
  FileText,
  Zap,
  Edit,
} from "lucide-react";
import type { AuditRow } from "@/lib/queries/audit";
import { cn } from "@/lib/utils";

const ACTION_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  stage_advanced: { label: "Advanced stage", icon: ArrowRight },
  asset_uploaded: { label: "Uploaded asset", icon: Upload },
  asset_accepted: { label: "Approved asset", icon: CheckCircle2 },
  asset_rejected: { label: "Rejected asset", icon: XCircle },
  approval_approved: { label: "Approved proof", icon: CheckCircle2 },
  approval_rejected: { label: "Requested revision", icon: XCircle },
  message_sent: { label: "Sent message", icon: MessageCircle },
  logistics_updated: { label: "Updated logistics", icon: Truck },
  qa_checked: { label: "Completed QA check", icon: ShieldCheck },
  briefing_submitted: { label: "Submitted briefing", icon: FileText },
  event_created: { label: "Created event", icon: Zap },
  comment_added: { label: "Added comment", icon: MessageCircle },
};

function resolveAction(action: string): { label: string; icon: React.ElementType } {
  return ACTION_MAP[action] ?? { label: action.replace(/_/g, " "), icon: Edit };
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ActivityFeedProps {
  entries: AuditRow[];
  compact?: boolean;
}

export function ActivityFeed({ entries, compact = false }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((entry, i) => {
        const { label, icon: Icon } = resolveAction(entry.action);
        const isLast = i === entries.length - 1;
        return (
          <li key={entry.id} className="relative flex gap-3 pb-4">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[11px] top-7 bottom-0 w-px bg-border/50"
              />
            )}
            <div className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
              "border-border/60 bg-card text-muted-foreground",
            )}>
              <Icon size={12} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm leading-snug", compact ? "line-clamp-1" : "")}>
                <span className="font-medium text-foreground">
                  {entry.actorName ?? "System"}
                </span>{" "}
                <span className="text-muted-foreground">{label}</span>
              </p>
              <p className="text-overline text-muted-foreground mt-0.5">
                {relativeTime(entry.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
