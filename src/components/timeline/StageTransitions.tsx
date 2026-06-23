/**
 * Audit-driven list of stage transitions.
 *
 * Renders an inline editorial strip on the full timeline page so users
 * can see who advanced the event and when. Reads from `audit_entries`
 * via {@link getStageTransitions} — there's no separate transitions
 * table; we surface the audit log directly with friendly labels.
 */
import { ArrowRight, Sparkles } from "lucide-react";

import { STAGE_CONFIG } from "@/types";
import type { StageTransition } from "@/lib/queries/stage-transitions";

interface Props {
  transitions: StageTransition[];
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StageTransitions({ transitions }: Props) {
  if (transitions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No stage advances yet. Once the team moves this event forward,
        you&apos;ll see the history here.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {transitions.map((t) => {
        const from = STAGE_CONFIG[t.fromStage]?.label ?? t.fromStage;
        const to = STAGE_CONFIG[t.toStage]?.label ?? t.toStage;
        return (
          <li
            key={t.id}
            className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles size={12} className="text-brand shrink-0" />
            <span className="text-foreground">
              <span className="text-muted-foreground">{from}</span>{" "}
              <ArrowRight className="inline h-3 w-3" />{" "}
              <span className="font-medium">{to}</span>
            </span>
            <span className="text-overline text-muted-foreground tabular-nums">
              {formatTimestamp(t.occurredAt)}
              {t.actorName ? ` · ${t.actorName}` : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
