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

import { cn } from "@/lib/utils";
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

const FALLBACK: ChartColors = {
  primary: "hsl(230, 93%, 53%)",
  accent: "hsl(190, 90%, 50%)",
  grid: "hsl(217, 33%, 18%)",
  axis: "hsl(215, 20%, 55%)",
  tooltipBg: "hsl(222, 44%, 9%)",
  tooltipBorder: "hsl(217, 33%, 18%)",
  foreground: "hsl(210, 40%, 96%)",
};

function readColors(): ChartColors {
  if (typeof window === "undefined") return FALLBACK;
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fb: string) =>
    cs.getPropertyValue(name).trim() || fb;
  return {
    primary: get("--color-primary", FALLBACK.primary),
    accent: get(
      "--color-bb-cyan",
      get("--color-bb-cobalt-soft", FALLBACK.accent),
    ),
    grid: get("--color-border", FALLBACK.grid),
    axis: get("--color-muted-foreground", FALLBACK.axis),
    tooltipBg: get("--color-card", FALLBACK.tooltipBg),
    tooltipBorder: get("--color-border", FALLBACK.tooltipBorder),
    foreground: get("--color-foreground", FALLBACK.foreground),
  };
}

/** Live design-token colours for charts, reactive to theme switches. */
export function useChartColors(): ChartColors {
  const [colors, setColors] = React.useState<ChartColors>(FALLBACK);

  React.useEffect(() => {
    const update = () => setColors(readColors());
    update();
    // The theme toggle flips a class on <html>; re-read tokens on change.
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

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
  const colors = useChartColors();
  const t = tooltipStyles(colors);
  const colorFor = (s: CloudSeries) =>
    s.tone === "accent" ? colors.accent : colors.primary;

  return (
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
  const colors = useChartColors();
  const t = tooltipStyles(colors);
  const gradientId = React.useId();

  return (
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
  );
}

/** Tiny class passthrough used by callers wanting to merge wrapper styles. */
export const chartCardMerge = cn;
