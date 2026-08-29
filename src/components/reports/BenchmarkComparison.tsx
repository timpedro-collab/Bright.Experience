/** Benchmark comparison chart — horizontal bar chart comparing event metrics against category averages */
"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChartColors } from "@/components/cloud";

interface BenchmarkComparisonProps {
  eventMetrics: Record<string, number>;
  benchmarks: Record<string, number>;
  labels?: Record<string, string>;
}

/** Formats metric keys from snake_case to Title Case */
function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Renders a horizontal bar chart comparing event metrics against category benchmarks */
export function BenchmarkComparison({
  eventMetrics,
  benchmarks,
  labels,
}: BenchmarkComparisonProps) {
  // Recharts colours are SVG attributes — read live theme tokens so the
  // chart tracks Ink / Ink Light switches (contract §5). Scoped to this
  // card's subtree so the locally `.theme-light` print report resolves
  // paper tokens even when <html> is Ink (e.g. headless PDF export).
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  const colors = useChartColors(scopeRef);
  const data = Object.keys(eventMetrics).map((key) => ({
    name: labels?.[key] ?? formatLabel(key),
    "Your Event": eventMetrics[key] ?? 0,
    "Category Average": benchmarks[key] ?? 0,
  }));

  return (
    <Card className="border-border bg-card/72 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-heading text-base font-semibold text-foreground">
          Benchmark Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={scopeRef}>
        <ResponsiveContainer width="100%" height={data.length * 56 + 60}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              strokeOpacity={0.5}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: colors.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: colors.foreground, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "0.75rem",
                color: colors.foreground,
                fontSize: "0.8125rem",
              }}
              labelStyle={{ color: colors.axis }}
              itemStyle={{ color: colors.foreground }}
              cursor={{ fill: colors.grid, fillOpacity: 0.25 }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "0.75rem",
                paddingTop: "0.5rem",
                color: colors.axis,
              }}
            />
            <Bar
              dataKey="Your Event"
              fill={colors.primary}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
            <Bar
              dataKey="Category Average"
              fill={colors.accent}
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
