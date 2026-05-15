/** Hourly bar chart — displays plays and leads by hour using recharts */
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HourlyDataPoint {
  hour: number;
  plays: number;
  leads: number;
}

interface HourlyChartProps {
  data: HourlyDataPoint[];
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}${period}`;
}

export function HourlyChart({ data }: HourlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: formatHour(d.hour),
  }));

  return (
    <Card className="border-glass-border bg-surface-glass backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-heading text-base font-semibold text-text-primary">
          Activity by Hour
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(233, 56%, 12%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.7)" }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
              />
              <Bar
                dataKey="plays"
                fill="hsl(var(--brand))"
                radius={[4, 4, 0, 0]}
                name="Plays"
              />
              <Bar
                dataKey="leads"
                fill="hsl(var(--success))"
                radius={[4, 4, 0, 0]}
                name="Leads"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
