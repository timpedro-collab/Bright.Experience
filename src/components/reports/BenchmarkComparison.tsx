/** Benchmark comparison chart — horizontal bar chart comparing event metrics against category averages */
"use client";

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
        <ResponsiveContainer width="100%" height={data.length * 56 + 60}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(222 24% 68% / 0.08)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "hsl(222 15% 55%)", fontSize: 11 }}
              axisLine={{ stroke: "hsl(222 24% 68% / 0.12)" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "hsl(220 20% 90%)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(233 56% 11%)",
                border: "1px solid hsl(222 24% 68% / 0.15)",
                borderRadius: "0.75rem",
                color: "hsl(220 20% 90%)",
                fontSize: "0.8125rem",
              }}
              cursor={{ fill: "hsl(222 24% 68% / 0.04)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: "0.5rem" }}
            />
            <Bar
              dataKey="Your Event"
              fill="hsl(230 93% 53%)"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
            <Bar
              dataKey="Category Average"
              fill="hsl(222 15% 55% / 0.4)"
              radius={[0, 4, 4, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
