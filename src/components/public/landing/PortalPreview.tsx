/**
 * PortalPreview — the live event dashboard shown on the marketing site
 * (docs/18-design-research.md H7: the portal is the best sales asset we
 * have). A framed, non-interactive rendering of the real product surface
 * built from the same design tokens, so it stays pixel-faithful and
 * theme-aware where a screenshot would rot. Data is illustrative and
 * labelled as such.
 */
import { Zap, UserRound, Gift } from "lucide-react";

const PREVIEW_STATS = [
  { label: "Plays", value: "1,284", delta: "+41 in the last hour" },
  { label: "Leads captured", value: "1,167", delta: "96% opt-in" },
  { label: "Prizes dropped", value: "212", delta: "3 machines live" },
];

const PREVIEW_FEED = [
  {
    icon: UserRound,
    text: "New lead · marketing manager, retail",
    time: "12s ago",
  },
  { icon: Gift, text: "Prize dropped · Hyperion 02", time: "48s ago" },
  { icon: Zap, text: "Play completed · 9s dwell", time: "1m ago" },
];

export function PortalPreview() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--bb-shadow-premium)]">
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 truncate rounded-md bg-background/80 px-3 py-1 text-center text-[0.65rem] text-muted-foreground">
          portal.bright.blue / events / summer-launch / live
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            Summer Launch — Day 2
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-widest text-emerald-600">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 md:gap-3">
          {PREVIEW_STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-background p-3"
            >
              <p className="text-[0.625rem] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-heading mt-1 text-xl font-bold text-foreground tabular-nums md:text-2xl">
                {stat.value}
              </p>
              <p className="mt-0.5 truncate text-[0.625rem] text-tertiary">
                {stat.delta}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-border bg-background">
          <p className="border-b border-border px-3 py-2 text-[0.625rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Live feed
          </p>
          <ul>
            {PREVIEW_FEED.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-2.5 border-b border-border/60 px-3 py-2 text-xs last:border-b-0"
              >
                <item.icon
                  aria-hidden
                  className="size-3.5 shrink-0 text-[var(--color-bb-cobalt)]"
                />
                <span className="flex-1 truncate text-foreground/90">
                  {item.text}
                </span>
                <span className="shrink-0 text-[0.625rem] text-quaternary tabular-nums">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-center text-[0.625rem] text-muted-foreground/70">
          Illustrative data — every event gets its own live dashboard.
        </p>
      </div>
    </div>
  );
}
