/**
 * Horizontal revenue-split bar — two or more segments with labels and
 * optional captions. Extracted from the NRS money-flow diagram.
 */
import { cn } from "@/lib/utils";

export interface SplitFlowSegment {
  label: string;
  fraction: number;
  caption?: string;
  emphasis?: boolean;
}

export interface SplitFlowProps {
  /** e.g. "One dollar of sponsorship" or "One pound of placement revenue" */
  title?: string;
  segments: SplitFlowSegment[];
  className?: string;
}

/** Renders a rounded split bar with proportional segment widths. */
export function SplitFlow({ title, segments, className }: SplitFlowProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title ? (
        <p className="text-sm font-semibold text-foreground">{title}</p>
      ) : null}
      <div className="flex h-14 w-full overflow-hidden rounded-xl border">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={cn(
              "flex items-center justify-center px-3 text-center",
              segment.emphasis ? "bg-primary" : "bg-muted",
            )}
            style={{ width: `${segment.fraction * 100}%` }}
          >
            <p
              className={cn(
                "text-sm font-semibold",
                segment.emphasis && "text-primary-foreground",
              )}
            >
              {segment.label}
              {segment.caption ? (
                <span
                  className={cn(
                    "block text-[0.68rem] font-normal",
                    segment.emphasis
                      ? "opacity-85"
                      : "text-muted-foreground",
                  )}
                >
                  {segment.caption}
                </span>
              ) : null}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
