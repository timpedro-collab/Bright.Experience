/**
 * Cloud-grade chart primitives.
 *
 * Recharts renders colours as SVG *attributes*, which don't resolve CSS
 * custom properties — so a chart hard-coded with dark-mode colours looks
 * broken once the app flips to the light Cloud palette. `useChartColors`
 * solves that by reading the live computed design tokens off `<html>` and
 * re-reading them whenever the theme class changes, so every chart tracks
 * the active palette in both modes.
 *
 * `ChartCard` is the GlassCard wrapper; `CloudBarChart` and
 * `CloudAreaChart` are the two Cloud-signature chart shapes (soft dashed
 * horizontal grid, no axis lines, gradient fills).
 */
"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { LineChart as LineChartIcon } from "lucide-react";

import { GlassCard, GlassCardHeader } from "./GlassCard";

export interface ChartColors {
  primary: string;
  accent: string;
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  foreground: string;
}

// Ink defaults — used during SSR / first paint before the live design
// tokens are read off <html>, so charts don't flash light-mode colours on
// the Ink-default app. useChartColors() overwrites these on mount and
// tracks theme switches thereafter.
const FALLBACK: ChartColors = {
  primary: "hsl(230, 93%, 53%)",
  accent: "#00bfe8",
  grid: "rgba(255, 255, 255, 0.1)",
  axis: "rgba(255, 255, 255, 0.64)",
  tooltipBg: "hsl(240, 45%, 10%)",
  tooltipBorder: "rgba(255, 255, 255, 0.12)",
  foreground: "hsl(0, 0%, 100%)",
};

function readColors(scope?: HTMLElement | null): ChartColors {
  if (typeof window === "undefined") return FALLBACK;
  // Read from the chart's own subtree when a scope is provided, so charts
  // inside a locally-scoped `.theme-light` / `.theme-dark` wrapper (print
  // pages, force-Ink surfaces) resolve the nearest theme's tokens instead
  // of whatever <html> happens to carry.
  const cs = getComputedStyle(scope ?? document.documentElement);
  const get = (name: string, fb: string) =>
    cs.getPropertyValue(name).trim() || fb;
  return {
    primary: get("--color-primary", FALLBACK.primary),
    // Theme-aware accent cyan (darkened under `.theme-light`).
    accent: get(
      "--color-brand-cyan",
      get("--color-bb-cobalt-soft", FALLBACK.accent),
    ),
    grid: get("--color-border", FALLBACK.grid),
    axis: get("--color-muted-foreground", FALLBACK.axis),
    // Popover, not card — the Ink card token is translucent white and
    // would render tooltips see-through over chart bars.
    tooltipBg: get("--color-popover", FALLBACK.tooltipBg),
    tooltipBorder: get("--color-border", FALLBACK.tooltipBorder),
    foreground: get("--color-foreground", FALLBACK.foreground),
  };
}

/**
 * Live design-token colours for charts, reactive to theme switches.
 *
 * Pass a `scopeRef` pointing at an element inside the chart's subtree when
 * the chart can render under a local theme scope (e.g. a `.theme-light`
 * print page or a `.theme-dark` cinematic surface); without it, tokens are
 * read off `<html>` and only track the global theme.
 */
export function useChartColors(
  scopeRef?: React.RefObject<HTMLElement | null>
): ChartColors {
  const [colors, setColors] = React.useState<ChartColors>(FALLBACK);

  React.useEffect(() => {
    const update = () => setColors(readColors(scopeRef?.current));
    update();
    // The theme toggle flips a class on <html>; re-read tokens on change.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [scopeRef]);

  return colors;
}

export function ChartCard({
  title,
  description,
  action,
  height = 280,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassCard className={className}>
      <GlassCardHeader title={title} description={description} action={action} />
      <div className="p-5 pt-2">
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Shared in-chart placeholder shown when a Cloud chart has no data. Fills
 * the chart's allotted height so the card keeps its shape instead of
 * collapsing to bare axes. Centralised here so every chart shape (bar,
 * area, and any future ones) renders an identical, theme-aware empty state.
 */
export function ChartEmpty({ message }: { message?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <LineChartIcon className="size-5" />
      </span>
      <p className="text-sm text-muted-foreground">
        {message ?? "No data to chart yet"}
      </p>
    </div>
  );
}

/** Skeleton shown while a Cloud chart's data is loading. */
export function ChartLoading() {
  return (
    <div className="flex h-full w-full items-end gap-2 px-1 pb-1" aria-hidden>
      {[0.45, 0.7, 0.35, 0.85, 0.55, 0.95, 0.6, 0.4].map((h, i) => (
        <div
          key={i}
          className="skeleton flex-1 rounded-t-md"
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );
}

function tooltipStyles(colors: ChartColors) {
  return {
    contentStyle: {
      backgroundColor: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      borderRadius: 12,
      color: colors.foreground,
      fontSize: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    } as React.CSSProperties,
    labelStyle: { color: colors.axis },
    itemStyle: { color: colors.foreground },
    cursor: { fill: colors.grid, fillOpacity: 0.25 },
  };
}

export interface CloudSeries {
  key: string;
  name: string;
  /** Which token to colour the series with. Defaults to `primary`. */
  tone?: "primary" | "accent";
}

export function CloudBarChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  showLegend,
}: {
  data: T[];
  xKey: keyof T & string;
  series: CloudSeries[];
  showLegend?: boolean;
}) {
  // Scope token reads to this chart's subtree so local theme scopes
  // (print pages, force-Ink surfaces) resolve the correct palette.
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  const colors = useChartColors(scopeRef);
  const t = tooltipStyles(colors);
  const colorFor = (s: CloudSeries) =>
    s.tone === "accent" ? colors.accent : colors.primary;

  if (!data || data.length === 0) return <ChartEmpty />;

  return (
    <div ref={scopeRef} className="h-full w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.grid}
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey={xKey as never}
          tick={{ fill: colors.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: colors.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={t.contentStyle}
          labelStyle={t.labelStyle}
          itemStyle={t.itemStyle}
          cursor={t.cursor}
        />
        {showLegend && (
          <Legend wrapperStyle={{ fontSize: 12, color: colors.axis }} />
        )}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            fill={colorFor(s)}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

export function CloudAreaChart<T extends Record<string, unknown>>({
  data,
  xKey,
  yKey,
  name,
}: {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  name?: string;
}) {
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  const colors = useChartColors(scopeRef);
  const t = tooltipStyles(colors);
  const gradientId = React.useId();

  if (!data || data.length === 0) return <ChartEmpty />;

  return (
    <div ref={scopeRef} className="h-full w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.primary} stopOpacity={0.28} />
            <stop offset="100%" stopColor={colors.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={colors.grid}
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey={xKey as never}
          tick={{ fill: colors.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: colors.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={t.contentStyle}
          labelStyle={t.labelStyle}
          itemStyle={t.itemStyle}
          cursor={{ stroke: colors.grid }}
        />
        <Area
          type="monotone"
          dataKey={yKey as never}
          name={name}
          stroke={colors.primary}
          strokeWidth={3}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: colors.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
